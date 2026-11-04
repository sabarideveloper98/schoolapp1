const CommonSubject = require('../models/CommonSubject');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const School = require('../models/School');
const User = require('../models/User');

const DEFAULT_COMMON_SUBJECTS = [
    { name: 'Tamil', code: 'TAM101', description: 'Language and regional literature studies' },
    { name: 'English', code: 'ENG101', description: 'Grammar, prose, poetry and communication skills' },
    { name: 'Mathematics', code: 'MATH101', description: 'Arithmetic, Algebra, Geometry and Trigonometry' },
    { name: 'Science', code: 'SCI101', description: 'Physics, Chemistry and Natural Sciences' },
    { name: 'Social Science', code: 'SOC101', description: 'History, Geography, Civics and Economics' },
    { name: 'Computer Science', code: 'CS101', description: 'Information technology, fundamentals and programming' }
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

// @desc    Get all common subjects (auto-seeds defaults and syncs existing subjects if empty)
// @route   GET /api/schooladmin/common-subjects
// @access  Private (SchoolAdmin)
const getCommonSubjects = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        // Auto-seed if empty for this school
        const totalCount = await CommonSubject.countDocuments({ school_id });
        if (totalCount === 0) {
            // First check if school already had any subjects in Subject collection
            const existingLegacy = await Subject.find({ school_id });
            const seedMap = new Map();
            const usedCodes = new Set();

            // Populate default common subjects
            DEFAULT_COMMON_SUBJECTS.forEach(s => {
                const codeUpper = s.code.toUpperCase();
                usedCodes.add(codeUpper);
                seedMap.set(s.name.toLowerCase(), {
                    school_id,
                    name: s.name,
                    code: codeUpper,
                    description: s.description,
                    status: 'Active'
                });
            });

            // Merge any existing school subjects so nothing is lost
            existingLegacy.forEach(legacy => {
                if (legacy.name && !seedMap.has(legacy.name.toLowerCase())) {
                    let code = (legacy.code || legacy.name.substring(0, 4).toUpperCase()).trim().toUpperCase();
                    if (usedCodes.has(code)) {
                        let suffix = 1;
                        while (usedCodes.has(`${code}-${suffix}`)) {
                            suffix++;
                        }
                        code = `${code}-${suffix}`;
                    }
                    usedCodes.add(code);

                    seedMap.set(legacy.name.toLowerCase(), {
                        school_id,
                        name: legacy.name,
                        code,
                        description: 'School academic subject',
                        status: 'Active'
                    });
                }
            });

            const seedItems = Array.from(seedMap.values());
            if (seedItems.length > 0) {
                // Insert one-by-one or ordered: false so individual duplicates don't fail
                for (const item of seedItems) {
                    try {
                        await CommonSubject.create(item);
                    } catch (e) {
                        // ignore duplicate key if race condition
                    }
                }
            }
        }

        const query = { school_id };

        if (req.query.status && ['Active', 'Inactive'].includes(req.query.status)) {
            query.status = req.query.status;
        }

        if (req.query.search && req.query.search.trim()) {
            const searchRegex = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            query.$or = [
                { name: searchRegex },
                { code: searchRegex },
                { description: searchRegex }
            ];
        }

        const subjects = await CommonSubject.find(query).sort({ name: 1 });

        // Calculate teacher count assigned to each subject
        const teachers = await Teacher.find({ school_id }, 'domains');
        const subjectsWithCounts = subjects.map(sub => {
            const obj = sub.toObject ? sub.toObject() : { ...sub };
            const subNameLower = sub.name.trim().toLowerCase();
            obj.teacherCount = teachers.filter(t => {
                if (!t.domains || !Array.isArray(t.domains)) return false;
                return t.domains.some(d => typeof d === 'string' && d.trim().toLowerCase() === subNameLower);
            }).length;
            return obj;
        });

        res.json(subjectsWithCounts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch common subjects', error: error.message });
    }
};

// @desc    Create a new common subject
// @route   POST /api/schooladmin/common-subjects
// @access  Private (SchoolAdmin)
const createCommonSubject = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, code, description, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Subject name is required' });
        }
        if (!code || !code.trim()) {
            return res.status(400).json({ message: 'Subject code is required' });
        }

        const trimmedName = name.trim();
        const trimmedCode = code.trim().toUpperCase();

        // Check duplicate name per school (case-insensitive)
        const existingName = await CommonSubject.findOne({
            school_id,
            name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
        });
        if (existingName) {
            return res.status(400).json({ message: `Subject with name "${trimmedName}" already exists` });
        }

        // Check duplicate code per school (case-insensitive)
        const existingCode = await CommonSubject.findOne({
            school_id,
            code: { $regex: `^${trimmedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
        });
        if (existingCode) {
            return res.status(400).json({ message: `Subject code "${trimmedCode}" is already in use by "${existingCode.name}"` });
        }

        const subject = await CommonSubject.create({
            school_id,
            name: trimmedName,
            code: trimmedCode,
            description: (description || '').trim(),
            status: status === 'Inactive' ? 'Inactive' : 'Active'
        });

        // Also ensure it exists in legacy Subject collection for full ecosystem compatibility
        const legacySubject = await Subject.findOne({ school_id, name: trimmedName });
        if (!legacySubject) {
            await Subject.create({
                school_id,
                name: trimmedName,
                code: trimmedCode
            });
        }

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create common subject', error: error.message });
    }
};

// @desc    Update a common subject
// @route   PUT /api/schooladmin/common-subjects/:id
// @access  Private (SchoolAdmin)
const updateCommonSubject = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, code, description, status } = req.body;

        const subject = await CommonSubject.findOne({ _id: req.params.id, school_id });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        const oldName = subject.name;

        if (name && name.trim()) {
            const trimmedName = name.trim();
            const existingName = await CommonSubject.findOne({
                school_id,
                _id: { $ne: req.params.id },
                name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
            });
            if (existingName) {
                return res.status(400).json({ message: `Another subject named "${trimmedName}" already exists` });
            }
            subject.name = trimmedName;
        }

        if (code && code.trim()) {
            const trimmedCode = code.trim().toUpperCase();
            const existingCode = await CommonSubject.findOne({
                school_id,
                _id: { $ne: req.params.id },
                code: { $regex: `^${trimmedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
            });
            if (existingCode) {
                return res.status(400).json({ message: `Subject code "${trimmedCode}" is already in use by "${existingCode.name}"` });
            }
            subject.code = trimmedCode;
        }

        if (description !== undefined) {
            subject.description = (description || '').trim();
        }

        if (status && ['Active', 'Inactive'].includes(status)) {
            subject.status = status;
        }

        await subject.save();

        // If name changed, cascade update teachers that had the old subject name in domains
        if (oldName !== subject.name) {
            const teachers = await Teacher.find({ school_id, domains: oldName });
            for (const t of teachers) {
                t.domains = t.domains.map(d => (d.trim().toLowerCase() === oldName.trim().toLowerCase() ? subject.name : d));
                await t.save();
            }
            // Update legacy Subject if present
            await Subject.updateMany({ school_id, name: oldName }, { name: subject.name, code: subject.code });
        }

        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update common subject', error: error.message });
    }
};

// @desc    Delete a common subject
// @route   DELETE /api/schooladmin/common-subjects/:id
// @access  Private (SchoolAdmin)
const deleteCommonSubject = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        const subject = await CommonSubject.findOne({ _id: req.params.id, school_id });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Check if any teachers are assigned this subject
        const teachers = await Teacher.find({ school_id });
        const subNameLower = subject.name.trim().toLowerCase();
        const assignedTeachers = teachers.filter(t => {
            return t.domains && Array.isArray(t.domains) && t.domains.some(d => d.trim().toLowerCase() === subNameLower);
        });

        if (assignedTeachers.length > 0) {
            return res.status(400).json({
                message: `Cannot delete subject "${subject.name}" because it is currently assigned to ${assignedTeachers.length} teacher(s). Please unassign the subject first or set its status to Inactive.`
            });
        }

        await CommonSubject.findByIdAndDelete(req.params.id);
        res.json({ message: `Subject "${subject.name}" deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete common subject', error: error.message });
    }
};

// @desc    Toggle common subject status (Active <-> Inactive)
// @route   PATCH /api/schooladmin/common-subjects/:id/toggle-status
// @access  Private (SchoolAdmin)
const toggleCommonSubjectStatus = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        const subject = await CommonSubject.findOne({ _id: req.params.id, school_id });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        subject.status = subject.status === 'Active' ? 'Inactive' : 'Active';
        await subject.save();

        res.json({
            subject,
            message: `Subject "${subject.name}" status changed to ${subject.status}`
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle subject status', error: error.message });
    }
};

module.exports = {
    getCommonSubjects,
    createCommonSubject,
    updateCommonSubject,
    deleteCommonSubject,
    toggleCommonSubjectStatus
};
