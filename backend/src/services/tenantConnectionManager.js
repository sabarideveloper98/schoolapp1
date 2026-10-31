const mongoose = require('mongoose');
const { AsyncLocalStorage } = require('async_hooks');
const path = require('path');
const fs = require('fs');

const asyncLocalStorage = new AsyncLocalStorage();

// Central models that always reside in the central cluster database
const CENTRAL_MODEL_NAMES = new Set([
    'School',
    'User',
    'Subscription',
    'SubscriptionConfig',
    'AuditLog'
]);

// Connection cache: databaseName -> mongoose.Connection
const connectionCache = new Map();

// Schema registry: modelName -> mongoose.Schema
const schemaRegistry = new Map();

/**
 * Register a model schema for dynamic tenant binding
 * @param {string} modelName 
 * @param {mongoose.Schema} schema 
 */
const registerSchema = (modelName, schema) => {
    if (schema) {
        schemaRegistry.set(modelName, schema);
    }
};

/**
 * Get or switch to tenant database connection
 * @param {string} dbName 
 * @returns {mongoose.Connection}
 */
const getTenantConnection = (dbName) => {
    if (!dbName) {
        return mongoose.connection;
    }
    const cleanDbName = String(dbName).trim();
    if (!cleanDbName || cleanDbName === mongoose.connection.name) {
        return mongoose.connection;
    }

    if (connectionCache.has(cleanDbName)) {
        return connectionCache.get(cleanDbName);
    }

    // useDb with useCache: true reuses the underlying connection pool safely
    const tenantDb = mongoose.connection.useDb(cleanDbName, { useCache: true });
    connectionCache.set(cleanDbName, tenantDb);
    return tenantDb;
};

/**
 * Run a callback within an active tenant execution context
 * @param {Object} tenantContext - { tenantDb, schoolId, dbName }
 * @param {Function} callback 
 */
const runInTenantContext = (tenantContext, callback) => {
    return asyncLocalStorage.run(tenantContext, callback);
};

/**
 * Get the current tenant context from AsyncLocalStorage
 */
const getTenantContext = () => {
    return asyncLocalStorage.getStore() || null;
};

/**
 * Get the active database connection for the current execution context
 */
const getActiveConnection = () => {
    const store = asyncLocalStorage.getStore();
    if (store && store.tenantDb) {
        return store.tenantDb;
    }
    return mongoose.connection;
};

/**
 * Create a transparent proxy for a tenant model
 * Routes queries to tenantDb when in tenant context, or central mongoose connection when outside
 * @param {string} modelName 
 * @param {mongoose.Schema} schema 
 * @returns {Proxy<mongoose.Model>}
 */
const createTenantModelProxy = (modelName, schema) => {
    registerSchema(modelName, schema);

    // Register on default mongoose connection so default queries work
    if (!mongoose.models[modelName]) {
        mongoose.model(modelName, schema);
    }

    const isCentral = CENTRAL_MODEL_NAMES.has(modelName);

    const resolveActualModel = () => {
        if (isCentral) {
            return mongoose.models[modelName] || mongoose.model(modelName, schema);
        }
        const store = asyncLocalStorage.getStore();
        if (store && store.tenantDb) {
            const tenantDb = store.tenantDb;
            if (tenantDb.models && tenantDb.models[modelName]) {
                return tenantDb.models[modelName];
            }
            return tenantDb.model(modelName, schema);
        }
        return mongoose.models[modelName] || mongoose.model(modelName, schema);
    };

    const targetFn = function (...args) {
        const actual = resolveActualModel();
        return new actual(...args);
    };

    return new Proxy(targetFn, {
        get(target, prop) {
            const actual = resolveActualModel();
            const val = Reflect.get(actual, prop);
            if (typeof val === 'function') {
                return val.bind(actual);
            }
            return val;
        },
        set(target, prop, value) {
            const actual = resolveActualModel();
            return Reflect.set(actual, prop, value);
        },
        construct(target, args) {
            const actual = resolveActualModel();
            return new actual(...args);
        },
        apply(target, thisArg, args) {
            const actual = resolveActualModel();
            return actual.apply(actual, args);
        }
    });
};

/**
 * Provision a brand new tenant database with all models and indexes initialized
 * @param {string} dbName 
 * @returns {Promise<{ success: boolean, collectionsCount: number }>}
 */
const provisionTenantDatabase = async (dbName) => {
    if (!dbName || !dbName.startsWith('school_')) {
        throw new Error(`Invalid tenant database name: ${dbName}`);
    }

    const tenantDb = getTenantConnection(dbName);

    // Read all model schemas from models directory
    const modelsDir = path.resolve(__dirname, '../models');
    const files = fs.readdirSync(modelsDir);

    let collectionsCount = 0;
    for (const file of files) {
        if (!file.endsWith('.js')) continue;
        const modelName = file.replace('.js', '');
        if (CENTRAL_MODEL_NAMES.has(modelName)) continue;

        const schema = schemaRegistry.get(modelName) || require(path.join(modelsDir, file)).schema;
        if (schema) {
            const m = tenantDb.models[modelName] || tenantDb.model(modelName, schema);
            await m.createIndexes();
            collectionsCount++;
        }
    }

    return { success: true, collectionsCount };
};

module.exports = {
    CENTRAL_MODEL_NAMES,
    registerSchema,
    getTenantConnection,
    runInTenantContext,
    getTenantContext,
    getActiveConnection,
    createTenantModelProxy,
    provisionTenantDatabase
};
