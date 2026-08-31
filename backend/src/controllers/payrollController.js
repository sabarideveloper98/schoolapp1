const SalarySetup = require('../models/SalarySetup');
const Payroll = require('../models/Payroll');
const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');
const School = require('../models/School');
const User = require('../models/User');
const StaffAttendance = require('../models/StaffAttendance');

const getSchoolId = async (adminId) => {
    const school = await School.findOne({ admin_id: adminId });
    if (!school) throw new Error('School not found for this admin');
    return school._id;
};

// Helper: Calculate total working days in a month (excluding Sundays)
const getDaysInMonthExcludingSundays = (month, year) => {
    const date = new Date(year, month - 1, 1);
    let workingDays = 0;
    while (date.getMonth() === month - 1) {
        if (date.getDay() !== 0) { // Not Sunday
            workingDays++;
        }
        date.setDate(date.getDate() + 1);
    }
    return workingDays;
};

// @desc    Get all employees with their salary setup status
// @route   GET /api/schooladmin/payroll/setup
// @access  Private (SchoolAdmin)
const getSalarySetupList = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        // Fetch all teachers and staff
        const teachers = await Teacher.find({ school_id }).populate('user_id', 'email phone role');
        const staff = await Staff.find({ school_id }).populate('user_id', 'email phone role');

        // Fetch all configurations
        const setups = await SalarySetup.find({ school_id });

        const employeeList = [];

        // Map teachers
        teachers.forEach(t => {
            const setup = setups.find(s => s.user_id.toString() === t.user_id?._id?.toString());
            employeeList.push({
                user_id: t.user_id?._id,
                name: t.name,
                email: t.email,
                phone: t.phone,
                role: 'Teacher',
                designation: 'Teacher',
                department: 'Academic',
                setup: setup || null
            });
        });

        // Map staff
        staff.forEach(s => {
            const setup = setups.find(setup => setup.user_id.toString() === s.user_id?._id?.toString());
            employeeList.push({
                user_id: s.user_id?._id,
                name: s.name,
                email: s.email,
                phone: s.phone,
                role: 'Staff',
                designation: s.role || 'Office Staff',
                department: 'Administration',
                setup: setup || null
            });
        });

        res.json(employeeList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Save or update employee salary configuration
// @route   POST /api/schooladmin/payroll/setup
// @access  Private (SchoolAdmin)
const saveSalarySetup = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const {
            user_id,
            employee_name,
            employee_role,
            designation,
            department,
            monthly_salary,
            allowances,
            deductions,
            bank_details,
            status
        } = req.body;

        if (!user_id || !employee_name || !employee_role || !monthly_salary) {
            return res.status(400).json({ message: 'User ID, name, role, and monthly salary are required' });
        }

        const mSalary = parseFloat(monthly_salary);
        const perDaySalary = parseFloat((mSalary / 30).toFixed(2));

        // Find existing configuration
        let setup = await SalarySetup.findOne({ school_id, user_id });

        if (setup) {
            // Append history entry before updating
            setup.history.push({
                date: new Date(),
                monthly_salary: setup.monthly_salary,
                allowances: setup.allowances,
                deductions: setup.deductions,
                changed_by: req.user.email || 'Admin'
            });

            // Update details
            setup.employee_name = employee_name;
            setup.employee_role = employee_role;
            setup.designation = designation || setup.designation;
            setup.department = department || setup.department;
            setup.monthly_salary = mSalary;
            setup.per_day_salary = perDaySalary;
            setup.allowances = allowances;
            setup.deductions = deductions;
            setup.bank_details = bank_details;
            setup.status = status || setup.status;

            await setup.save();
        } else {
            // Create new configuration
            setup = await SalarySetup.create({
                school_id,
                user_id,
                employee_name,
                employee_role,
                designation: designation || (employee_role === 'Teacher' ? 'Teacher' : 'Staff'),
                department: department || 'General',
                monthly_salary: mSalary,
                per_day_salary: perDaySalary,
                allowances,
                deductions,
                bank_details,
                status: status || 'Active',
                history: []
            });
        }

        res.status(200).json({ setup, message: 'Salary structure configured successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get salary history
// @route   GET /api/schooladmin/payroll/setup/history/:user_id
// @access  Private (SchoolAdmin)
const getSalarySetupHistory = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const setup = await SalarySetup.findOne({ school_id, user_id: req.params.id });
        if (!setup) {
            return res.status(404).json({ message: 'Salary setup not configured for this employee' });
        }
        res.json(setup.history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get draft calculations for payroll generation
// @route   GET /api/schooladmin/payroll/draft
// @access  Private (SchoolAdmin)
const fetchPayrollDraft = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { month, year, user_id } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and Year parameters are required' });
        }

        const m = parseInt(month);
        const y = parseInt(year);

        // Fetch salary configuration
        const setups = await SalarySetup.find({ school_id, status: 'Active' });
        if (user_id) {
            const singleSetup = setups.find(s => s.user_id.toString() === user_id.toString());
            if (!singleSetup) {
                return res.status(404).json({ message: 'Active Salary Setup not found for this employee' });
            }
        }

        // Fetch attendance logs for this month
        const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

        const attendanceDocs = await StaffAttendance.find({
            school_id,
            date: { $gte: startDate, $lte: endDate }
        });

        // Determine default working days (excluding Sundays)
        const workingDays = getDaysInMonthExcludingSundays(m, y);

        // Fetch already generated payroll records for this month/year to prevent duplicate drafts or overlay status
        const existingPayrolls = await Payroll.find({ school_id, month: m, year: y });

        const draftRecords = [];

        for (const setup of setups) {
            // If fetching single and doesn't match, skip
            if (user_id && setup.user_id.toString() !== user_id.toString()) continue;

            const existing = existingPayrolls.find(p => p.user_id.toString() === setup.user_id.toString());

            let presentDays = 0;
            let absentDays = 0;

            // Fetch records from attendance logs
            attendanceDocs.forEach(doc => {
                if (doc.role_filter === setup.employee_role) {
                    const record = doc.records.find(r => r.user_id && r.user_id.toString() === setup.user_id.toString());
                    if (record) {
                        if (record.status === 'Present') presentDays++;
                        else if (record.status === 'Absent') absentDays++;
                    }
                }
            });

            // Fallback: If no attendance was logged at all for this user, default present to all working days
            if (presentDays === 0 && absentDays === 0) {
                presentDays = workingDays;
            }

            const halfDays = existing?.attendance_summary?.half_days || 0;
            const paidLeaves = existing?.attendance_summary?.paid_leaves || 0;

            // Auto formulas calculations
            const perDaySalary = parseFloat((setup.monthly_salary / workingDays).toFixed(2));
            const payableDays = presentDays + paidLeaves + (halfDays * 0.5);
            const grossSalary = parseFloat((perDaySalary * payableDays).toFixed(2));

            const hra = setup.allowances?.hra || 0;
            const transport = setup.allowances?.transport || 0;
            const medical = setup.allowances?.medical || 0;
            const otherAllowances = setup.allowances?.other || 0;
            const allowancesTotal = hra + transport + medical + otherAllowances;

            const pf = setup.deductions?.pf || 0;
            const esi = setup.deductions?.esi || 0;
            const profTax = setup.deductions?.professional_tax || 0;
            const otherDeductions = setup.deductions?.other || 0;
            const deductionsTotal = pf + esi + profTax + otherDeductions;

            const netSalary = parseFloat((grossSalary + allowancesTotal - deductionsTotal).toFixed(2));

            draftRecords.push({
                user_id: setup.user_id,
                employee_name: setup.employee_name,
                employee_role: setup.employee_role,
                designation: setup.designation,
                month: m,
                year: y,
                existing_payroll_id: existing?._id || null,
                existing_status: existing?.status || 'Draft',
                attendance_summary: {
                    working_days: workingDays,
                    present_days: presentDays,
                    absent_days: absentDays,
                    half_days: halfDays,
                    paid_leaves: paidLeaves
                },
                salary_breakdown: {
                    monthly_salary: setup.monthly_salary,
                    per_day_salary: perDaySalary,
                    payable_days: payableDays,
                    gross_salary: grossSalary,
                    allowances_total: allowancesTotal,
                    deductions_total: deductionsTotal,
                    net_salary: netSalary,
                    allowances: { hra, transport, medical, other: otherAllowances },
                    deductions: { pf, esi, professional_tax: profTax, other: otherDeductions }
                },
                payment_details: {
                    payment_method: existing?.payment_details?.payment_method || 'Unpaid',
                    transaction_ref: existing?.payment_details?.transaction_ref || '',
                    payment_date: existing?.payment_details?.payment_date || null
                }
            });
        }

        res.json(draftRecords);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create/Upsert bulk Payroll generated logs
// @route   POST /api/schooladmin/payroll
// @access  Private (SchoolAdmin)
const savePayroll = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { payrolls } = req.body; // Array of payroll objects

        if (!payrolls || !Array.isArray(payrolls)) {
            return res.status(400).json({ message: 'Payrolls array is required' });
        }

        const savedPayrolls = [];

        for (const p of payrolls) {
            const query = {
                school_id,
                user_id: p.user_id,
                month: p.month,
                year: p.year
            };

            const data = {
                school_id,
                user_id: p.user_id,
                employee_name: p.employee_name,
                employee_role: p.employee_role,
                designation: p.designation,
                month: p.month,
                year: p.year,
                attendance_summary: p.attendance_summary,
                salary_breakdown: p.salary_breakdown,
                payment_details: p.payment_details || { payment_method: 'Unpaid' },
                status: p.status || 'Generated'
            };

            const doc = await Payroll.findOneAndUpdate(query, data, { new: true, upsert: true });
            savedPayrolls.push(doc);
        }

        res.status(200).json({ payrolls: savedPayrolls, message: 'Payroll logs generated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all created Payroll records for a month/year
// @route   GET /api/schooladmin/payroll
// @access  Private (SchoolAdmin)
const getPayrollList = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { month, year, status } = req.query;

        const filter = { school_id };
        if (month) filter.month = parseInt(month);
        if (year) filter.year = parseInt(year);
        if (status) filter.status = status;

        const payrolls = await Payroll.find(filter);
        res.json(payrolls);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update single payroll status / process payment details
// @route   PUT /api/schooladmin/payroll/:id
// @access  Private (SchoolAdmin)
const updatePayrollStatus = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { status, payment_details } = req.body;

        const payroll = await Payroll.findOne({ _id: req.params.id, school_id });

        if (!payroll) {
            return res.status(404).json({ message: 'Payroll record not found' });
        }

        payroll.status = status || payroll.status;
        if (payment_details) {
            payroll.payment_details = {
                payment_method: payment_details.payment_method || payroll.payment_details.payment_method,
                transaction_ref: payment_details.transaction_ref || payroll.payment_details.transaction_ref,
                payment_date: payment_details.payment_date ? new Date(payment_details.payment_date) : new Date()
            };
        }

        await payroll.save();
        res.json({ payroll, message: 'Payroll status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get reports and aggregated summary metrics
// @route   GET /api/schooladmin/payroll/reports
// @access  Private (SchoolAdmin)
const getPayrollReports = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { month, year, role, status, department } = req.query;

        const filter = { school_id };
        if (month) filter.month = parseInt(month);
        if (year) filter.year = parseInt(year);
        if (status) filter.status = status;
        if (role) filter.employee_role = role;

        let payrolls = await Payroll.find(filter);

        // Filter by department if needed (pulls from SalarySetup since department is in SalarySetup)
        if (department) {
            const setups = await SalarySetup.find({ school_id, department });
            const userIds = setups.map(s => s.user_id.toString());
            payrolls = payrolls.filter(p => userIds.includes(p.user_id.toString()));
        }

        res.json(payrolls);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get dashboard totals summary widgets
// @route   GET /api/schooladmin/payroll/dashboard
// @access  Private (SchoolAdmin)
const getPayrollDashboardStats = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { month, year } = req.query;

        const m = month ? parseInt(month) : new Date().getMonth() + 1;
        const y = year ? parseInt(year) : new Date().getFullYear();

        const teachersCount = await Teacher.countDocuments({ school_id });
        const staffCount = await Staff.countDocuments({ school_id });

        const monthlyPayrolls = await Payroll.find({ school_id, month: m, year: y });

        const totalGenerated = monthlyPayrolls.length;
        const totalPaid = monthlyPayrolls.filter(p => p.status === 'Paid').length;
        const totalPending = monthlyPayrolls.filter(p => p.status !== 'Paid').length;

        const totalExpense = monthlyPayrolls
            .filter(p => p.status === 'Paid')
            .reduce((sum, p) => sum + (p.salary_breakdown?.net_salary || 0), 0);

        res.json({
            totalTeachers: teachersCount,
            totalStaff: staffCount,
            payrollGenerated: totalGenerated,
            payrollPaid: totalPaid,
            payrollPending: totalPending,
            monthlySalaryExpense: parseFloat(totalExpense.toFixed(2))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getSalarySetupList,
    saveSalarySetup,
    getSalarySetupHistory,
    fetchPayrollDraft,
    savePayroll,
    getPayrollList,
    updatePayrollStatus,
    getPayrollReports,
    getPayrollDashboardStats
};
