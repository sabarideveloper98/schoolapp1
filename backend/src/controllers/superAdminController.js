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
    let createdAdminUser = null;
    let createdSchool = null;

    try {
        const {
            name, location, contact_number, email,
            founder_name, founder_phone, founder_email, logo,
            code, address,
            adminPassword
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'School name and email are required' });
        }

        // Check if school with email exists
        const schoolExists = await School.findOne({ email: email.trim().toLowerCase() });
        if (schoolExists) {
            return res.status(400).json({ message: 'School with this email already exists' });
        }

        // Check if user email exists
        const userExists = await User.findOne({ email: email.trim().toLowerCase() });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Generate clean unique school code
        let baseCode = (code || name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || 'SCH').toUpperCase();
        let schoolCode = baseCode;
        let codeCounter = 1;
        while (await School.findOne({ code: schoolCode })) {
            schoolCode = `${baseCode}${codeCounter++}`;
        }

        // Generate unique school_id
        let uniqueSchoolId = `SCH_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;
        while (await School.findOne({ school_id: uniqueSchoolId })) {
            uniqueSchoolId = `SCH_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;
        }

        // Generate valid unique database name: school_<cleaned_unique_id>
        const cleanDbSuffix = uniqueSchoolId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const dbName = `school_${cleanDbSuffix}`;

        // Verify no duplicate db_name
        const existingDbSchool = await School.findOne({ db_name: dbName });
        if (existingDbSchool) {
            return res.status(400).json({ message: 'Database mapping conflict. Please retry.' });
        }

        // Use provided password or fallback
        const rawPassword = adminPassword || `${name.replace(/\s+/g, '')}@123`;

        // 1. Create the school admin user in central DB
        createdAdminUser = await User.create({
            email: email.trim().toLowerCase(),
            password: rawPassword,
            role: 'SchoolAdmin',
            status: 'Active'
        });

        // 2. Create the school registry entry with status 'provisioning'
        createdSchool = await School.create({
            name: name.trim(),
            code: schoolCode,
            school_id: uniqueSchoolId,
            db_name: dbName,
            location: location || '',
            address: address || location || '',
            contact_number: contact_number || '',
            email: email.trim().toLowerCase(),
            founder_name: founder_name || '',
            founder_phone: founder_phone || '',
            founder_email: founder_email || '',
            logo: logo || '',
            admin_id: createdAdminUser._id,
            status: 'Active',
            provisioning_status: 'provisioning'
        });

        // Link school_id to the created admin user
        createdAdminUser.school_id = createdSchool._id;
        await createdAdminUser.save();

        // 3. Automatically provision the dedicated database: initialize collections & indexes
        const { provisionTenantDatabase } = require('../services/tenantConnectionManager');
        const provisionResult = await provisionTenantDatabase(dbName);

        // 4. Update school provisioning status to 'ready'
        createdSchool.provisioning_status = 'ready';
        await createdSchool.save();

        res.status(201).json({
            success: true,
            school: createdSchool,
            adminPassword: rawPassword,
            provisioning: provisionResult,
            message: `School created and dedicated database ${dbName} provisioned successfully`
        });

    } catch (error) {
        console.error('createSchool error:', error);

        // Failure handling / compensation
        if (createdSchool) {
            try {
                createdSchool.provisioning_status = 'failed';
                await createdSchool.save();
            } catch (err) {
                // Ignore rollback recording error
            }
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create school and provision database',
            error: error.message
        });
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
