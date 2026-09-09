const School = require('../models/School');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');
const Expense = require('../models/Expense');
const Payroll = require('../models/Payroll');

// @desc    Get all schools
// @route   GET /api/superadmin/schools
// @access  Private (SuperAdmin only)
const getSchools = async (req, res) => {
    try {
        const schools = await School.find({}).populate('admin_id', 'email phone name');
        res.json(schools);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a school
// @route   POST /api/superadmin/schools
// @access  Private (SuperAdmin only)
const createSchool = async (req, res) => {
    try {
        const {
            name, location, contact_number, email,
            founder_name, founder_phone, founder_email, logo,
            adminPassword
        } = req.body;

        // Check if school with email exists
        const schoolExists = await School.findOne({ email });
        if (schoolExists) {
            return res.status(400).json({ message: 'School with this email already exists' });
        }

        // Use provided password or fallback
        const rawPassword = adminPassword || `${name.replace(/\s+/g, '')}@123`;
        
        // Check if user email exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Create the school admin user
        const adminUser = await User.create({
            email,
            password: rawPassword,
            role: 'SchoolAdmin'
        });

        // Create the school
        const school = await School.create({
            name, location, contact_number, email,
            founder_name, founder_phone, founder_email, logo,
            admin_id: adminUser._id
        });

        res.status(201).json({
            school,
            message: 'School and Admin created successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get school by ID
// @route   GET /api/superadmin/schools/:id
// @access  Private (SuperAdmin only)
const getSchoolById = async (req, res) => {
    try {
        const school = await School.findById(req.params.id).populate('admin_id', 'email phone');
        if (school) {
            res.json(school);
        } else {
            res.status(404).json({ message: 'School not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a school
// @route   PUT /api/superadmin/schools/:id
// @access  Private (SuperAdmin only)
const updateSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);

        if (school) {
            school.name = req.body.name || school.name;
            school.location = req.body.location || school.location;
            school.contact_number = req.body.contact_number || school.contact_number;
            school.logo = req.body.logo || school.logo;
            school.founder_name = req.body.founder_name || school.founder_name;
            school.founder_phone = req.body.founder_phone || school.founder_phone;
            school.founder_email = req.body.founder_email || school.founder_email;

            const updatedSchool = await school.save();
            res.json(updatedSchool);
        } else {
            res.status(404).json({ message: 'School not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a school
// @route   DELETE /api/superadmin/schools/:id
// @access  Private (SuperAdmin only)
const deleteSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);

        if (school) {
            // Delete the associated admin user
            await User.findByIdAndDelete(school.admin_id);
            // Delete the school
            await School.findByIdAndDelete(req.params.id);
            res.json({ message: 'School removed' });
        } else {
            res.status(404).json({ message: 'School not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/superadmin/dashboard
// @access  Private (SuperAdmin only)
const getDashboardStats = async (req, res) => {
    try {
        const totalSchools = await School.countDocuments();
        
        // Count teachers & staff from models or User role fallback
        const teacherCountFromModel = await Teacher.countDocuments();
        const teacherCountFromUser = await User.countDocuments({ role: 'Teacher' });
        const totalTeachers = Math.max(teacherCountFromModel, teacherCountFromUser);

        const staffCountFromModel = await Staff.countDocuments();
        const staffCountFromUser = await User.countDocuments({ role: 'Staff' });
        const totalStaff = Math.max(staffCountFromModel, staffCountFromUser);

        const totalStudents = await Student.countDocuments();
        const totalParents = await User.countDocuments({ role: 'Parent' });

        // Aggregate General Expenses
        const generalExpenseAggr = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const generalExpenses = generalExpenseAggr.length > 0 ? generalExpenseAggr[0].total : 0;

        // Aggregate Paid Payroll Expenses
        const payrollAggr = await Payroll.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$salary_breakdown.net_salary' } } }
        ]);
        const payrollExpenses = payrollAggr.length > 0 ? payrollAggr[0].total : 0;

        const totalExpenses = generalExpenses + payrollExpenses;

        res.json({
            totalSchools,
            totalTeachers,
            totalStaff,
            totalStudents,
            totalParents,
            totalExpenses,
            generalExpenses,
            payrollExpenses
        });
    } catch (error) {
        console.error('Error fetching superadmin stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getSchools,
    createSchool,
    getSchoolById,
    updateSchool,
    deleteSchool,
    getDashboardStats
};
