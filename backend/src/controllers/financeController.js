const ExpenseCategory = require('../models/ExpenseCategory');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const FeePayment = require('../models/FeePayment');
const StudentFee = require('../models/StudentFee');
const Payroll = require('../models/Payroll');
const School = require('../models/School');
const User = require('../models/User');
const Student = require('../models/Student');
const mongoose = require('mongoose');

const getSchoolId = async (adminId) => {
    let school = await School.findOne({ admin_id: adminId });
    if (school) return school._id;
    const userObj = await User.findById(adminId);
    if (userObj?.school_id) {
        school = await School.findById(userObj.school_id);
        if (school) return school._id;
    }
    const anySchool = await School.findOne({});
    if (anySchool) return anySchool._id;
    throw new Error('School not found for this admin');
};

const selectedYearShort = () => {
    return new Date().getFullYear().toString().substring(2);
};

// Safely generate unique sequential expense ID
const generateUniqueExpenseId = async () => {
    const yearPrefix = selectedYearShort();
    const prefix = `EXP-${yearPrefix}`;
    const latestList = await Expense.find({ expense_id: { $regex: `^${prefix}` } })
        .sort({ expense_id: -1 })
        .collation({ locale: 'en_US', numericOrdering: true })
        .limit(1)
        .select('expense_id');

    let nextNumber = 10001;
    if (latestList && latestList.length > 0 && latestList[0].expense_id) {
        const match = latestList[0].expense_id.match(new RegExp(`^EXP-${yearPrefix}(\\d+)`));
        if (match && match[1]) {
            const parsed = parseInt(match[1], 10);
            if (!isNaN(parsed) && parsed >= 10001) {
                nextNumber = parsed + 1;
            }
        }
    }

    let candidateId = `${prefix}${nextNumber}`;
    while (await Expense.findOne({ expense_id: candidateId })) {
        nextNumber++;
        candidateId = `${prefix}${nextNumber}`;
    }
    return candidateId;
};

// Safely generate unique sequential income ID
const generateUniqueIncomeId = async () => {
    const yearPrefix = selectedYearShort();
    const prefix = `INC-${yearPrefix}`;
    const latestList = await Income.find({ income_id: { $regex: `^${prefix}` } })
        .sort({ income_id: -1 })
        .collation({ locale: 'en_US', numericOrdering: true })
        .limit(1)
        .select('income_id');

    let nextNumber = 10001;
    if (latestList && latestList.length > 0 && latestList[0].income_id) {
        const match = latestList[0].income_id.match(new RegExp(`^INC-${yearPrefix}(\\d+)`));
        if (match && match[1]) {
            const parsed = parseInt(match[1], 10);
            if (!isNaN(parsed) && parsed >= 10001) {
                nextNumber = parsed + 1;
            }
        }
    }

    let candidateId = `${prefix}${nextNumber}`;
    while (await Income.findOne({ income_id: candidateId })) {
        nextNumber++;
        candidateId = `${prefix}${nextNumber}`;
    }
    return candidateId;
};

// Default Expense Categories List
const DEFAULT_CATEGORIES = [
    { name: 'Teacher Salary', code: 'TSAL', description: 'Monthly payroll payouts for teaching staff' },
    { name: 'Staff Salary', code: 'SSAL', description: 'Monthly payroll payouts for non-teaching staff' },
    { name: 'Electricity Bill', code: 'ELEC', description: 'Utility electricity bill charges' },
    { name: 'Water Bill', code: 'WATR', description: 'Water utility and supply charges' },
    { name: 'Internet Bill', code: 'INET', description: 'Broadband and network infrastructure charges' },
    { name: 'Building Rent', code: 'RENT', description: 'School building and land rental payments' },
    { name: 'Office Expense', code: 'OFFC', description: 'Stationery, printing, paper, and supplies' },
    { name: 'Maintenance', code: 'MAIN', description: 'Campus repair, cleaning, and maintenance' },
    { name: 'Transport Expense', code: 'TRNS', description: 'Bus fuel, driver allowances, and vehicle service' },
    { name: 'Sports Expense', code: 'SPRT', description: 'Athletic equipment and tournament fees' },
    { name: 'Event Expense', code: 'EVNT', description: 'Annual function, cultural, and academic events' },
    { name: 'Marketing Expense', code: 'MKTG', description: 'Admissions advertising and promotional campaigns' },
    { name: 'Software Subscription', code: 'SOFT', description: 'SaaS tools, hosting, and cloud infrastructure' },
    { name: 'Miscellaneous Expense', code: 'MISC', description: 'Uncategorized emergency operational costs' }
];

// Standard Income Categories List
const INCOME_CATEGORIES = [
    { name: 'Admission Fee', code: 'ADM', description: 'New student admissions and enrollment registration fees' },
    { name: 'Student Fee Collection', code: 'TUT', description: 'Tuition, term fees, and academic installments' },
    { name: 'Transport Fee', code: 'TRNS', description: 'School bus conveyance and transportation charges' },
    { name: 'Hostel Fee', code: 'HOST', description: 'Hostel boarding and residential accommodation fees' },
    { name: 'Donation', code: 'DONT', description: 'Charitable donations and philanthropic contributions' },
    { name: 'Sponsorship', code: 'SPON', description: 'Corporate grants, CSR funds, and educational sponsorships' },
    { name: 'Other Income', code: 'OTHR', description: 'Miscellaneous receipts, auditorium rent, and fine collections' }
];

// Helper to format ISO Date to YYYY-MM-DD
const formatDateStr = (d) => {
    if (!d) return null;
    try {
        return new Date(d).toISOString().split('T')[0];
    } catch {
        return null;
    }
};

// Safe and Repeatable Dummy Data Seeding
const seedDummyFinanceData = async (school_id, admin_user_id = null) => {
    try {
        if (!school_id) return;

        // 1. Ensure categories exist
        let categories = await ExpenseCategory.find({ school_id });
        if (categories.length === 0) {
            const seedPayload = DEFAULT_CATEGORIES.map(cat => ({
                school_id,
                name: cat.name,
                code: cat.code,
                description: cat.description,
                status: 'Active'
            }));
            categories = await ExpenseCategory.insertMany(seedPayload);
        }

        const catMap = {};
        categories.forEach(c => { catMap[c.name] = c._id; });

        // 2. Check if dummy expenses already exist
        const existingDummyExpenses = await Expense.find({ school_id, isDummy: true });
        if (existingDummyExpenses.length === 0) {
            const sampleExpenses = [
                {
                    title: 'Electricity Bill',
                    amount: 5000,
                    catName: 'Electricity Bill',
                    date: new Date('2026-11-10T10:00:00.000Z'),
                    method: 'Bank Transfer',
                    ref: 'REF-ELEC-2601',
                    desc: 'Monthly electricity bill'
                },
                {
                    title: 'Stationery Purchase',
                    amount: 2500,
                    catName: 'Office Expense',
                    date: new Date('2026-11-12T11:30:00.000Z'),
                    method: 'Cash',
                    ref: 'REF-STAT-2602',
                    desc: 'School stationery purchase'
                },
                {
                    title: 'Transportation Maintenance',
                    amount: 4000,
                    catName: 'Transport Expense',
                    date: new Date('2026-11-13T14:15:00.000Z'),
                    method: 'UPI',
                    ref: 'REF-TRNS-2603',
                    desc: 'School bus routine maintenance and service'
                },
                {
                    title: 'Building Maintenance',
                    amount: 8000,
                    catName: 'Maintenance',
                    date: new Date('2026-11-14T09:45:00.000Z'),
                    method: 'Cheque',
                    ref: 'REF-BLDG-2604',
                    desc: 'School building whitewash and campus repairs'
                },
                {
                    title: 'Internet Bill',
                    amount: 1500,
                    catName: 'Internet Bill',
                    date: new Date('2026-11-15T16:20:00.000Z'),
                    method: 'Online Payment',
                    ref: 'REF-INET-2605',
                    desc: 'High-speed broadband internet subscription for school campus'
                }
            ];

            for (const item of sampleExpenses) {
                const expense_id = await generateUniqueExpenseId();
                const category_id = catMap[item.catName] || categories[0]._id;
                await Expense.create({
                    school_id,
                    expense_id,
                    expense_date: item.date,
                    category_id,
                    title: item.title,
                    amount: item.amount,
                    payment_method: item.method,
                    reference_number: item.ref,
                    description: item.desc,
                    attachment_url: '',
                    status: 'Paid',
                    isDummy: true,
                    academic_year: '2026-2027',
                    created_by: admin_user_id || undefined
                });
            }
        }

        // 3. Check if dummy income already exists
        const existingDummyIncomes = await Income.find({ school_id, isDummy: true });
        if (existingDummyIncomes.length === 0) {
            const sampleIncomes = [
                {
                    income_type: 'Admission Fee',
                    amount: 25000,
                    date: new Date('2026-11-05T09:00:00.000Z'),
                    method: 'Bank Transfer',
                    ref: 'REF-ADM-2601',
                    desc: 'New student admissions enrollment fee collection'
                },
                {
                    income_type: 'Student Fee Collection',
                    amount: 50000,
                    date: new Date('2026-11-08T10:30:00.000Z'),
                    method: 'UPI',
                    ref: 'REF-TUT-2602',
                    desc: 'Term 2 tuition fees collection installment'
                },
                {
                    income_type: 'Transport Fee',
                    amount: 15000,
                    date: new Date('2026-11-11T12:00:00.000Z'),
                    method: 'Cash',
                    ref: 'REF-TRPF-2603',
                    desc: 'Quarterly school bus transport service fees'
                },
                {
                    income_type: 'Other Income',
                    amount: 5000,
                    date: new Date('2026-11-16T15:30:00.000Z'),
                    method: 'Cash',
                    ref: 'REF-OTH-2604',
                    desc: 'Auditorium weekend rent and miscellaneous receipts'
                }
            ];

            for (const item of sampleIncomes) {
                const income_id = await generateUniqueIncomeId();
                await Income.create({
                    school_id,
                    income_id,
                    income_date: item.date,
                    income_type: item.income_type,
                    amount: item.amount,
                    payment_method: item.method,
                    reference_number: item.ref,
                    description: item.desc,
                    isDummy: true,
                    academic_year: '2026-2027',
                    created_by: admin_user_id || undefined
                });
            }
        }
    } catch (seedErr) {
        console.error('Error in seedDummyFinanceData:', seedErr);
    }
};

// --- EXPENSE CATEGORY MANAGEMENT ---
const getExpenseCategories = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { status, search } = req.query;

        const filter = { school_id };
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (search && search.trim()) {
            filter.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { code: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        let categories = await ExpenseCategory.find(filter).sort({ name: 1 });

        // Auto seed default categories if none exist in school
        if (categories.length === 0 && !status && !search) {
            const seedPayload = DEFAULT_CATEGORIES.map(cat => ({
                school_id,
                name: cat.name,
                code: cat.code,
                description: cat.description,
                status: 'Active'
            }));
            categories = await ExpenseCategory.insertMany(seedPayload);
        }

        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createExpenseCategory = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, code, description, status } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        if (!code || !String(code).trim()) {
            return res.status(400).json({ message: 'Category code is required' });
        }

        const exists = await ExpenseCategory.findOne({ school_id, name: String(name).trim() });
        if (exists) {
            return res.status(400).json({ message: 'Expense category already exists' });
        }

        const category = await ExpenseCategory.create({
            school_id,
            name: String(name).trim(),
            code: String(code).trim().toUpperCase(),
            description: description ? String(description).trim() : '',
            status: status || 'Active'
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateExpenseCategory = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const category = await ExpenseCategory.findOneAndUpdate(
            { _id: req.params.id, school_id },
            req.body,
            { new: true }
        );
        if (!category) {
            return res.status(404).json({ message: 'Expense category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteExpenseCategory = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const deleted = await ExpenseCategory.findOneAndDelete({ _id: req.params.id, school_id });
        if (!deleted) {
            return res.status(404).json({ message: 'Expense category not found' });
        }
        res.json({ message: 'Expense category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- INCOME CATEGORIES LIST ---
const getIncomeCategories = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Income categories retrieved successfully',
            data: {
                categories: INCOME_CATEGORIES
            },
            categories: INCOME_CATEGORIES
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- EXPENSE ENTRY MODULE ---
const getExpenses = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        // Auto-seed sample dummy data if no expenses exist in this school
        const currentCount = await Expense.countDocuments({ school_id });
        if (currentCount === 0) {
            await seedDummyFinanceData(school_id, req.user._id);
        }

        // Support both camelCase and snake_case query params
        const categoryId = req.query.category_id || req.query.categoryId || req.query.category;
        const paymentMethod = req.query.payment_method || req.query.paymentMethod;
        const status = req.query.status;
        const search = req.query.search;
        const startDate = req.query.start_date || req.query.startDate || req.query.from_date || req.query.fromDate;
        const endDate = req.query.end_date || req.query.endDate || req.query.to_date || req.query.toDate;
        const academicYear = req.query.academic_year || req.query.academicYear;
        const isDummyParam = req.query.isDummy || req.query.is_dummy;
        const pageParam = req.query.page;
        const limitParam = req.query.limit;

        // Pagination Validation
        let page = 1;
        if (pageParam !== undefined) {
            page = parseInt(pageParam, 10);
            if (isNaN(page) || page < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Page parameter must be a positive integer',
                    error: {
                        code: 'INVALID_PAGE_PARAM',
                        details: 'Page must be an integer greater than or equal to 1'
                    }
                });
            }
        }

        let limit = 0; // 0 means return all
        if (limitParam !== undefined) {
            limit = parseInt(limitParam, 10);
            if (isNaN(limit) || limit < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Limit parameter must be a positive integer',
                    error: {
                        code: 'INVALID_LIMIT_PARAM',
                        details: 'Limit must be an integer greater than or equal to 1'
                    }
                });
            }
        }

        const filter = { school_id };

        if (categoryId && categoryId !== 'all') {
            if (mongoose.Types.ObjectId.isValid(categoryId)) {
                filter.category_id = categoryId;
            } else {
                // If passed category name string
                const catObj = await ExpenseCategory.findOne({ school_id, name: new RegExp(`^${categoryId.trim()}$`, 'i') });
                if (catObj) filter.category_id = catObj._id;
            }
        }

        if (paymentMethod && paymentMethod !== 'all') {
            filter.payment_method = paymentMethod;
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (academicYear) {
            filter.academic_year = academicYear;
        }

        if (isDummyParam !== undefined && isDummyParam !== 'all') {
            filter.isDummy = isDummyParam === 'true' || isDummyParam === true;
        }

        if (startDate || endDate) {
            filter.expense_date = {};
            if (startDate) {
                const s = new Date(startDate);
                if (!isNaN(s.getTime())) {
                    s.setHours(0, 0, 0, 0);
                    filter.expense_date.$gte = s;
                }
            }
            if (endDate) {
                const e = new Date(endDate);
                if (!isNaN(e.getTime())) {
                    e.setHours(23, 59, 59, 999);
                    filter.expense_date.$lte = e;
                }
            }
        }

        if (search && search.trim()) {
            const q = search.trim();
            filter.$or = [
                { expense_id: { $regex: q, $options: 'i' } },
                { title: { $regex: q, $options: 'i' } },
                { reference_number: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        const allExpenses = await Expense.find(filter)
            .populate('category_id', 'name code')
            .populate('created_by', 'name email role')
            .sort({ expense_date: -1 });

        const totalRecords = allExpenses.length;
        const totalAmount = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        // Format expenses according to spec while keeping backward compatibility
        const formattedExpenses = allExpenses.map(e => {
            const catName = e.category_id?.name || 'General Expense';
            const catCode = e.category_id?.code || '';
            const createdByName = e.created_by?.name || (e.created_by ? String(e.created_by) : 'School Admin');

            return {
                _id: e._id,
                expenseId: e.expense_id,
                expense_id: e.expense_id,
                title: e.title,
                category: catName,
                category_name: catName,
                category_code: catCode,
                categoryId: e.category_id?._id || e.category_id,
                category_id: e.category_id,
                date: formatDateStr(e.expense_date),
                expenseDate: formatDateStr(e.expense_date),
                expense_date: e.expense_date,
                amount: e.amount,
                paymentMethod: e.payment_method,
                payment_method: e.payment_method,
                referenceNumber: e.reference_number || '',
                reference_number: e.reference_number || '',
                description: e.description || '',
                receipt: e.attachment_url || '',
                attachmentUrl: e.attachment_url || '',
                attachment_url: e.attachment_url || '',
                status: e.status || 'Paid',
                isDummy: e.isDummy === true,
                is_dummy: e.isDummy === true,
                academicYear: e.academic_year || '2026-2027',
                academic_year: e.academic_year || '2026-2027',
                createdBy: createdByName,
                created_by: createdByName,
                createdDate: e.createdAt,
                updatedDate: e.updatedAt,
                createdAt: e.createdAt,
                updatedAt: e.updatedAt
            };
        });

        // Apply pagination
        let paginatedExpenses = formattedExpenses;
        let totalPages = 1;
        if (limit > 0) {
            totalPages = Math.ceil(totalRecords / limit) || 1;
            const startIndex = (page - 1) * limit;
            paginatedExpenses = formattedExpenses.slice(startIndex, startIndex + limit);
        }

        const isHyphenatedRoute = req.originalUrl && req.originalUrl.includes('school-admin');
        const isPaginatedCall = pageParam !== undefined || limitParam !== undefined || req.query.envelope === 'true' || req.query.format === 'envelope';

        if (isHyphenatedRoute || isPaginatedCall) {
            return res.status(200).json({
                success: true,
                message: 'Expenses retrieved successfully',
                data: {
                    expenses: paginatedExpenses,
                    totalRecords,
                    totalAmount,
                    pagination: {
                        currentPage: page,
                        limit: limit > 0 ? limit : totalRecords,
                        totalRecords,
                        totalPages
                    }
                },
                totalRecords,
                totalAmount,
                expenses: paginatedExpenses
            });
        }

        // Return array for legacy unpaginated frontend calls (e.g. ExpenseManagement.jsx)
        return res.status(200).json(paginatedExpenses);
    } catch (error) {
        console.error('getExpenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving expenses',
            error: { code: 'EXPENSES_FETCH_ERROR', details: error.message }
        });
    }
};

const createExpense = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const {
            expense_date, expenseDate,
            category_id, categoryId,
            title, amount,
            payment_method, paymentMethod,
            reference_number, referenceNumber,
            description,
            attachment_url, attachmentUrl, receipt,
            status, academic_year, academicYear
        } = req.body;

        const expenseTitle = title !== undefined ? title : req.body.expenseTitle;
        const expAmount = amount !== undefined ? amount : req.body.expenseAmount;
        const catId = category_id || categoryId;
        const pMethod = payment_method || paymentMethod || 'Cash';
        const refNo = reference_number !== undefined ? reference_number : referenceNumber;
        const attachUrl = attachment_url !== undefined ? attachment_url : (attachmentUrl || receipt);
        const expDate = expense_date || expenseDate;
        const acadYear = academic_year || academicYear || '2026-2027';

        if (!expenseTitle || !String(expenseTitle).trim()) {
            return res.status(400).json({ message: 'Expense title is required' });
        }
        if (!catId) {
            return res.status(400).json({ message: 'Expense category is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(catId)) {
            return res.status(400).json({ message: 'Invalid category ID selected' });
        }
        if (expAmount === undefined || expAmount === null || isNaN(Number(expAmount)) || Number(expAmount) < 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        let retries = 5;
        let expense;
        while (retries > 0) {
            try {
                const expense_id = await generateUniqueExpenseId();
                expense = await Expense.create({
                    school_id,
                    expense_id,
                    expense_date: expDate ? new Date(expDate) : new Date(),
                    category_id: catId,
                    title: String(expenseTitle).trim(),
                    amount: Number(expAmount),
                    payment_method: pMethod,
                    reference_number: refNo ? String(refNo).trim() : '',
                    description: description ? String(description).trim() : '',
                    attachment_url: attachUrl ? String(attachUrl).trim() : '',
                    status: status || 'Paid',
                    isDummy: false,
                    academic_year: acadYear,
                    created_by: req.user._id
                });
                break;
            } catch (createErr) {
                if (createErr.code === 11000 && retries > 1) {
                    retries--;
                    await new Promise(resolve => setTimeout(resolve, 50));
                    continue;
                }
                throw createErr;
            }
        }

        await expense.populate('category_id', 'name code');
        res.status(201).json(expense);
    } catch (error) {
        console.error('Error in createExpense:', error);
        res.status(500).json({ message: error.message || 'Server error', error: error.message });
    }
};

const updateExpense = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { category_id, categoryId, amount, expense_date, expenseDate, ...rest } = req.body;
        const updateData = { ...rest };

        const targetCatId = category_id || categoryId;
        if (targetCatId) {
            if (!mongoose.Types.ObjectId.isValid(targetCatId)) {
                return res.status(400).json({ message: 'Invalid category ID' });
            }
            updateData.category_id = targetCatId;
        }

        if (amount !== undefined) {
            if (isNaN(Number(amount)) || Number(amount) < 0) {
                return res.status(400).json({ message: 'Valid amount is required' });
            }
            updateData.amount = Number(amount);
        }

        const dateVal = expense_date || expenseDate;
        if (dateVal) {
            updateData.expense_date = new Date(dateVal);
        }

        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, school_id },
            updateData,
            { new: true }
        ).populate('category_id', 'name code');

        if (!expense) {
            return res.status(404).json({ message: 'Expense record not found' });
        }
        res.json(expense);
    } catch (error) {
        console.error('Error in updateExpense:', error);
        res.status(500).json({ message: error.message || 'Server error', error: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const deleted = await Expense.findOneAndDelete({ _id: req.params.id, school_id });
        if (!deleted) {
            return res.status(404).json({ message: 'Expense record not found' });
        }
        res.json({ message: 'Expense record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- INCOME MANAGEMENT MODULE ---
const getIncomeList = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        // Auto-seed sample dummy income if none exists in this school
        const currentCount = await Income.countDocuments({ school_id });
        if (currentCount === 0) {
            await seedDummyFinanceData(school_id, req.user._id);
        }

        const incomeType = req.query.income_type || req.query.incomeType;
        const paymentMethod = req.query.payment_method || req.query.paymentMethod;
        const search = req.query.search;
        const startDate = req.query.start_date || req.query.startDate || req.query.from_date || req.query.fromDate;
        const endDate = req.query.end_date || req.query.endDate || req.query.to_date || req.query.toDate;
        const academicYear = req.query.academic_year || req.query.academicYear;
        const isDummyParam = req.query.isDummy || req.query.is_dummy;
        const pageParam = req.query.page;
        const limitParam = req.query.limit;

        // Pagination Validation
        let page = 1;
        if (pageParam !== undefined) {
            page = parseInt(pageParam, 10);
            if (isNaN(page) || page < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Page parameter must be a positive integer',
                    error: {
                        code: 'INVALID_PAGE_PARAM',
                        details: 'Page must be an integer greater than or equal to 1'
                    }
                });
            }
        }

        let limit = 0;
        if (limitParam !== undefined) {
            limit = parseInt(limitParam, 10);
            if (isNaN(limit) || limit < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Limit parameter must be a positive integer',
                    error: {
                        code: 'INVALID_LIMIT_PARAM',
                        details: 'Limit must be an integer greater than or equal to 1'
                    }
                });
            }
        }

        const filter = { school_id };

        if (incomeType && incomeType !== 'all') {
            filter.income_type = incomeType;
        }

        if (paymentMethod && paymentMethod !== 'all') {
            filter.payment_method = paymentMethod;
        }

        if (academicYear) {
            filter.academic_year = academicYear;
        }

        if (isDummyParam !== undefined && isDummyParam !== 'all') {
            filter.isDummy = isDummyParam === 'true' || isDummyParam === true;
        }

        if (startDate || endDate) {
            filter.income_date = {};
            if (startDate) {
                const s = new Date(startDate);
                if (!isNaN(s.getTime())) {
                    s.setHours(0, 0, 0, 0);
                    filter.income_date.$gte = s;
                }
            }
            if (endDate) {
                const e = new Date(endDate);
                if (!isNaN(e.getTime())) {
                    e.setHours(23, 59, 59, 999);
                    filter.income_date.$lte = e;
                }
            }
        }

        if (search && search.trim()) {
            const q = search.trim();
            filter.$or = [
                { income_id: { $regex: q, $options: 'i' } },
                { income_type: { $regex: q, $options: 'i' } },
                { reference_number: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }

        const allIncome = await Income.find(filter)
            .populate('created_by', 'name email role')
            .sort({ income_date: -1 });

        const totalRecords = allIncome.length;
        const totalAmount = allIncome.reduce((sum, i) => sum + (i.amount || 0), 0);

        const formattedIncomes = allIncome.map(inc => {
            const createdByName = inc.created_by?.name || (inc.created_by ? String(inc.created_by) : 'School Admin');

            return {
                _id: inc._id,
                incomeId: inc.income_id,
                income_id: inc.income_id,
                incomeType: inc.income_type,
                income_type: inc.income_type,
                title: inc.income_type,
                category: inc.income_type,
                date: formatDateStr(inc.income_date),
                incomeDate: formatDateStr(inc.income_date),
                income_date: inc.income_date,
                amount: inc.amount,
                paymentMethod: inc.payment_method,
                payment_method: inc.payment_method,
                referenceNumber: inc.reference_number || '',
                reference_number: inc.reference_number || '',
                description: inc.description || '',
                isDummy: inc.isDummy === true,
                is_dummy: inc.isDummy === true,
                academicYear: inc.academic_year || '2026-2027',
                academic_year: inc.academic_year || '2026-2027',
                createdBy: createdByName,
                created_by: createdByName,
                createdDate: inc.createdAt,
                updatedDate: inc.updatedAt,
                createdAt: inc.createdAt,
                updatedAt: inc.updatedAt
            };
        });

        // Apply pagination
        let paginatedIncomes = formattedIncomes;
        let totalPages = 1;
        if (limit > 0) {
            totalPages = Math.ceil(totalRecords / limit) || 1;
            const startIndex = (page - 1) * limit;
            paginatedIncomes = formattedIncomes.slice(startIndex, startIndex + limit);
        }

        const isHyphenatedRoute = req.originalUrl && req.originalUrl.includes('school-admin');
        const isPaginatedCall = pageParam !== undefined || limitParam !== undefined || req.query.envelope === 'true' || req.query.format === 'envelope';

        if (isHyphenatedRoute || isPaginatedCall) {
            return res.status(200).json({
                success: true,
                message: 'Income records retrieved successfully',
                data: {
                    income: paginatedIncomes,
                    incomes: paginatedIncomes,
                    totalRecords,
                    totalAmount,
                    pagination: {
                        currentPage: page,
                        limit: limit > 0 ? limit : totalRecords,
                        totalRecords,
                        totalPages
                    }
                },
                totalRecords,
                totalAmount,
                income: paginatedIncomes,
                incomes: paginatedIncomes
            });
        }

        // Return array for legacy unpaginated frontend calls (e.g. IncomeManagement.jsx)
        return res.status(200).json(paginatedIncomes);
    } catch (error) {
        console.error('getIncomeList error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving income list',
            error: { code: 'INCOME_FETCH_ERROR', details: error.message }
        });
    }
};

const createIncome = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const {
            income_date, incomeDate,
            income_type, incomeType,
            amount,
            payment_method, paymentMethod,
            reference_number, referenceNumber,
            description,
            academic_year, academicYear
        } = req.body;

        const incType = income_type || incomeType;
        const incAmount = amount;
        const pMethod = payment_method || paymentMethod || 'Cash';
        const refNo = reference_number !== undefined ? reference_number : referenceNumber;
        const dateVal = income_date || incomeDate;
        const acadYear = academic_year || academicYear || '2026-2027';

        if (!incType) {
            return res.status(400).json({ message: 'Income type is required' });
        }
        if (incAmount === undefined || incAmount === null || isNaN(Number(incAmount)) || Number(incAmount) < 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        let retries = 5;
        let income;
        while (retries > 0) {
            try {
                const income_id = await generateUniqueIncomeId();
                income = await Income.create({
                    school_id,
                    income_id,
                    income_date: dateVal ? new Date(dateVal) : new Date(),
                    income_type: incType,
                    amount: Number(incAmount),
                    payment_method: pMethod,
                    reference_number: refNo ? String(refNo).trim() : '',
                    description: description ? String(description).trim() : '',
                    isDummy: false,
                    academic_year: acadYear,
                    created_by: req.user._id
                });
                break;
            } catch (createErr) {
                if (createErr.code === 11000 && retries > 1) {
                    retries--;
                    await new Promise(resolve => setTimeout(resolve, 50));
                    continue;
                }
                throw createErr;
            }
        }

        res.status(201).json(income);
    } catch (error) {
        console.error('Error in createIncome:', error);
        res.status(500).json({ message: error.message || 'Server error', error: error.message });
    }
};

const updateIncome = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { amount, income_date, incomeDate, ...rest } = req.body;
        const updateData = { ...rest };

        if (amount !== undefined) {
            if (isNaN(Number(amount)) || Number(amount) < 0) {
                return res.status(400).json({ message: 'Valid amount is required' });
            }
            updateData.amount = Number(amount);
        }

        const dateVal = income_date || incomeDate;
        if (dateVal) {
            updateData.income_date = new Date(dateVal);
        }

        const income = await Income.findOneAndUpdate(
            { _id: req.params.id, school_id },
            updateData,
            { new: true }
        );

        if (!income) {
            return res.status(404).json({ message: 'Income entry not found' });
        }
        res.json(income);
    } catch (error) {
        console.error('Error in updateIncome:', error);
        res.status(500).json({ message: error.message || 'Server error', error: error.message });
    }
};

const deleteIncome = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const deleted = await Income.findOneAndDelete({ _id: req.params.id, school_id });
        if (!deleted) {
            return res.status(404).json({ message: 'Income entry not found' });
        }
        res.json({ message: 'Income entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- FINANCE DASHBOARD ANALYTICS & AUTO-INTEGRATION ---
const getFinanceDashboardStats = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        // Auto-seed sample data if the school is completely empty
        const [expCount, incCount] = await Promise.all([
            Expense.countDocuments({ school_id }),
            Income.countDocuments({ school_id })
        ]);
        if (expCount === 0 || incCount === 0) {
            await seedDummyFinanceData(school_id, req.user._id);
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

        // 1. Manual Expenses & Income
        const allManualExpenses = await Expense.find({ school_id }).populate('category_id', 'name code');
        const allManualIncomes = await Income.find({ school_id });

        // 2. Fee Collection Integration
        const allFeePayments = await FeePayment.find({ school_id, payment_status: 'Completed' });
        const feeIncomeTotal = allFeePayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);

        // Deduct completed refunds
        const allStudentFees = await StudentFee.find({ school_id });
        let totalRefunds = 0;
        let pendingFeesTotal = 0;
        allStudentFees.forEach(sf => {
            if (sf.refunds && Array.isArray(sf.refunds)) {
                sf.refunds.forEach(ref => {
                    if (ref.status === 'Completed') totalRefunds += (ref.amount || 0);
                });
            }
            if (sf.items && Array.isArray(sf.items)) {
                sf.items.forEach(item => {
                    const pend = (item.amount || 0) - (item.discount_amount || 0) - (item.paid_amount || 0);
                    if (pend > 0) pendingFeesTotal += pend;
                });
            }
        });
        const netFeeIncomeTotal = Math.max(0, feeIncomeTotal - totalRefunds);

        // 3. Payroll Integration
        const allPaidPayrolls = await Payroll.find({ school_id, status: 'Paid' });
        const payrollExpensesTotal = allPaidPayrolls.reduce((sum, p) => sum + (p.salary_breakdown?.net_salary || 0), 0);

        // Aggregate Totals
        const manualExpensesTotal = allManualExpenses
            .filter(e => e.status === 'Paid')
            .reduce((sum, e) => sum + (e.amount || 0), 0);
        const manualIncomeTotal = allManualIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);

        const totalExpenses = manualExpensesTotal + payrollExpensesTotal;
        const totalIncome = manualIncomeTotal + netFeeIncomeTotal;
        const netBalance = totalIncome - totalExpenses;

        // Monthly Stats
        const monthlyManualExpense = allManualExpenses
            .filter(e => e.status === 'Paid' && new Date(e.expense_date) >= startOfMonth)
            .reduce((sum, e) => sum + (e.amount || 0), 0);
        const monthlyPayrollExpense = allPaidPayrolls
            .filter(p => new Date(p.payment_details?.payment_date || p.updatedAt) >= startOfMonth)
            .reduce((sum, p) => sum + (p.salary_breakdown?.net_salary || 0), 0);
        const monthlyExpenses = monthlyManualExpense + monthlyPayrollExpense;

        const monthlyManualIncome = allManualIncomes
            .filter(i => new Date(i.income_date) >= startOfMonth)
            .reduce((sum, i) => sum + (i.amount || 0), 0);
        const monthlyFeeIncome = allFeePayments
            .filter(p => new Date(p.payment_date) >= startOfMonth)
            .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
        const monthlyIncome = monthlyManualIncome + monthlyFeeIncome;

        // Yearly Stats
        const yearlyManualExpense = allManualExpenses
            .filter(e => e.status === 'Paid' && new Date(e.expense_date) >= startOfYear)
            .reduce((sum, e) => sum + (e.amount || 0), 0);
        const yearlyPayrollExpense = allPaidPayrolls
            .filter(p => new Date(p.payment_details?.payment_date || p.updatedAt) >= startOfYear)
            .reduce((sum, p) => sum + (p.salary_breakdown?.net_salary || 0), 0);
        const yearlyExpenses = yearlyManualExpense + yearlyPayrollExpense;

        const yearlyManualIncome = allManualIncomes
            .filter(i => new Date(i.income_date) >= startOfYear)
            .reduce((sum, i) => sum + (i.amount || 0), 0);
        const yearlyFeeIncome = allFeePayments
            .filter(p => new Date(p.payment_date) >= startOfYear)
            .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
        const yearlyIncome = yearlyManualIncome + yearlyFeeIncome;

        // Today Stats
        const todayManualExpense = allManualExpenses
            .filter(e => e.status === 'Paid' && new Date(e.expense_date) >= startOfToday)
            .reduce((sum, e) => sum + (e.amount || 0), 0);
        const todayExpenses = todayManualExpense;

        const todayManualIncome = allManualIncomes
            .filter(i => new Date(i.income_date) >= startOfToday)
            .reduce((sum, i) => sum + (i.amount || 0), 0);
        const todayFeeIncome = allFeePayments
            .filter(p => new Date(p.payment_date) >= startOfToday)
            .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
        const todayIncome = todayManualIncome + todayFeeIncome;

        // Charts Data Breakdown (Last 6 Months)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mIdx = d.getMonth();
            const y = d.getFullYear();
            const mStart = new Date(y, mIdx, 1);
            const mEnd = new Date(y, mIdx + 1, 0, 23, 59, 59);

            const mExpense = allManualExpenses
                .filter(e => e.status === 'Paid' && new Date(e.expense_date) >= mStart && new Date(e.expense_date) <= mEnd)
                .reduce((s, e) => s + (e.amount || 0), 0) +
                allPaidPayrolls
                    .filter(p => new Date(p.payment_details?.payment_date || p.updatedAt) >= mStart && new Date(p.payment_details?.payment_date || p.updatedAt) <= mEnd)
                    .reduce((s, p) => s + (p.salary_breakdown?.net_salary || 0), 0);

            const mInc = allManualIncomes
                .filter(inc => new Date(inc.income_date) >= mStart && new Date(inc.income_date) <= mEnd)
                .reduce((s, inc) => s + (inc.amount || 0), 0) +
                allFeePayments
                    .filter(fp => new Date(fp.payment_date) >= mStart && new Date(fp.payment_date) <= mEnd)
                    .reduce((s, fp) => s + (fp.amount_paid || 0), 0);

            monthlyTrend.push({
                month: `${monthNames[mIdx]} ${y}`,
                expenses: mExpense,
                income: mInc,
                net: mInc - mExpense
            });
        }

        // Expense Category-wise Breakdown
        const expenseCategoryMap = {};
        allManualExpenses.forEach(e => {
            const name = e.category_id?.name || 'Other Expense';
            expenseCategoryMap[name] = (expenseCategoryMap[name] || 0) + (e.amount || 0);
        });
        if (payrollExpensesTotal > 0) {
            expenseCategoryMap['Teacher & Staff Payroll'] = (expenseCategoryMap['Teacher & Staff Payroll'] || 0) + payrollExpensesTotal;
        }

        const expenseCategorySummary = Object.keys(expenseCategoryMap).map(key => ({
            category: key,
            amount: expenseCategoryMap[key]
        }));

        // Income Category-wise Breakdown
        const incomeCategoryMap = {};
        allManualIncomes.forEach(i => {
            const type = i.income_type || 'Other Income';
            incomeCategoryMap[type] = (incomeCategoryMap[type] || 0) + (i.amount || 0);
        });
        if (netFeeIncomeTotal > 0) {
            incomeCategoryMap['Student Fee Collection'] = (incomeCategoryMap['Student Fee Collection'] || 0) + netFeeIncomeTotal;
        }

        const incomeCategorySummary = Object.keys(incomeCategoryMap).map(key => ({
            incomeType: key,
            category: key,
            amount: incomeCategoryMap[key]
        }));

        const dashboardData = {
            totalIncome,
            totalExpenses,
            totalBalance: netBalance,
            netBalance,
            monthlyIncome,
            monthlyExpenses,
            yearlyIncome,
            yearlyExpenses,
            feeCollection: netFeeIncomeTotal,
            feeCollectionIncome: netFeeIncomeTotal,
            pendingFees: pendingFeesTotal,
            payrollExpenses: payrollExpensesTotal,
            todayIncome,
            todayExpenses,
            thisMonthIncome: monthlyIncome,
            thisMonthExpenses: monthlyExpenses,
            expenseCategorySummary,
            incomeCategorySummary,
            categoryBreakdown: expenseCategorySummary,
            monthlyTrend
        };

        return res.status(200).json({
            success: true,
            message: 'Finance dashboard statistics retrieved successfully',
            data: dashboardData,
            ...dashboardData
        });
    } catch (error) {
        console.error('getFinanceDashboardStats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching finance dashboard stats',
            error: { code: 'FINANCE_DASHBOARD_ERROR', details: error.message }
        });
    }
};

// --- FINANCIAL REPORTS ---
const getFinancialReports = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { report_type, date_range, category_id, payment_method, status } = req.query;

        // Auto-seed dummy finance if empty
        const [expCount, incCount] = await Promise.all([
            Expense.countDocuments({ school_id }),
            Income.countDocuments({ school_id })
        ]);
        if (expCount === 0 || incCount === 0) {
            await seedDummyFinanceData(school_id, req.user._id);
        }

        // Fetch primary collections
        const expenses = await Expense.find({ school_id }).populate('category_id', 'name code').sort({ expense_date: -1 });
        const incomes = await Income.find({ school_id }).sort({ income_date: -1 });
        const feePayments = await FeePayment.find({ school_id, payment_status: 'Completed' }).populate('student_id', 'student_name admission_number').sort({ payment_date: -1 });
        const payrolls = await Payroll.find({ school_id, status: 'Paid' }).sort({ createdAt: -1 });

        const studentFees = await StudentFee.find({ school_id });
        let totalRefunds = 0;
        let pendingFeesTotal = 0;
        studentFees.forEach(sf => {
            if (sf.refunds && Array.isArray(sf.refunds)) {
                sf.refunds.forEach(ref => {
                    if (ref.status === 'Completed') totalRefunds += (ref.amount || 0);
                });
            }
            if (sf.items && Array.isArray(sf.items)) {
                sf.items.forEach(item => {
                    const pend = (item.amount || 0) - (item.discount_amount || 0) - (item.paid_amount || 0);
                    if (pend > 0) pendingFeesTotal += pend;
                });
            }
        });

        // Computed Aggregations
        const totalManualExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const totalPayrollExpense = payrolls.reduce((s, p) => s + (p.salary_breakdown?.net_salary || 0), 0);
        const totalOverallExpense = totalManualExpense + totalPayrollExpense;

        const totalManualIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
        const totalFeeIncome = Math.max(0, feePayments.reduce((s, fp) => s + (fp.amount_paid || 0), 0) - totalRefunds);
        const totalOverallIncome = totalManualIncome + totalFeeIncome;

        const netProfitLoss = totalOverallIncome - totalOverallExpense;

        // Payroll Split
        const teacherSalaryCost = payrolls
            .filter(p => p.employee_role === 'Teacher')
            .reduce((s, p) => s + (p.salary_breakdown?.net_salary || 0), 0);
        const staffSalaryCost = payrolls
            .filter(p => p.employee_role === 'Staff')
            .reduce((s, p) => s + (p.salary_breakdown?.net_salary || 0), 0);

        const summary = {
            totalManualExpense,
            totalPayrollExpense,
            totalOverallExpense,
            totalManualIncome,
            totalFeeIncome,
            totalOverallIncome,
            netProfitLoss,
            teacherSalaryCost,
            staffSalaryCost,
            totalRefunds,
            pendingFeesTotal
        };

        return res.status(200).json({
            success: true,
            message: 'Financial reports retrieved successfully',
            data: {
                expenses,
                incomes,
                feePayments,
                payrolls,
                summary
            },
            expenses,
            incomes,
            feePayments,
            payrolls,
            summary
        });
    } catch (error) {
        console.error('getFinancialReports error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating financial reports',
            error: { code: 'FINANCIAL_REPORTS_ERROR', details: error.message }
        });
    }
};

module.exports = {
    getExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    getIncomeCategories,
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getIncomeList,
    createIncome,
    updateIncome,
    deleteIncome,
    getFinanceDashboardStats,
    getFinancialReports,
    seedDummyFinanceData
};
