const StaffRole = require('../models/StaffRole');
const Staff = require('../models/Staff');
const School = require('../models/School');
const User = require('../models/User');

const DEFAULT_STAFF_ROLES = [
    { name: 'Driver', description: 'School bus driving and transport operations' },
    { name: 'Peon', description: 'Office assistance and campus maintenance support' },
    { name: 'Accountant', description: 'Accounts, fee billing, and finance ledger maintenance' },
    { name: 'Librarian', description: 'Library cataloging, book issue and return management' },
    { name: 'Security', description: 'Campus security, gate control, and visitor surveillance' },
    { name: 'Office Assistant', description: 'Front-desk clerical, administrative, and record management' },
    { name: 'Cleaner', description: 'Campus sanitation and hygiene upkeep' },
    { name: 'Clerk', description: 'Documentation, office registers, and clerical tasks' }
];

// Helper to get school_id from the logged-in SchoolAdmin
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

// @desc    Get all staff roles (auto-seeds defaults if empty)
// @route   GET /api/schooladmin/staff-roles
// @access  Private (SchoolAdmin)
const getStaffRoles = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        // Auto-seed default roles if none exist for this school
        const totalCount = await StaffRole.countDocuments({ school_id });
        if (totalCount === 0) {
            const seedRoles = DEFAULT_STAFF_ROLES.map(r => ({
                school_id,
                name: r.name,
                description: r.description,
                status: 'Active'
            }));
            await StaffRole.insertMany(seedRoles);
        }

        const query = { school_id };

        if (req.query.status && ['Active', 'Inactive'].includes(req.query.status)) {
            query.status = req.query.status;
        }

        if (req.query.search && req.query.search.trim()) {
            const searchRegex = new RegExp(req.query.search.trim(), 'i');
            query.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        const roles = await StaffRole.find(query).sort({ name: 1 });

        // Calculate staff count for each role
        const staffList = await Staff.find({ school_id }, 'role');
        const rolesWithCount = roles.map(r => {
            const obj = r.toObject ? r.toObject() : { ...r };
            obj.staffCount = staffList.filter(s => s.role && s.role.trim().toLowerCase() === r.name.trim().toLowerCase()).length;
            return obj;
        });

        res.json(rolesWithCount);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch staff roles', error: error.message });
    }
};

// @desc    Create a new staff role
// @route   POST /api/schooladmin/staff-roles
// @access  Private (SchoolAdmin)
const createStaffRole = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, description, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Role name is required' });
        }

        const trimmedName = name.trim();

        // Check for duplicate role name (case-insensitive)
        const existing = await StaffRole.findOne({
            school_id,
            name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
        });

        if (existing) {
            return res.status(400).json({ message: `Staff role "${trimmedName}" already exists` });
        }

        const role = await StaffRole.create({
            school_id,
            name: trimmedName,
            description: (description || '').trim(),
            status: status === 'Inactive' ? 'Inactive' : 'Active'
        });

        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create staff role', error: error.message });
    }
};

// @desc    Update a staff role
// @route   PUT /api/schooladmin/staff-roles/:id
// @access  Private (SchoolAdmin)
const updateStaffRole = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, description, status } = req.body;

        const role = await StaffRole.findOne({ _id: req.params.id, school_id });
        if (!role) {
            return res.status(404).json({ message: 'Staff role not found' });
        }

        if (name && name.trim()) {
            const trimmedName = name.trim();
            // Check for duplicate with other roles
            const existing = await StaffRole.findOne({
                school_id,
                _id: { $ne: req.params.id },
                name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
            });

            if (existing) {
                return res.status(400).json({ message: `Another staff role named "${trimmedName}" already exists` });
            }

            // If name changed, update all staff records that had the old role name
            if (role.name !== trimmedName) {
                await Staff.updateMany({ school_id, role: role.name }, { role: trimmedName });
            }
            role.name = trimmedName;
        }

        if (description !== undefined) {
            role.description = (description || '').trim();
        }

        if (status && ['Active', 'Inactive'].includes(status)) {
            role.status = status;
        }

        await role.save();
        res.json(role);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update staff role', error: error.message });
    }
};

// @desc    Delete a staff role
// @route   DELETE /api/schooladmin/staff-roles/:id
// @access  Private (SchoolAdmin)
const deleteStaffRole = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        const role = await StaffRole.findOne({ _id: req.params.id, school_id });
        if (!role) {
            return res.status(404).json({ message: 'Staff role not found' });
        }

        // Check if role is currently assigned to any staff member
        const assignedCount = await Staff.countDocuments({ school_id, role: role.name });
        if (assignedCount > 0) {
            return res.status(400).json({
                message: `Cannot delete role "${role.name}" because it is currently assigned to ${assignedCount} staff member(s). Please reassign them first or set status to Inactive.`
            });
        }

        await StaffRole.findByIdAndDelete(req.params.id);
        res.json({ message: `Staff role "${role.name}" deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete staff role', error: error.message });
    }
};

// @desc    Toggle staff role status (Active <-> Inactive)
// @route   PATCH /api/schooladmin/staff-roles/:id/toggle-status
// @access  Private (SchoolAdmin)
const toggleStaffRoleStatus = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        const role = await StaffRole.findOne({ _id: req.params.id, school_id });
        if (!role) {
            return res.status(404).json({ message: 'Staff role not found' });
        }

        role.status = role.status === 'Active' ? 'Inactive' : 'Active';
        await role.save();

        res.json({
            role,
            message: `Staff role "${role.name}" status changed to ${role.status}`
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle staff role status', error: error.message });
    }
};

module.exports = {
    getStaffRoles,
    createStaffRole,
    updateStaffRole,
    deleteStaffRole,
    toggleStaffRoleStatus
};
