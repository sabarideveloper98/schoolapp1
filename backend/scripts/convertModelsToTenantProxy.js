const fs = require('fs');
const path = require('path');

const modelsDir = path.resolve(__dirname, '../src/models');
const files = fs.readdirSync(modelsDir);

const central = ['School.js', 'User.js', 'Subscription.js', 'SubscriptionConfig.js', 'AuditLog.js'];

let modified = 0;
for (const file of files) {
    if (!file.endsWith('.js') || central.includes(file)) continue;
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const modelName = file.replace('.js', '');

    if (content.includes('createTenantModelProxy')) continue;

    const requireLine = "const { createTenantModelProxy } = require('../services/tenantConnectionManager');\n";
    
    // Match mongoose.model('ModelName', schemaName) or mongoose.model("ModelName", schemaName)
    const regex = new RegExp("mongoose\\.model\\(['\"]" + modelName + "['\"],\\s*([^\\)]+)\\)");
    if (regex.test(content)) {
        content = requireLine + content.replace(regex, "createTenantModelProxy('" + modelName + "', $1)");
        fs.writeFileSync(filePath, content, 'utf8');
        modified++;
        console.log('Converted model to tenant proxy:', file);
    } else {
        console.log('No regex match for model in file:', file);
    }
}

console.log('Successfully converted', modified, 'tenant models to createTenantModelProxy.');
