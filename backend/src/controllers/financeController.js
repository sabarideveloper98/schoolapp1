const ExpenseCategory = require('../models/ExpenseCategory');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const FeePayment = require('../models/FeePayment');
const StudentFee = require('../models/StudentFee');
const Payroll = require('../models/Payroll');
const School = require('../models/School');

const getSchoolId = async (adminId) => {
    const school = await School.findOne({ admin_id: adminId });
    if (!school) throw new Error('School not found for this admin');
    return school._id;
};

const selectedYearShort = () => {
    return new Date().getFullYear().toString().substring(2);
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

// --- EXPENSE CATEGORY MANAGEMENT ---
const getExpenseCategories = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        let categories = await ExpenseCategory.find({ school_id });

        // Auto seed default categories if none exist
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

        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createExpenseCategory = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, code, description, status } = req.body;

        const exists = await ExpenseCategory.findOne({ school_id, name });
        if (exists) {
            return res.status(400).json({ message: 'Expense category already exists' });
        }

        const category = await ExpenseCategory.create({
            school_id, name, code, description, status
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
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteExpenseCategory = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        await ExpenseCategory.findOneAndDelete({ _id: req.params.id, school_id });
        res.json({ message: 'Expense category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- EXPENSE ENTRY MODULE ---
const getExpenses = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { category_id, payment_method, status, search, start_date, end_date } = req.query;

        const filter = { school_id };

        if (category_id) filter.category_id = category_id;
        if (payment_method) filter.payment_method = payment_method;
        if (status) filter.status = status;

        if (start_date && end_date) {
            filter.expense_date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }

        if (search) {
            filter.$or = [
                { expense_id: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
                { reference_number: { $regex: search, $options: 'i' } }
            ];
        }

        const expenses = await Expense.find(filter)
            .populate('category_id', 'name code')
            .sort({ expense_date: -1 });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createExpense = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { expense_date, category_id, title, amount, payment_method, reference_number, description, attachment_url, status } = req.body;

        const count = await Expense.countDocuments({ school_id });
        const expense_id = `EXP-${selectedYearShort()}${10001 + count}`;

        const expense = await Expense.create({
            school_id,
            expense_id,
            expense_date: expense_date || new Date(),
            category_id,
            title,
            amount: Number(amount),
            payment_method,
            reference_number: reference_number || '',
            description: description || '',
            attachment_url: attachment_url || '',
            status: status || 'Paid'
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateExpense = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, school_id },
            req.body,
            { new: true }
        );
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        await Expense.findOneAndDelete({ _id: req.params.id, school_id });
        res.json({ message: 'Expense record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- INCOME MANAGEMENT MODULE ---
const getIncomeList = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { income_type, payment_method, search, start_date, end_date } = req.query;

        const filter = { school_id };

        if (income_type) filter.income_type = income_type;
        if (payment_method) filter.payment_method = payment_method;

        if (start_date && end_date) {
            filter.income_date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }

        if (search) {
            filter.$or = [
                { income_id: { $regex: search, $options: 'i' } },
                { reference_number: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const incomeList = await Income.find(filter).sort({ income_date: -1 });
        res.json(incomeList);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createIncome = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { income_date, income_type, amount, payment_method, reference_number, description } = req.body;

        const count = await Income.countDocuments({ school_id });
        const income_id = `INC-${selectedYearShort()}${10001 + count}`;

        const income = await Income.create({
            school_id,
            income_id,
            income_date: income_date || new Date(),
            income_type,
            amount: Number(amount),
            payment_method,
            reference_number: reference_number || '',
            description: description || ''
        });

        res.status(201).json(income);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateIncome = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const income = await Income.findOneAndUpdate(
            { _id: req.params.id, school_id },
            req.body,
            { new: true }
        );
        res.json(income);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteIncome = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        await Income.findOneAndDelete({ _id: req.params.id, school_id });
        res.json({ message: 'Income entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- FINANCE DASHBOARD ANALYTICS & AUTO-INTEGRATION ---
const getFinanceDashboardStats = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        // 1. Manual Expenses & Income
        const allManualExpenses = await Expense.find({ school_id }).populate('category_id', 'name');
        const allManualIncomes = await Income.find({ school_id });

        // 2. Fee Collection Integration
        const allFeePayments = await FeePayment.find({ school_id, payment_status: 'Completed' });
        const feeIncomeTotal = allFeePayments.reduce((sum, p) => sum + p.amount_paid, 0);

        // Deduct completed refunds
        const allStudentFees = await StudentFee.find({ school_id });
        let totalRefunds = 0;
        allStudentFees.forEach(sf => {
            sf.refunds.forEach(ref => {
                if (ref.status === 'Completed') totalRefunds += ref.amount;
            });
        });
        const netFeeIncomeTotal = feeIncomeTotal - totalRefunds;

        // 3. Payroll Integration
        const allPaidPayrolls = await Payroll.find({ school_id, status: 'Paid' });
        const payrollExpensesTotal = allPaidPayrolls.reduce((sum, p) => sum + (p.salary_breakdown?.net_salary || 0), 0);

        // Aggregate Totals
        const manualExpensesTotal = allManualExpenses
            .filter(e => e.status === 'Paid')
            .reduce((sum, e) => sum + e.amount, 0);
        const manualIncomeTotal = allManualIncomes.reduce((sum, i) => sum + i.amount, 0);

        const totalExpenses = manualExpensesTotal + payrollExpensesTotal;
        const totalIncome = manualIncomeTotal + netFeeIncomeTotal;
        const netBalance = totalIncome - totalExpenses;

        // Monthly Stats
        const monthlyManualExpense = allManualExpenses
            .filter(e => e.status === 'Paid' && new Date(e.expense_date) >= startOfMonth)
            .reduce((sum, e) => sum + e.amount, 0);
        const monthlyPayrollExpense = allPaidPayrolls
            .filter(p => new Date(p.payment_details?.payment_date || p.updatedAt) >= startOfMonth)
            .reduce((sum, p) => sum + (p.salary_breakdown?.net_salary || 0), 0);
        const monthlyExpenses = monthlyManualExpense + monthlyPayrollExpense;

        const monthlyManualIncome = allManualIncomes
            .filter(i => new Date(i.income_date) >= startOfMonth)
            .reduce((sum, i) => sum + i.amount, 0);
        const monthlyFeeIncome = allFeePayments
            .filter(p => new Date(p.payment_date) >= startOfMonth)
            .reduce((sum, p) => sum + p.amount_paid, 0);
        const monthlyIncome = monthlyManualIncome + monthlyFeeIncome;

        // Today Stats
        const todayManualExpense = allManualExpenses
            .filter(e => e.status === 'Paid' && new Date(e.expense_date) >= startOfToday)
            .reduce((sum, e) => sum + e.amount, 0);
        const todayExpenses = todayManualExpense;

        const todayManualIncome = allManualIncomes
            .filter(i => new Date(i.income_date) >= startOfToday)
            .reduce((sum, i) => sum + i.amount, 0);
        const todayFeeIncome = allFeePayments
            .filter(p => new Date(p.payment_date) >= startOfToday)
            .reduce((sum, p) => sum + p.amount_paid, 0);
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
                .reduce((s, e) => s + e.amount, 0) +
                allPaidPayrolls
                .filter(p => new Date(p.payment_details?.payment_date || p.updatedAt) >= mStart && new Date(p.payment_details?.payment_date || p.updatedAt) <= mEnd)
                .reduce((s, p) => s + (p.salary_breakdown?.net_salary || 0), 0);

            const mInc = allManualIncomes
                .filter(inc => new Date(inc.income_date) >= mStart && new Date(inc.income_date) <= mEnd)
                .reduce((s, inc) => s + inc.amount, 0) +
                allFeePayments
                .filter(fp => new Date(fp.payment_date) >= mStart && new Date(fp.payment_date) <= mEnd)
                .reduce((s, fp) => s + fp.amount_paid, 0);

            monthlyTrend.push({
                month: `${monthNames[mIdx]} ${y}`,
                expenses: mExpense,
                income: mInc,
                net: mInc - mExpense
            });
        }

        // Category Breakdown
        const categoryMap = {};
        allManualExpenses.forEach(e => {
            const name = e.category_id?.name || 'Other Expense';
            categoryMap[name] = (categoryMap[name] || 0) + e.amount;
        });
        if (payrollExpensesTotal > 0) {
            categoryMap['Teacher & Staff Payroll'] = (categoryMap['Teacher & Staff Payroll'] || 0) + payrollExpensesTotal;
        }

        const categoryBreakdown = Object.keys(categoryMap).map(key => ({
            category: key,
            amount: categoryMap[key]
        }));

        res.json({
            totalExpenses,
            totalIncome,
            monthlyExpenses,
            monthlyIncome,
            feeCollectionIncome: netFeeIncomeTotal,
            payrollExpenses: payrollExpensesTotal,
            netBalance,
            todayIncome,
            todayExpenses,
            thisMonthIncome: monthlyIncome,
            thisMonthExpenses: monthlyExpenses,
            monthlyTrend,
            categoryBreakdown
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- FINANCIAL REPORTS ---
const getFinancialReports = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { report_type, date_range, category_id, payment_method, status } = req.query;

        // Fetch primary collections
        const expenses = await Expense.find({ school_id }).populate('category_id', 'name code');
        const incomes = await Income.find({ school_id });
        const feePayments = await FeePayment.find({ school_id, payment_status: 'Completed' }).populate('student_id', 'student_name admission_number');
        const payrolls = await Payroll.find({ school_id, status: 'Paid' });

        const studentFees = await StudentFee.find({ school_id });
        let totalRefunds = 0;
        let pendingFeesTotal = 0;
        studentFees.forEach(sf => {
            sf.refunds.forEach(ref => {
                if (ref.status === 'Completed') totalRefunds += ref.amount;
            });
            sf.items.forEach(item => {
                const pend = item.amount - item.discount_amount - item.paid_amount;
                if (pend > 0) pendingFeesTotal += pend;
            });
        });

        // Computed Aggregations
        const totalManualExpense = expenses.reduce((s, e) => s + e.amount, 0);
        const totalPayrollExpense = payrolls.reduce((s, p) => s + (p.salary_breakdown?.net_salary || 0), 0);
        const totalOverallExpense = totalManualExpense + totalPayrollExpense;

        const totalManualIncome = incomes.reduce((s, i) => s + i.amount, 0);
        const totalFeeIncome = feePayments.reduce((s, fp) => s + fp.amount_paid, 0) - totalRefunds;
        const totalOverallIncome = totalManualIncome + totalFeeIncome;

        const netProfitLoss = totalOverallIncome - totalOverallExpense;

        // Payroll Split
        const teacherSalaryCost = payrolls
            .filter(p => p.employee_role === 'Teacher')
            .reduce((s, p) => s + (p.salary_breakdown?.net_salary || 0), 0);
        const staffSalaryCost = payrolls
            .filter(p => p.employee_role === 'Staff')
            .reduce((s, p) => s + (p.salary_breakdown?.net_salary || 0), 0);

        res.json({
            expenses,
            incomes,
            feePayments,
            payrolls,
            summary: {
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
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getIncomeList,
    createIncome,
    updateIncome,
    deleteIncome,
    getFinanceDashboardStats,
    getFinancialReports
};
