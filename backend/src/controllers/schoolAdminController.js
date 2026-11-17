const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const School = require('../models/School');
const Staff = require('../models/Staff');
const Driver = require('../models/Driver');
const Bus = require('../models/Bus');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const StudentTransport = require('../models/StudentTransport');
const FeePayment = require('../models/FeePayment');
const TeacherLeave = require('../models/TeacherLeave');
const StaffLeave = require('../models/StaffLeave');
const {
    generateAdmissionNumbers,
    generateRollNumbers,
    assignNumbersForStudents
} = require('../utils/studentNumberGenerator');
const { serializeStudent } = require('../utils/studentSerializer');

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

// @desc    Get School Admin Dashboard Stats
// @route   GET /api/schooladmin/dashboard
// @access  Private (SchoolAdmin only)
const getDashboardStats = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        const totalTeachers = await Teacher.countDocuments({ school_id });
        const totalStaff = await Staff.countDocuments({ school_id });
        const totalClasses = await Class.countDocuments({ school_id });
        const totalSubjects = await Subject.countDocuments({ school_id });
        const totalStudents = await Student.countDocuments({ school_id });
        const totalDrivers = await Driver.countDocuments({ school_id });
        const totalBuses = await Bus.countDocuments({ school_id });

        res.json({
            totalTeachers,
            totalStaff,
            totalClasses,
            totalSubjects,
            totalStudents,
            totalDrivers,
            totalBuses
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Helper to format photo/image field into full accessible URL or null
const formatPhotoUrl = (photoVal, req) => {
    if (!photoVal || typeof photoVal !== 'string' || !photoVal.trim()) {
        return null;
    }
    const trimmed = photoVal.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    const host = req.get ? req.get('host') : (req.headers && req.headers.host) || 'localhost:5005';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${cleanPath}`;
};

// @desc    Get all teachers for the school
// @route   GET /api/schooladmin/teachers
// @access  Private (SchoolAdmin only)
const getTeachers = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const teachers = await Teacher.find({ school_id }).lean();
        const formattedTeachers = teachers.map(teacher => {
            const rawPhoto = teacher.photo || teacher.profileImage || teacher.profile_image || teacher.image || teacher.avatar || null;
            return {
                ...teacher,
                id: teacher._id,
                password: teacher.password || '123456',
                photo: formatPhotoUrl(rawPhoto, req)
            };
        });
        res.json(formattedTeachers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a teacher
// @route   POST /api/schooladmin/teachers
// @access  Private (SchoolAdmin only)
const createTeacher = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, email, phone, address, qualification, experience, photo, password, domains } = req.body;

        let parsedDomains = [];
        if (domains) {
            parsedDomains = Array.isArray(domains) ? domains : domains.split(',').map(d => d.trim()).filter(d => d);
        }

        // Check if user email exists
        if (email) {
            const userExists = await User.findOne({ email: email.trim().toLowerCase() });
            if (userExists) {
                return res.status(400).json({ message: 'User with this email already exists' });
            }
        }

        // Use custom password or fallback
        const rawPassword = password || `${name ? name.replace(/\s+/g, '') : 'Teacher'}@123`;

        // Create User account
        const user = await User.create({
            email: email ? email.trim().toLowerCase() : undefined,
            phone: phone ? phone.trim() : undefined,
            password: rawPassword,
            role: 'Teacher'
        });

        const parsedExperience = parseInt(experience, 10) || 0;

        // Create Teacher profile
        const teacher = await Teacher.create({
            name: name || 'Unnamed Teacher',
            email: email ? email.trim().toLowerCase() : '',
            phone: phone || '',
            address: address || 'N/A',
            qualification: qualification || 'N/A',
            experience: parsedExperience,
            photo: photo || '',
            school_id,
            user_id: user._id,
            domains: parsedDomains,
            password: rawPassword
        });

        // Link reference in user
        user.reference_id = teacher._id;
        await user.save();

        res.status(201).json({
            teacher,
            message: 'Teacher created successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a teacher
// @route   DELETE /api/schooladmin/teachers/:id
// @access  Private (SchoolAdmin only)
const deleteTeacher = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const teacher = await Teacher.findOne({ _id: req.params.id, school_id });

        if (teacher) {
            await User.findByIdAndDelete(teacher.user_id);
            await Teacher.findByIdAndDelete(teacher._id);
            res.json({ message: 'Teacher removed' });
        } else {
            res.status(404).json({ message: 'Teacher not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTeacher = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, email, phone, address, qualification, experience, photo, password, domains } = req.body;

        const teacher = await Teacher.findOne({ _id: req.params.id, school_id });
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        if (email && email.trim().toLowerCase() !== teacher.email) {
            const userExists = await User.findOne({ email: email.trim().toLowerCase() });
            if (userExists) return res.status(400).json({ message: 'Email already in use' });
        }

        const user = await User.findById(teacher.user_id);

        if (user) {
            if (password) user.password = password;
            if (email) user.email = email.trim().toLowerCase();
            if (phone) user.phone = phone.trim();
            await user.save();
        }

        if (name) teacher.name = name;
        if (email) teacher.email = email.trim().toLowerCase();
        if (phone) teacher.phone = phone;
        if (address) teacher.address = address;
        if (qualification) teacher.qualification = qualification;
        if (experience !== undefined && experience !== null) {
            teacher.experience = parseInt(experience, 10) || 0;
        }
        if (photo) teacher.photo = photo;
        if (password) teacher.password = password;
        if (domains !== undefined) {
            teacher.domains = Array.isArray(domains) ? domains : domains.split(',').map(d => d.trim()).filter(d => d);
        }

        await teacher.save();
        res.json({ teacher, message: 'Teacher updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Note: Other CRUD operations (Staff, Subjects, Classes) follow the exact same pattern.

// --- STAFF MANAGEMENT ---
const getStaff = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const staff = await Staff.find({ school_id }).lean();
        const formattedStaff = staff.map(member => {
            const rawPhoto = member.photo || member.profileImage || member.profile_image || member.image || member.avatar || null;
            return {
                ...member,
                id: member._id,
                photo: formatPhotoUrl(rawPhoto, req),
                aadhaar_copy: member.aadhaar_copy || null
            };
        });
        res.json(formattedStaff);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createStaff = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, email, phone, role, role_title, address, qualification, experience, photo, aadhaar_copy, password } = req.body;

        if (email) {
            const userExists = await User.findOne({ email: email.trim().toLowerCase() });
            if (userExists) return res.status(400).json({ message: 'User already exists' });
        }

        const rawPassword = password || `${name ? name.replace(/\s+/g, '') : 'Staff'}@123`;
        if (!email) {
            return res.status(400).json({ message: 'Email is required to create a login account' });
        }

        // Validate Aadhaar Copy document if provided (PDF, JPG, JPEG, PNG, max 5MB)
        if (aadhaar_copy && typeof aadhaar_copy === 'string') {
            const isDataUrl = aadhaar_copy.startsWith('data:');
            if (isDataUrl) {
                const mimeMatch = aadhaar_copy.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
                if (mimeMatch) {
                    const mime = mimeMatch[1].toLowerCase();
                    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                    if (!allowedMimes.includes(mime)) {
                        return res.status(400).json({ message: 'Aadhaar document must be a PDF, JPG, JPEG, or PNG file' });
                    }
                    // Check size (~5MB limit)
                    const base64Data = aadhaar_copy.replace(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/, '');
                    const sizeInBytes = (base64Data.length * 3) / 4;
                    if (sizeInBytes > 5 * 1024 * 1024) {
                        return res.status(400).json({ message: 'Aadhaar document exceeds maximum allowed size of 5MB' });
                    }
                }
            }
        }

        const user = await User.create({
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : undefined,
            password: rawPassword,
            role: 'Staff'
        });

        const staffRole = role || role_title || 'Office Staff';
        const parsedExperience = parseInt(experience, 10) || 0;

        const staff = await Staff.create({
            name: name || 'Unnamed Staff',
            email: email.trim().toLowerCase(),
            phone: phone || '',
            role: staffRole,
            address: address || 'N/A',
            qualification: qualification || 'N/A',
            experience: parsedExperience,
            photo: photo || '',
            aadhaar_copy: aadhaar_copy || '',
            school_id,
            user_id: user._id
        });
        user.reference_id = staff._id;
        await user.save();

        if (staffRole.trim().toLowerCase() === 'driver') {
            const driverExists = await Driver.findOne({ mobile_number: phone, school_id });
            if (!driverExists) {
                await Driver.create({
                    school_id,
                    driver_id: `DRV-${Date.now()}`,
                    name: name || 'Driver',
                    mobile_number: phone || '',
                    email: email || '',
                    address: address || '',
                    license_number: `DL-${phone || Date.now()}`,
                    password: rawPassword,
                    status: 'Active'
                });
            }
        }

        res.status(201).json({ staff, message: 'Staff created' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteStaff = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const staff = await Staff.findOne({ _id: req.params.id, school_id });
        if (staff) {
            if (staff.role && staff.role.trim().toLowerCase() === 'driver') {
                await Driver.deleteMany({ mobile_number: staff.phone, school_id });
            }
            await User.findByIdAndDelete(staff.user_id);
            await Staff.findByIdAndDelete(staff._id);
            res.json({ message: 'Staff removed' });
        } else {
            res.status(404).json({ message: 'Staff not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateStaff = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, email, phone, role, address, qualification, experience, photo, aadhaar_copy, password } = req.body;

        const staff = await Staff.findOne({ _id: req.params.id, school_id });
        if (!staff) return res.status(404).json({ message: 'Staff not found' });

        if (email && email !== staff.email) {
            const userExists = await User.findOne({ email });
            if (userExists) return res.status(400).json({ message: 'Email already in use' });
        }

        // Validate Aadhaar Copy document if being updated
        if (aadhaar_copy && typeof aadhaar_copy === 'string' && aadhaar_copy.startsWith('data:')) {
            const mimeMatch = aadhaar_copy.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
            if (mimeMatch) {
                const mime = mimeMatch[1].toLowerCase();
                const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                if (!allowedMimes.includes(mime)) {
                    return res.status(400).json({ message: 'Aadhaar document must be a PDF, JPG, JPEG, or PNG file' });
                }
                const base64Data = aadhaar_copy.replace(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/, '');
                const sizeInBytes = (base64Data.length * 3) / 4;
                if (sizeInBytes > 5 * 1024 * 1024) {
                    return res.status(400).json({ message: 'Aadhaar document exceeds maximum allowed size of 5MB' });
                }
            }
        }

        const user = await User.findById(staff.user_id);

        if (password) {
            user.password = password;
        }
        if (email) {
            user.email = email;
            staff.email = email;
        }

        await user.save();

        staff.name = name || staff.name;
        staff.phone = phone || staff.phone;
        staff.role = role || staff.role;
        staff.address = address || staff.address;
        staff.qualification = qualification || staff.qualification;
        staff.experience = experience || staff.experience;
        if (photo) staff.photo = photo;
        if (aadhaar_copy !== undefined) staff.aadhaar_copy = aadhaar_copy;

        await staff.save();
        res.json({ staff, message: 'Staff updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- SUBJECT MANAGEMENT ---
const getSubjects = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const subjects = await Subject.find({ school_id });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createSubject = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, code } = req.body;
        const subject = await Subject.create({ name, code, school_id });
        res.status(201).json({ subject, message: 'Subject created' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const subject = await Subject.findOneAndDelete({ _id: req.params.id, school_id });
        if (subject) res.json({ message: 'Subject removed' });
        else res.status(404).json({ message: 'Subject not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateSubject = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, code } = req.body;
        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.id, school_id },
            { name, code },
            { new: true }
        );
        if (subject) res.json({ subject, message: 'Subject updated successfully' });
        else res.status(404).json({ message: 'Subject not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- CLASS MANAGEMENT ---
const getClasses = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const classes = await Class.find({ school_id }).populate('class_incharge_id', 'name email').lean();

        const classesWithCount = await Promise.all(classes.map(async (cls) => {
            const count = await Student.countDocuments({
                school_id,
                $or: [
                    { class_id: cls._id },
                    { class: cls.class, section: cls.section }
                ]
            });
            return {
                ...cls,
                no_student: count,
                studentCount: count
            };
        }));

        res.json(classesWithCount);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createClass = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { standard, section, class_incharge_id } = req.body; // Map standard to "class" field
        const cls = await Class.create({ class: standard, section, class_incharge_id, school_id });
        res.status(201).json({ class: cls, message: 'Class created' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteClass = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const cls = await Class.findOneAndDelete({ _id: req.params.id, school_id });
        if (cls) res.json({ message: 'Class removed' });
        else res.status(404).json({ message: 'Class not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateClass = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { standard, section, class_incharge_id } = req.body;
        const cls = await Class.findOneAndUpdate(
            { _id: req.params.id, school_id },
            { class: standard, section, class_incharge_id },
            { new: true }
        ).populate('class_incharge_id', 'name email');
        if (cls) res.json({ class: cls, message: 'Class updated successfully' });
        else res.status(404).json({ message: 'Class not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// --- CLASS SUBJECT ASSIGNMENT ---
const ClassSubject = require('../models/ClassSubject');

const getClassSubjects = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const assignments = await ClassSubject.find({ school_id })
            .populate('class_id', 'class section')
            .populate('subject_id', 'name code')
            .populate('teacher_id', 'name email');
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const assignSubjectTeacher = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { class_id, subject_id, teacher_id } = req.body;

        // Prevent duplicate assignments
        const exists = await ClassSubject.findOne({ class_id, subject_id, school_id });
        if (exists) {
            return res.status(400).json({ message: 'Subject already assigned to this class' });
        }

        const assignment = await ClassSubject.create({ class_id, subject_id, teacher_id, school_id });
        res.status(201).json({ assignment, message: 'Subject teacher assigned' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const removeSubjectTeacher = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const assignment = await ClassSubject.findOneAndDelete({ _id: req.params.id, school_id });
        if (assignment) res.json({ message: 'Assignment removed' });
        else res.status(404).json({ message: 'Assignment not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateSubjectTeacher = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { class_id, subject_id, teacher_id } = req.body;

        // Prevent duplicate assignments if changing class/subject
        const exists = await ClassSubject.findOne({
            class_id, subject_id, school_id,
            _id: { $ne: req.params.id }
        });
        if (exists) {
            return res.status(400).json({ message: 'Subject already assigned to this class' });
        }

        const assignment = await ClassSubject.findOneAndUpdate(
            { _id: req.params.id, school_id },
            { class_id, subject_id, teacher_id },
            { new: true }
        ).populate('class_id subject_id teacher_id');

        if (assignment) res.json({ assignment, message: 'Assignment updated successfully' });
        else res.status(404).json({ message: 'Assignment not found' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- STUDENT MANAGEMENT ---
const getStudents = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const filter = { school_id };
        const requestedClassId = req.query.class_id || req.query.classId;
        if (requestedClassId) {
            const cls = await Class.findById(requestedClassId);
            if (cls) {
                filter.$or = [
                    { class_id: requestedClassId },
                    { class: cls.class, section: cls.section }
                ];
            } else {
                filter.class_id = requestedClassId;
            }
        }
        const students = await Student.find(filter)
            .populate('class_id', 'class section')
            .populate('parent_user_id', 'email phone')
            .sort({ createdAt: -1 });

        const studentIds = students.map(s => s._id);
        const parentUserIds = students.map(s => (s.parent_user_id?._id || s.parent_user_id)).filter(Boolean);

        // Fetch related documents in parallel for high performance without N+1 query overhead
        const [parents, transports, feePayments] = await Promise.all([
            Parent.find({ user_id: { $in: parentUserIds } }).lean(),
            StudentTransport.find({ student_id: { $in: studentIds } })
                .populate('route_id')
                .populate('bus_id')
                .populate('pickup_stop_id')
                .populate('drop_stop_id')
                .lean(),
            FeePayment.find({ student_id: { $in: studentIds } }).sort({ payment_date: -1 }).lean()
        ]);

        const parentMap = new Map();
        parents.forEach(p => parentMap.set(p.user_id.toString(), p));

        const transportMap = new Map();
        transports.forEach(t => transportMap.set(t.student_id.toString(), t));

        const feePaymentMap = new Map();
        feePayments.forEach(fp => {
            if (!feePaymentMap.has(fp.student_id.toString())) {
                feePaymentMap.set(fp.student_id.toString(), fp);
            }
        });

        const serializedStudents = students.map(student => {
            const pUserId = (student.parent_user_id?._id || student.parent_user_id)?.toString();
            const parent = pUserId ? parentMap.get(pUserId) : null;
            const transport = transportMap.get(student._id.toString());
            const feePayment = feePaymentMap.get(student._id.toString());
            return serializeStudent(student, req, { parent, transport, feePayment });
        });

        res.json(serializedStudents);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getStudentById = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid student ID' });
        }
        const student = await Student.findOne({ _id: req.params.id, school_id })
            .populate('class_id', 'class section')
            .populate('parent_user_id', 'email phone');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Fetch related parent record if exists
        let parent = null;
        const pUserId = student.parent_user_id?._id || student.parent_user_id;
        if (pUserId) {
            parent = await Parent.findOne({ user_id: pUserId }).lean();
        }
        if (!parent && (student.parent_phone || student.guardian_phone)) {
            parent = await Parent.findOne({ school_id, phone: student.parent_phone || student.guardian_phone }).lean();
        }

        // Fetch related transport record if exists
        const transport = await StudentTransport.findOne({ student_id: student._id })
            .populate('route_id')
            .populate('bus_id')
            .populate('pickup_stop_id')
            .populate('drop_stop_id')
            .lean();

        // Fetch latest fee payment if exists
        const feePayment = await FeePayment.findOne({ student_id: student._id })
            .sort({ payment_date: -1 })
            .lean();

        const serialized = serializeStudent(student, req, { parent, transport, feePayment });
        res.json(serialized);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get next available admission number and roll number
// @route   GET /api/schooladmin/students/generate-numbers
const getNextStudentNumbers = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { academic_year, class: className, section: sectionName } = req.query;

        const [admission_number] = await generateAdmissionNumbers(school_id, academic_year, 1);

        let roll_no = '';
        if (className && sectionName) {
            const [generatedRoll] = await generateRollNumbers(school_id, academic_year, className, sectionName, 1);
            roll_no = generatedRoll;
        }

        res.status(200).json({
            success: true,
            admission_number,
            roll_no
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating student numbers', error: error.message });
    }
};

// @desc    Generate missing admission numbers and roll numbers for a batch of students
// @route   POST /api/schooladmin/students/generate-numbers-batch
const generateNumbersBatch = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { students } = req.body;

        if (!Array.isArray(students)) {
            return res.status(400).json({ message: 'Students array is required' });
        }

        const updatedStudents = await assignNumbersForStudents(school_id, students);

        res.status(200).json({
            success: true,
            students: updatedStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating batch student numbers', error: error.message });
    }
};

const validateStudentData = (data) => {
    const {
        student_name,
        first_name,
        last_name,
        father_name,
        mother_name,
        guardian_name,
        emergency_contact_name,
        date_of_birth,
        guardian_phone,
        login_phone,
        whatsapp_number,
        alternate_phone,
        emergency_contact_phone,
        guardian_email,
        login_email,
        apaar_id,
        aadhaar_last4,
        pincode,
        age
    } = data;

    // Names: letters, spaces, and standard punctuation (. - ')
    const nameRegex = /^[a-zA-Z\s.'-]+$/;
    if (student_name && !nameRegex.test(String(student_name).trim())) {
        return 'Student name must contain only letters and permitted spaces';
    }
    if (first_name && !nameRegex.test(String(first_name).trim())) {
        return 'First name must contain only letters and permitted spaces';
    }
    if (last_name && String(last_name).trim() !== '' && !nameRegex.test(String(last_name).trim())) {
        return 'Last name must contain only letters and permitted spaces';
    }
    if (father_name && String(father_name).trim() !== '' && !nameRegex.test(String(father_name).trim())) {
        return "Father's name must contain only letters and permitted spaces";
    }
    if (mother_name && String(mother_name).trim() !== '' && !nameRegex.test(String(mother_name).trim())) {
        return "Mother's name must contain only letters and permitted spaces";
    }
    if (guardian_name && String(guardian_name).trim() !== '' && !nameRegex.test(String(guardian_name).trim())) {
        return 'Guardian name must contain only letters and permitted spaces';
    }
    if (emergency_contact_name && String(emergency_contact_name).trim() !== '' && !nameRegex.test(String(emergency_contact_name).trim())) {
        return 'Emergency contact name must contain only letters and permitted spaces';
    }

    // Date of Birth: valid date and cannot be in future
    if (date_of_birth) {
        const dob = new Date(date_of_birth);
        if (isNaN(dob.getTime())) {
            return 'Please enter a valid Date of Birth';
        }
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (dob > today) {
            return 'Date of Birth cannot be a future date';
        }
    }

    // Age
    if (age !== undefined && age !== null && String(age).trim() !== '') {
        const numAge = Number(age);
        if (isNaN(numAge) || numAge <= 0) {
            return 'Age must be a valid positive numeric value';
        }
    }

    // Phone numbers: exactly 10 digits if entered
    const phoneRegex = /^\d{10}$/;
    if (guardian_phone && String(guardian_phone).trim() !== '' && !phoneRegex.test(String(guardian_phone).trim())) {
        return 'Guardian Phone must be exactly 10 digits';
    }
    if (father_phone && String(father_phone).trim() !== '' && !phoneRegex.test(String(father_phone).trim())) {
        return "Father's Phone must be exactly 10 digits";
    }
    if (mother_phone && String(mother_phone).trim() !== '' && !phoneRegex.test(String(mother_phone).trim())) {
        return "Mother's Phone must be exactly 10 digits";
    }
    if (student_phone && String(student_phone).trim() !== '' && !phoneRegex.test(String(student_phone).trim())) {
        return 'Student Phone must be exactly 10 digits';
    }
    if (driver_phone && String(driver_phone).trim() !== '' && !phoneRegex.test(String(driver_phone).trim())) {
        return 'Driver Phone must be exactly 10 digits';
    }
    if (login_phone && String(login_phone).trim() !== '' && !phoneRegex.test(String(login_phone).trim())) {
        return 'Login Phone must be exactly 10 digits';
    }
    if (whatsapp_number && String(whatsapp_number).trim() !== '' && !phoneRegex.test(String(whatsapp_number).trim())) {
        return 'WhatsApp Number must be exactly 10 digits';
    }
    if (alternate_phone && String(alternate_phone).trim() !== '' && !phoneRegex.test(String(alternate_phone).trim())) {
        return 'Alternate Phone must be exactly 10 digits';
    }
    if (emergency_contact_phone && String(emergency_contact_phone).trim() !== '' && !phoneRegex.test(String(emergency_contact_phone).trim())) {
        return 'Emergency Contact Phone must be exactly 10 digits';
    }

    // Emails: valid format if entered
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (guardian_email && String(guardian_email).trim() !== '' && !emailRegex.test(String(guardian_email).trim())) {
        return 'Please enter a valid Guardian Email address';
    }
    if (father_email && String(father_email).trim() !== '' && !emailRegex.test(String(father_email).trim())) {
        return "Please enter a valid Father's Email address";
    }
    if (mother_email && String(mother_email).trim() !== '' && !emailRegex.test(String(mother_email).trim())) {
        return "Please enter a valid Mother's Email address";
    }
    if (student_email && String(student_email).trim() !== '' && !emailRegex.test(String(student_email).trim())) {
        return 'Please enter a valid Student Email address';
    }
    if (login_email && String(login_email).trim() !== '' && !emailRegex.test(String(login_email).trim())) {
        return 'Please enter a valid Login Email address';
    }

    // APAAR ID: exactly 12 numeric digits if entered
    if (apaar_id && String(apaar_id).trim() !== '') {
        const cleanApaar = String(apaar_id).trim();
        if (!/^\d{12}$/.test(cleanApaar)) {
            return 'APAAR ID must be exactly 12 digits.';
        }
    }

    // Aadhaar: exactly 12 numeric digits (or 4 for legacy) if entered
    if (aadhaar_last4 && String(aadhaar_last4).trim() !== '') {
        const cleanAadhaar = String(aadhaar_last4).trim();
        if (!/^\d{12}$/.test(cleanAadhaar) && !/^\d{4}$/.test(cleanAadhaar)) {
            return 'Aadhaar Number must be exactly 12 numeric digits';
        }
    }

    // Pincode: exactly 6 numeric digits if entered
    if (pincode && String(pincode).trim() !== '') {
        const cleanPin = String(pincode).trim();
        if (!/^\d{6}$/.test(cleanPin)) {
            return 'Pincode must be exactly 6 numeric digits';
        }
    }

    return null;
};

const createStudent = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const {
            // Required fields
            admission_number, student_name, date_of_birth, gender, admission_date,
            academic_year, class: className, class_id, section: sectionName, roll_no, student_status,
            guardian_name, guardian_relation, guardian_phone, address_line, city, state, pincode,

            // Recommended fields
            blood_group, admission_type, medium_of_instruction, second_language, nationality,
            father_name, mother_name, whatsapp_number, alternate_phone, emergency_contact_name,
            emergency_contact_phone, district, transport_required, fee_category, student_type,

            // Optional fields
            registration_no, apaar_id, pen_number, emis_id, aadhaar_last4, aadhaar_number, stream_group, group,
            house, religion, community_category, caste, mother_tongue, is_cwsn, disability_type,
            economic_category, guardian_email, previous_school_name, previous_class_completed, previous_class,
            previous_academic_details, previous_school_address, previous_school_board, previous_admission_number,
            previous_school_leaving_date, previous_academic_year, previous_tc_number, transfer_certificate_number,
            transfer_certificate_file, route_name, stop_name, transport_route, pickup_point, drop_point,
            vehicle_number, driver_name, driver_phone, driver_id, transport_fee, transport_fee_type,
            transport_fee_payment_status, transport_fee_status, transport_fee_payment_details,
            sibling_admission_no, allergies, medical_notes, photo,

            // Parent & Contact Details
            father_phone, father_occupation, father_email, mother_phone, mother_occupation, mother_email,
            guardian_occupation, student_email, student_phone,

            // Legacy & Login credentials
            first_name, last_name, age, dob, address, guardian_address, parent_name, parent_phone, parent_email,
            login_email, login_phone, login_password
        } = req.body;

        const final_student_name = student_name || (first_name && last_name ? `${first_name} ${last_name}` : first_name);
        const final_parent_name = guardian_name || parent_name;
        const final_parent_phone = guardian_phone || parent_phone;
        const final_parent_email = guardian_email || parent_email;

        const final_login_email = login_email || final_parent_email;
        const final_login_phone = login_phone || final_parent_phone;
        const final_password = login_password || (final_parent_name ? `${final_parent_name.replace(/\s+/g, '')}@123` : '123456');

        if (!final_student_name) {
            return res.status(400).json({ message: 'Student name is required' });
        }
        if (!final_parent_phone) {
            return res.status(400).json({ message: 'Guardian phone is required' });
        }

        const validationErr = validateStudentData({
            ...req.body,
            student_name: final_student_name,
            guardian_phone: final_parent_phone,
            guardian_email: final_parent_email,
            login_email: final_login_email,
            login_phone: final_login_phone
        });
        if (validationErr) {
            return res.status(400).json({ message: validationErr });
        }

        // Resolve Class & Section first so resolvedClass and resolvedSection are available for roll_no generation
        let resolvedClassId = class_id;
        let resolvedClass = className;
        let resolvedSection = sectionName;

        if (resolvedClassId) {
            const cls = await Class.findOne({ _id: resolvedClassId, school_id });
            if (cls) {
                resolvedClass = cls.class;
                resolvedSection = cls.section;
            }
        } else if (resolvedClass && resolvedSection) {
            let cls = await Class.findOne({ school_id, class: resolvedClass, section: resolvedSection });
            if (!cls) {
                cls = await Class.create({ school_id, class: resolvedClass, section: resolvedSection });
            }
            resolvedClassId = cls._id;
        }

        if (!resolvedClassId) {
            return res.status(400).json({ message: 'Class and section are required' });
        }

        // Validate or auto-generate admission_number
        let final_admission_number = admission_number ? String(admission_number).trim() : '';
        if (!final_admission_number) {
            const [genAdm] = await generateAdmissionNumbers(school_id, academic_year, 1);
            final_admission_number = genAdm;
        } else {
            const existingStudent = await Student.findOne({
                school_id,
                admission_number: final_admission_number
            });
            if (existingStudent) {
                return res.status(400).json({
                    message: `Student with admission number "${final_admission_number}" already exists`
                });
            }
        }

        // Validate or auto-generate roll_no
        let final_roll_no = roll_no !== undefined && roll_no !== null && String(roll_no).trim() !== '' ? String(roll_no).trim() : '';
        if (!final_roll_no) {
            const [genRoll] = await generateRollNumbers(school_id, academic_year, resolvedClass, resolvedSection, 1);
            final_roll_no = genRoll;
        } else {
            const existingRoll = await Student.findOne({
                school_id,
                academic_year: academic_year || '2025-2026',
                class: resolvedClass,
                section: resolvedSection,
                roll_no: final_roll_no
            });
            if (existingRoll) {
                return res.status(400).json({
                    message: `Student with Roll Number "${final_roll_no}" already exists in Class ${resolvedClass} Section ${resolvedSection}`
                });
            }
        }

        let parentUser = await User.findOne({ phone: final_login_phone });
        let parentPassword = null;

        if (!parentUser) {
            parentPassword = final_password;
            parentUser = await User.create({
                phone: final_login_phone,
                email: final_login_email,
                password: parentPassword,
                role: 'Parent'
            });
        }

        // Date of birth parsing
        const final_dob = date_of_birth ? new Date(date_of_birth) : (dob ? new Date(dob) : new Date());
        const final_admission_date = admission_date ? new Date(admission_date) : new Date();

        // Aadhaar sanitization (last 4 digits only)
        let clean_aadhaar = aadhaar_last4 ? String(aadhaar_last4).replace(/\D/g, '') : undefined;
        if (clean_aadhaar && clean_aadhaar.length > 4) {
            clean_aadhaar = clean_aadhaar.slice(-4);
        }

        // Address resolution
        const final_address_line = address_line || address || guardian_address || '';
        const final_address = address || [final_address_line, city, state, pincode].filter(Boolean).join(', ');

        const student = await Student.create({
            // 1. Basic Info
            student_name: final_student_name,
            first_name,
            last_name,
            date_of_birth: final_dob,
            dob: final_dob,
            gender: gender || 'Male',
            blood_group: blood_group || 'N/A',
            nationality: nationality || 'Indian',
            mother_tongue,
            student_status: student_status || 'Active',
            age: age || 0,
            student_email,
            student_phone,

            // 2. Admission & Academic Info
            admission_number: final_admission_number,
            admission_date: final_admission_date,
            academic_year: academic_year || '2025-2026',
            class: resolvedClass,
            section: resolvedSection,
            roll_no: final_roll_no,
            previous_class: previous_class || previous_class_completed,
            previous_academic_details,
            admission_type: admission_type || 'Regular',
            stream_group: stream_group || group || 'Science',
            group: stream_group || group || 'Science',
            medium_of_instruction: medium_of_instruction || 'English',
            second_language,
            registration_no,
            house,
            student_type: student_type || 'Day Scholar',

            // 3. Parent & Guardian Info
            father_name,
            father_phone,
            father_occupation,
            father_email,
            mother_name,
            mother_phone,
            mother_occupation,
            mother_email,
            guardian_name: final_parent_name,
            parent_name: final_parent_name,
            guardian_relation: guardian_relation || 'Father',
            guardian_phone: final_parent_phone,
            parent_phone: final_parent_phone,
            guardian_occupation,
            guardian_email: final_parent_email,
            parent_email: final_parent_email,
            whatsapp_number,
            alternate_phone,

            // 4. Contact & Address Info
            address_line: final_address_line,
            city,
            district,
            state,
            pincode,
            address: final_address,
            guardian_address: guardian_address || final_address,

            // 5. Additional Info
            apaar_id,
            pen_number,
            emis_id,
            aadhaar_number,
            aadhaar_last4: clean_aadhaar,
            religion: religion || 'General',
            community_category,
            caste,
            economic_category,
            is_cwsn: is_cwsn === true || is_cwsn === 'true',
            disability_type,
            sibling_admission_no,

            // 6. Previous School Info
            previous_school_name,
            previous_school_address,
            previous_school_board,
            previous_class_completed: previous_class_completed || previous_class,
            previous_admission_number,
            previous_school_leaving_date: previous_school_leaving_date ? new Date(previous_school_leaving_date) : undefined,
            previous_academic_year,
            previous_tc_number: previous_tc_number || transfer_certificate_number,
            transfer_certificate_number: transfer_certificate_number || previous_tc_number,
            transfer_certificate_file,

            // 7. Transport & Fee Info
            transport_required: transport_required === true || transport_required === 'true',
            route_name: route_name || transport_route,
            transport_route: transport_route || route_name,
            stop_name: stop_name || pickup_point,
            pickup_point: pickup_point || stop_name,
            drop_point,
            vehicle_number,
            driver_name,
            driver_phone,
            driver_id,
            transport_fee: transport_fee ? Number(transport_fee) : 0,
            transport_fee_type: transport_fee_type || 'Monthly',
            transport_fee_payment_status: transport_fee_payment_status || transport_fee_status || 'Pending',
            transport_fee_status: transport_fee_status || transport_fee_payment_status || 'Pending',
            transport_fee_payment_details,
            fee_category,

            // 8. Medical & Emergency Info
            emergency_contact_name,
            emergency_contact_phone,
            allergies,
            medical_notes,

            // 9. Photo & Relations
            photo,
            class_id: resolvedClassId,
            school_id,
            parent_user_id: parentUser._id
        });

        res.status(201).json({
            student,
            parentPassword: parentPassword || 'Existing Account',
            message: 'Student and Parent account created'
        });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateStudent = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const student = await Student.findOne({ _id: req.params.id, school_id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const validationErr = validateStudentData(req.body);
        if (validationErr) {
            return res.status(400).json({ message: validationErr });
        }

        // Validate admission number uniqueness if changed
        if (req.body.admission_number && req.body.admission_number.trim() && req.body.admission_number.trim() !== student.admission_number) {
            const existingStudent = await Student.findOne({
                school_id,
                admission_number: req.body.admission_number.trim(),
                _id: { $ne: req.params.id }
            });
            if (existingStudent) {
                return res.status(400).json({
                    message: `Student with admission number "${req.body.admission_number.trim()}" already exists`
                });
            }
        }

        const updateData = {};
        const allowedFields = [
            'student_name', 'first_name', 'last_name', 'father_name', 'mother_name',
            'gender', 'roll_no', 'registration_no', 'blood_group', 'religion',
            'admission_number', 'guardian_relation', 'guardian_address',
            'student_status', 'academic_year', 'admission_type', 'medium_of_instruction',
            'second_language', 'nationality', 'whatsapp_number', 'alternate_phone',
            'emergency_contact_name', 'emergency_contact_phone', 'address_line', 'city',
            'district', 'state', 'pincode', 'fee_category', 'student_type',
            'apaar_id', 'pen_number', 'emis_id', 'house', 'community_category', 'caste',
            'mother_tongue', 'disability_type', 'economic_category', 'previous_school_name',
            'previous_class_completed', 'previous_class', 'previous_academic_details',
            'previous_school_address', 'previous_school_board', 'previous_admission_number',
            'previous_school_leaving_date', 'previous_academic_year',
            'previous_tc_number', 'transfer_certificate_number', 'transfer_certificate_file',
            'route_name', 'stop_name', 'transport_route', 'pickup_point', 'drop_point',
            'vehicle_number', 'driver_name', 'driver_phone', 'driver_id', 'transport_fee',
            'transport_fee_type', 'transport_fee_payment_status', 'transport_fee_status',
            'transport_fee_payment_details',
            'father_phone', 'father_occupation', 'father_email', 'mother_phone', 'mother_occupation',
            'mother_email', 'guardian_occupation', 'student_email', 'student_phone', 'aadhaar_number',
            'sibling_admission_no', 'allergies', 'medical_notes', 'photo', 'address'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
            }
        });

        // Computed student name
        if (req.body.student_name !== undefined) {
            updateData.student_name = req.body.student_name;
        } else if (req.body.first_name !== undefined || req.body.last_name !== undefined) {
            const fn = req.body.first_name !== undefined ? req.body.first_name : student.first_name;
            const ln = req.body.last_name !== undefined ? req.body.last_name : student.last_name;
            updateData.student_name = ln ? `${fn} ${ln}` : fn;
        }

        // Sync mapped fields
        if (req.body.guardian_name !== undefined || req.body.parent_name !== undefined) {
            const pName = req.body.guardian_name !== undefined ? req.body.guardian_name : req.body.parent_name;
            updateData.guardian_name = pName;
            updateData.parent_name = pName;
        }

        if (req.body.guardian_phone !== undefined || req.body.parent_phone !== undefined) {
            const pPhone = req.body.guardian_phone !== undefined ? req.body.guardian_phone : req.body.parent_phone;
            updateData.guardian_phone = pPhone;
            updateData.parent_phone = pPhone;
        }

        if (req.body.guardian_email !== undefined || req.body.parent_email !== undefined) {
            const pEmail = req.body.guardian_email !== undefined ? req.body.guardian_email : req.body.parent_email;
            updateData.guardian_email = pEmail ? pEmail.toLowerCase().trim() : '';
            updateData.parent_email = pEmail ? pEmail.toLowerCase().trim() : '';
        }

        if (req.body.stream_group !== undefined || req.body.group !== undefined) {
            const sGroup = req.body.stream_group !== undefined ? req.body.stream_group : req.body.group;
            updateData.stream_group = sGroup;
            updateData.group = sGroup;
        }

        if (req.body.date_of_birth !== undefined || req.body.dob !== undefined) {
            const d = req.body.date_of_birth !== undefined ? req.body.date_of_birth : req.body.dob;
            const parsedDate = d ? new Date(d) : null;
            updateData.date_of_birth = parsedDate;
            updateData.dob = parsedDate;
        }

        if (req.body.admission_date !== undefined) {
            updateData.admission_date = req.body.admission_date ? new Date(req.body.admission_date) : student.admission_date;
        }

        if (req.body.previous_school_leaving_date !== undefined) {
            updateData.previous_school_leaving_date = req.body.previous_school_leaving_date ? new Date(req.body.previous_school_leaving_date) : undefined;
        }

        if (req.body.transport_fee !== undefined) {
            updateData.transport_fee = req.body.transport_fee !== '' ? Number(req.body.transport_fee) : 0;
        }

        if (req.body.transport_required !== undefined) {
            updateData.transport_required = req.body.transport_required === true || req.body.transport_required === 'true';
        }

        if (req.body.is_cwsn !== undefined) {
            updateData.is_cwsn = req.body.is_cwsn === true || req.body.is_cwsn === 'true';
        }

        // Sync legacy transport / previous school / aadhaar aliases
        if (req.body.previous_class !== undefined && !req.body.previous_class_completed) {
            updateData.previous_class_completed = req.body.previous_class;
        }
        if (req.body.previous_class_completed !== undefined && !req.body.previous_class) {
            updateData.previous_class = req.body.previous_class_completed;
        }
        if (req.body.transfer_certificate_number !== undefined && !req.body.previous_tc_number) {
            updateData.previous_tc_number = req.body.transfer_certificate_number;
        }
        if (req.body.previous_tc_number !== undefined && !req.body.transfer_certificate_number) {
            updateData.transfer_certificate_number = req.body.previous_tc_number;
        }
        if (req.body.transport_route !== undefined && !req.body.route_name) {
            updateData.route_name = req.body.transport_route;
        }
        if (req.body.route_name !== undefined && !req.body.transport_route) {
            updateData.transport_route = req.body.route_name;
        }
        if (req.body.pickup_point !== undefined && !req.body.stop_name) {
            updateData.stop_name = req.body.pickup_point;
        }
        if (req.body.stop_name !== undefined && !req.body.pickup_point) {
            updateData.pickup_point = req.body.stop_name;
        }
        if (req.body.transport_fee_payment_status !== undefined && !req.body.transport_fee_status) {
            updateData.transport_fee_status = req.body.transport_fee_payment_status;
        }
        if (req.body.transport_fee_status !== undefined && !req.body.transport_fee_payment_status) {
            updateData.transport_fee_payment_status = req.body.transport_fee_status;
        }

        if (req.body.aadhaar_number !== undefined) {
            const cleanFull = String(req.body.aadhaar_number).replace(/\D/g, '');
            updateData.aadhaar_number = cleanFull;
            updateData.aadhaar_last4 = cleanFull.length > 4 ? cleanFull.slice(-4) : cleanFull;
        } else if (req.body.aadhaar_last4 !== undefined) {
            const cleanAadhaar = String(req.body.aadhaar_last4).replace(/\D/g, '');
            updateData.aadhaar_last4 = cleanAadhaar.length > 4 ? cleanAadhaar.slice(-4) : cleanAadhaar;
        }

        if (req.body.age !== undefined) {
            updateData.age = parseInt(req.body.age, 10) || 0;
        }

        // Handle class & section
        if (req.body.class_id && req.body.class_id !== student.class_id?.toString()) {
            const cls = await Class.findOne({ _id: req.body.class_id, school_id });
            if (cls) {
                updateData.class_id = cls._id;
                updateData.class = cls.class;
                updateData.section = cls.section;
            }
        } else if (req.body.class || req.body.section) {
            if (req.body.class) updateData.class = req.body.class;
            if (req.body.section) updateData.section = req.body.section;
        }

        // Update Parent User account if login credentials changed
        const parentUser = await User.findById(student.parent_user_id);
        if (parentUser) {
            let parentChanged = false;
            if (req.body.password) {
                parentUser.password = req.body.password;
                parentChanged = true;
            }
            if (updateData.parent_email && updateData.parent_email !== parentUser.email) {
                parentUser.email = updateData.parent_email;
                parentChanged = true;
            }
            if (updateData.parent_phone && updateData.parent_phone !== parentUser.phone) {
                parentUser.phone = updateData.parent_phone;
                parentChanged = true;
            }
            if (parentChanged) {
                await parentUser.save();
            }
        }

        const updatedStudent = await Student.findOneAndUpdate(
            { _id: req.params.id, school_id },
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('class_id', 'class section').populate('parent_user_id', 'email phone');

        res.json({ student: updatedStudent, message: 'Student updated successfully' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const student = await Student.findOne({ _id: req.params.id, school_id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        await Student.findByIdAndDelete(student._id);

        // Check if parent has other students
        const otherStudents = await Student.find({ parent_user_id: student.parent_user_id });
        if (otherStudents.length === 0) {
            await User.findByIdAndDelete(student.parent_user_id);
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const bulkImportStudents = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'No student data provided for import' });
        }

        // Automatically generate missing admission numbers and roll numbers before importing
        await assignNumbersForStudents(school_id, students);

        const createdStudents = [];
        const errors = [];
        const seenAdmissionsInBatch = new Set();
        const seenRollsInBatch = new Set();

        for (let i = 0; i < students.length; i++) {
            const item = students[i];
            try {
                const final_student_name = item.student_name || item.name || (item.last_name ? `${item.first_name} ${item.last_name}` : item.first_name);
                if (!final_student_name) {
                    errors.push({ row: i + 1, message: 'Student name is required' });
                    continue;
                }

                const className = item.class || item.className || 'Default';
                const sectionName = item.section || 'A';

                // Find or create class
                let cls = await Class.findOne({ school_id, class: className, section: sectionName });
                if (!cls) {
                    cls = await Class.create({ school_id, class: className, section: sectionName });
                }

                const parent_name = item.guardian_name || item.parent_name || `Parent of ${final_student_name}`;
                const parent_phone = item.guardian_phone || item.parent_phone || item.phone || `9876${Math.floor(100000 + Math.random() * 900000)}`;
                const parent_email = (item.guardian_email || item.parent_email || '').trim() || undefined;

                let parentUser = await User.findOne({ phone: parent_phone });
                let parentPassword = null;

                if (!parentUser) {
                    parentPassword = item.password || '123456';
                    parentUser = await User.create({
                        phone: parent_phone,
                        email: parent_email,
                        password: parentPassword,
                        role: 'Parent'
                    });
                }

                const admNum = (item.admission_number || item.admission_no || '').trim();
                if (admNum) {
                    if (seenAdmissionsInBatch.has(admNum)) {
                        errors.push({ row: i + 1, message: `Duplicate admission number "${admNum}" within import batch` });
                        continue;
                    }
                    const existing = await Student.findOne({ school_id, admission_number: admNum });
                    if (existing) {
                        errors.push({ row: i + 1, message: `Admission number "${admNum}" already exists` });
                        continue;
                    }
                    seenAdmissionsInBatch.add(admNum);
                }

                const rollNum = String(item.roll_no || '').trim();
                if (rollNum) {
                    const rollBatchKey = `${item.academic_year || '2025-2026'}|${className}|${sectionName}|${rollNum}`;
                    if (seenRollsInBatch.has(rollBatchKey)) {
                        errors.push({ row: i + 1, message: `Duplicate roll number "${rollNum}" in Class ${className} Section ${sectionName} within import batch` });
                        continue;
                    }
                    const existingRoll = await Student.findOne({
                        school_id,
                        academic_year: item.academic_year || '2025-2026',
                        class: className,
                        section: sectionName,
                        roll_no: rollNum
                    });
                    if (existingRoll) {
                        errors.push({ row: i + 1, message: `Roll number "${rollNum}" already exists in Class ${className} Section ${sectionName}` });
                        continue;
                    }
                    seenRollsInBatch.add(rollBatchKey);
                }

                const student = await Student.create({
                    student_name: final_student_name,
                    first_name: item.first_name || final_student_name,
                    last_name: item.last_name || '',
                    father_name: item.father_name || '',
                    mother_name: item.mother_name || '',
                    group: item.group || item.stream_group || 'Science',
                    stream_group: item.stream_group || item.group || 'Science',
                    section: sectionName,
                    class: className,
                    gender: item.gender || 'Male',
                    roll_no: item.roll_no || `${i + 1}`,
                    registration_no: item.registration_no || '',
                    religion: item.religion || 'General',
                    admission_number: admNum || undefined,
                    admission_date: item.admission_date ? new Date(item.admission_date) : new Date(),
                    academic_year: item.academic_year || '2025-2026',
                    student_status: item.student_status || 'Active',
                    admission_type: item.admission_type || 'Regular',
                    medium_of_instruction: item.medium_of_instruction || 'English',
                    second_language: item.second_language || '',
                    nationality: item.nationality || 'Indian',
                    address_line: item.address_line || item.address || '',
                    city: item.city || '',
                    state: item.state || '',
                    pincode: item.pincode || '',
                    district: item.district || '',
                    address: item.address || item.address_line || '',
                    guardian_relation: item.guardian_relation || 'Father',
                    blood_group: item.blood_group || 'N/A',
                    age: item.age || 0,
                    dob: item.dob ? new Date(item.dob) : (item.date_of_birth ? new Date(item.date_of_birth) : new Date()),
                    date_of_birth: item.date_of_birth ? new Date(item.date_of_birth) : (item.dob ? new Date(item.dob) : new Date()),
                    parent_name,
                    guardian_name: parent_name,
                    parent_phone,
                    guardian_phone: parent_phone,
                    parent_email,
                    guardian_email: parent_email,
                    whatsapp_number: item.whatsapp_number || '',
                    alternate_phone: item.alternate_phone || '',
                    emergency_contact_name: item.emergency_contact_name || '',
                    emergency_contact_phone: item.emergency_contact_phone || '',
                    transport_required: item.transport_required === true || item.transport_required === 'true',
                    fee_category: item.fee_category || '',
                    student_type: item.student_type || 'Day Scholar',
                    apaar_id: item.apaar_id || '',
                    pen_number: item.pen_number || '',
                    emis_id: item.emis_id || '',
                    aadhaar_last4: item.aadhaar_last4 ? String(item.aadhaar_last4).slice(-4) : '',
                    house: item.house || '',
                    community_category: item.community_category || '',
                    caste: item.caste || '',
                    mother_tongue: item.mother_tongue || '',
                    is_cwsn: item.is_cwsn === true || item.is_cwsn === 'true',
                    disability_type: item.disability_type || '',
                    economic_category: item.economic_category || '',
                    previous_school_name: item.previous_school_name || '',
                    previous_class_completed: item.previous_class_completed || '',
                    previous_tc_number: item.previous_tc_number || '',
                    route_name: item.route_name || '',
                    stop_name: item.stop_name || '',
                    sibling_admission_no: item.sibling_admission_no || '',
                    allergies: item.allergies || '',
                    medical_notes: item.medical_notes || '',
                    class_id: cls._id,
                    school_id,
                    parent_user_id: parentUser._id
                });
                createdStudents.push({
                    student,
                    parentPassword: parentPassword || 'Existing Account'
                });
            } catch (rowErr) {
                errors.push({ row: i + 1, message: rowErr.message });
            }
        }
        res.status(201).json({
            success: true,
            count: createdStudents.length,
            createdStudents,
            errors,
            message: `Successfully imported ${createdStudents.length} students`
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
const bulkImportTeachers = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { teachers } = req.body;

        if (!Array.isArray(teachers) || teachers.length === 0) {
            return res.status(400).json({ message: 'No teacher data provided for import' });
        }

        const createdTeachers = [];
        const errors = [];

        for (let i = 0; i < teachers.length; i++) {
            const item = teachers[i];
            try {
                const teacher_name = item.teacher_name || item.name || (item.last_name ? `${item.first_name} ${item.last_name}` : item.first_name);
                if (!teacher_name) {
                    errors.push({ row: i + 1, message: 'Teacher name is required' });
                    continue;
                }

                const email = item.email ? item.email.trim().toLowerCase() : `teacher${Date.now()}_${i}@school.com`;
                const phone = item.mobile || item.mobile_number || item.phone || `9876${Math.floor(100000 + Math.random() * 900000)}`;

                let user = await User.findOne({ $or: [{ email }, { phone }] });
                let initialPassword = null;
                if (!user) {
                    initialPassword = item.password || '123456';
                    user = await User.create({
                        name: teacher_name,
                        email,
                        phone,
                        password: initialPassword,
                        role: 'Teacher'
                    });
                }

                let teacher = await Teacher.findOne({ school_id, email });
                if (!teacher) {
                    teacher = await Teacher.create({
                        school_id,
                        user_id: user._id,
                        name: teacher_name,
                        email,
                        phone,
                        address: item.address || 'N/A',
                        qualification: item.qualification || 'B.Ed / Degree',
                        experience: item.experience ? Number(item.experience) : 1,
                        domains: item.subjects ? (Array.isArray(item.subjects) ? item.subjects : item.subjects.split(',')) : ['General'],
                        password: initialPassword || '123456'
                    });
                }
                createdTeachers.push({
                    teacher,
                    initialPassword: initialPassword || 'Existing Account'
                });
            } catch (rowErr) {
                errors.push({ row: i + 1, message: rowErr.message });
            }
        }

        res.status(201).json({
            success: true,
            count: createdTeachers.length,
            createdTeachers,
            errors,
            message: `Successfully imported ${createdTeachers.length} teachers`
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const bulkImportStaff = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { staff } = req.body;

        if (!Array.isArray(staff) || staff.length === 0) {
            return res.status(400).json({ message: 'No staff data provided for import' });
        }

        const createdStaff = [];
        const errors = [];

        for (let i = 0; i < staff.length; i++) {
            const item = staff[i];
            try {
                const staff_name = item.staff_name || item.name || (item.last_name ? `${item.first_name} ${item.last_name}` : item.first_name);
                if (!staff_name) {
                    errors.push({ row: i + 1, message: 'Staff name is required' });
                    continue;
                }

                const email = item.email ? item.email.trim().toLowerCase() : `staff${Date.now()}_${i}@school.com`;
                const phone = item.mobile || item.mobile_number || item.phone || `9876${Math.floor(100000 + Math.random() * 900000)}`;
                const staffRole = item.role || item.role_title || item.designation || 'Office Staff';
                const parsedExperience = parseInt(item.experience, 10) || 0;

                let user = await User.findOne({ $or: [{ email }, { phone }] });
                let initialPassword = null;
                if (!user) {
                    initialPassword = item.password || 'Staff@123';
                    user = await User.create({
                        name: staff_name,
                        email,
                        phone,
                        password: initialPassword,
                        role: 'Staff'
                    });
                }

                let staffMember = await Staff.findOne({ school_id, email });
                if (!staffMember) {
                    staffMember = await Staff.create({
                        school_id,
                        user_id: user._id,
                        name: staff_name,
                        email,
                        phone,
                        role: staffRole,
                        address: item.address || 'N/A',
                        qualification: item.qualification || 'N/A',
                        experience: parsedExperience,
                        photo: item.photo || '',
                        password: initialPassword || 'Staff@123'
                    });
                    user.reference_id = staffMember._id;
                    await user.save();
                }

                if (staffRole.trim().toLowerCase() === 'driver') {
                    const driverExists = await Driver.findOne({ mobile_number: phone, school_id });
                    if (!driverExists) {
                        await Driver.create({
                            school_id,
                            driver_id: `DRV-${Date.now()}_${i}`,
                            name: staff_name,
                            mobile_number: phone,
                            email,
                            address: item.address || '',
                            license_number: `DL-${phone || Date.now()}`,
                            password: initialPassword || 'Staff@123',
                            status: 'Active'
                        });
                    }
                }

                createdStaff.push({
                    staff: staffMember,
                    initialPassword: initialPassword || 'Existing Account'
                });
            } catch (rowErr) {
                errors.push({ row: i + 1, message: rowErr.message });
            }
        }

        res.status(201).json({
            success: true,
            count: createdStaff.length,
            createdStaff,
            errors,
            message: `Successfully imported ${createdStaff.length} staff members`
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    School Admin Dedicated Login (Email/Phone + Password)
// @route   POST /api/schooladmin/auth/login
// @access  Public
const loginSchoolAdmin = async (req, res) => {
    try {
        const { email, phone, mobile, mobile_number, phone_number, email_or_phone, username, identifier, password } = req.body;
        const contactInput = (email || phone || mobile || mobile_number || phone_number || email_or_phone || username || identifier || '').toString().trim();

        if (!contactInput || !password) {
            return res.status(400).json({ message: 'Please provide email or phone and password' });
        }

        const user = await User.findOne({
            $or: [
                { email: contactInput.toLowerCase() },
                { phone: contactInput }
            ],
            role: 'SchoolAdmin'
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or non-admin account' });
        }

        if (user.status && user.status !== 'Active') {
            return res.status(403).json({ message: 'School Admin account is inactive. Please contact system administrator.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        let schoolId = null;
        try {
            schoolId = await getSchoolId(user._id);
        } catch (e) {
            schoolId = null;
        }

        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: user._id, role: 'SchoolAdmin', school_id: schoolId },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '30d' }
        );

        const refreshToken = jwt.sign(
            { id: user._id, role: 'SchoolAdmin', school_id: schoolId, type: 'refresh' },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '90d' }
        );

        user.last_login_at = new Date();
        user.refresh_tokens = user.refresh_tokens || [];
        user.refresh_tokens.push(refreshToken);
        if (user.refresh_tokens.length > 5) user.refresh_tokens.shift();
        await user.save();

        res.json({
            success: true,
            message: 'School Admin login successful',
            token,
            accessToken: token,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name || 'School Admin',
                email: user.email,
                phone: user.phone,
                role: 'SchoolAdmin',
                status: user.status,
                school_id: schoolId,
                reference_id: user.reference_id,
                last_login_at: user.last_login_at
            }
        });
    } catch (error) {
        console.error('loginSchoolAdmin error:', error);
        res.status(500).json({ message: 'School Admin login failed', error: error.message });
    }
};
// @desc    Get Authenticated School Admin Profile
// @route   GET /api/schooladmin/profile
// @access  Private (SchoolAdmin)
// ADDED FEATURE: School Admin get profile endpoint
// ADDED RESPONSE FIELD: user, profile, school, timestamp, requestId
// ADDED AUTHORIZATION: SchoolAdmin role authorization
const getSchoolAdminProfile = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'School Admin user not found' });
        }

        let school = null;
        let schoolId = null;
        try {
            schoolId = await getSchoolId(user._id);
            if (schoolId) {
                school = await School.findById(schoolId).select('name code location email phone address logo status');
            }
        } catch (e) {
            school = null;
        }
        const profileData = {
            _id: user._id,
            name: user.name || 'School Admin',
            email: user.email,
            phone: user.phone,
            role: 'SchoolAdmin',
            status: user.status,
            school_id: schoolId,
            school: school,
            last_login_at: user.last_login_at,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        if (res.success) {
            return res.success({ profile: profileData, user: profileData, school }, 'School Admin profile retrieved successfully');
        }
        return res.json({
            success: true,
            message: 'School Admin profile retrieved successfully',
            user: profileData,
            profile: profileData,
            school
        });
    } catch (error) {
        console.error('getSchoolAdminProfile error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch School Admin profile', error: error.message });
    }
};

// --- LEAVE MANAGEMENT ---
const getSchoolLeaves = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        // Extract query parameters (supporting both camelCase and snake_case)
        const employeeIdParam = req.query.employeeId || req.query.employee_id;
        const employeeTypeParam = req.query.employeeType || req.query.employee_type;
        const leaveTypeParam = req.query.leaveType || req.query.leave_type;
        const statusParam = req.query.status;
        const fromDateParam = req.query.fromDate || req.query.from_date || req.query.startDate || req.query.start_date;
        const toDateParam = req.query.toDate || req.query.to_date || req.query.endDate || req.query.end_date;
        const academicYearParam = req.query.academicYear || req.query.academic_year;
        const searchParam = req.query.search;
        const pageParam = req.query.page;
        const limitParam = req.query.limit;

        // Validation for pagination
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

        let limit = 0; // 0 means return all records if not specified
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

        // Fetch teachers and staff belonging to this school
        const [teachers, staffMembers] = await Promise.all([
            Teacher.find({ school_id }).select('_id name email phone domains qualification experience'),
            Staff.find({ school_id }).select('_id name email phone role address qualification experience')
        ]);

        const teacherIds = teachers.map(t => t._id);
        const staffIds = staffMembers.map(s => s._id);

        const teacherMap = new Map(teachers.map(t => [String(t._id), t]));
        const staffMap = new Map(staffMembers.map(s => [String(s._id), s]));

        // Build base TeacherLeave query
        const teacherLeaveQuery = {
            $or: [
                { school_id },
                { teacher_id: { $in: teacherIds } }
            ]
        };

        // Build base StaffLeave query
        const staffLeaveQuery = {
            $or: [
                { school_id },
                { staff_id: { $in: staffIds } }
            ]
        };

        // Status Filter
        if (statusParam && statusParam !== 'all') {
            teacherLeaveQuery.status = statusParam;
            staffLeaveQuery.status = statusParam;
        }

        // Leave Type Filter
        if (leaveTypeParam && leaveTypeParam !== 'all') {
            const regex = new RegExp(`^${leaveTypeParam.trim()}$`, 'i');
            teacherLeaveQuery.leave_type = regex;
            staffLeaveQuery.leave_type = regex;
        }

        // Academic Year Filter
        if (academicYearParam) {
            teacherLeaveQuery.academic_year = academicYearParam;
            staffLeaveQuery.academic_year = academicYearParam;
        }

        // Date Range Filters
        if (fromDateParam || toDateParam) {
            if (fromDateParam) {
                const parsedFrom = new Date(fromDateParam);
                if (!isNaN(parsedFrom.getTime())) {
                    parsedFrom.setHours(0, 0, 0, 0);
                    teacherLeaveQuery.end_date = { ...(teacherLeaveQuery.end_date || {}), $gte: parsedFrom };
                    staffLeaveQuery.end_date = { ...(staffLeaveQuery.end_date || {}), $gte: parsedFrom };
                }
            }
            if (toDateParam) {
                const parsedTo = new Date(toDateParam);
                if (!isNaN(parsedTo.getTime())) {
                    parsedTo.setHours(23, 59, 59, 999);
                    teacherLeaveQuery.start_date = { ...(teacherLeaveQuery.start_date || {}), $lte: parsedTo };
                    staffLeaveQuery.start_date = { ...(staffLeaveQuery.start_date || {}), $lte: parsedTo };
                }
            }
        }

        // Fetch records with populated references
        const [teacherLeaves, staffLeaves] = await Promise.all([
            TeacherLeave.find(teacherLeaveQuery)
                .populate('teacher_id', 'name email phone domains qualification')
                .populate('approved_by', 'name email role')
                .sort({ createdAt: -1 }),
            StaffLeave.find(staffLeaveQuery)
                .populate('staff_id', 'name email phone role qualification')
                .populate('approved_by', 'name email role')
                .sort({ createdAt: -1 })
        ]);

        const calculateDays = (start, end) => {
            if (!start || !end) return 1;
            const s = new Date(start);
            const e = new Date(end);
            if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
            const diffTime = Math.abs(e - s);
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return days > 0 ? days : 1;
        };

        const formatDateStr = (d) => {
            if (!d) return null;
            try {
                return new Date(d).toISOString().split('T')[0];
            } catch {
                return null;
            }
        };

        const formattedTeacherLeaves = teacherLeaves.map(l => {
            const t = l.teacher_id || teacherMap.get(String(l.teacher_id)) || {};
            const empCode = t._id ? `TCH-${String(t._id).slice(-4).toUpperCase()}` : '-';
            const totalDays = calculateDays(l.start_date, l.end_date);
            const department = (t.domains && t.domains.length > 0) ? t.domains.join(', ') : 'Academic';
            const approvedByObj = l.approved_by || null;
            const approvedByName = approvedByObj?.name || (approvedByObj ? String(approvedByObj) : null);

            return {
                _id: l._id,
                leaveId: l._id,
                leave_id: l._id,
                leave_source: 'Teacher',
                employeeId: empCode,
                employee_id: empCode,
                raw_employee_id: t._id || l.teacher_id,
                employeeName: t.name || 'Teacher',
                employee_name: t.name || 'Teacher',
                employeeRole: 'Teacher',
                employee_role: 'Teacher',
                role: 'Teacher',
                employeeType: 'Teacher',
                employee_type: 'Teacher',
                department,
                designation: 'Teacher',
                employeeEmail: t.email || '-',
                employee_email: t.email || '-',
                employeePhone: t.phone || '-',
                employee_phone: t.phone || '-',
                leaveType: l.leave_type,
                leave_type: l.leave_type,
                fromDate: formatDateStr(l.start_date),
                from_date: formatDateStr(l.start_date),
                toDate: formatDateStr(l.end_date),
                to_date: formatDateStr(l.end_date),
                startDate: l.start_date,
                start_date: l.start_date,
                endDate: l.end_date,
                end_date: l.end_date,
                totalDays,
                total_days: totalDays,
                reason: l.reason,
                leaveReason: l.reason,
                description: l.reason,
                appliedDate: l.createdAt,
                applied_date: l.createdAt,
                createdAt: l.createdAt,
                attachment: l.attachment || null,
                status: l.status || 'Pending',
                adminRemarks: l.admin_remarks || null,
                admin_remarks: l.admin_remarks || null,
                approvedBy: approvedByName,
                approved_by: approvedByName,
                approvedDate: l.approved_date || null,
                approved_date: l.approved_date || null,
                academicYear: l.academic_year || '2026-2027',
                academic_year: l.academic_year || '2026-2027'
            };
        });

        const formattedStaffLeaves = staffLeaves.map(l => {
            const s = l.staff_id || staffMap.get(String(l.staff_id)) || {};
            const role = s.role || 'Staff';
            const empCode = s._id ? `STF-${String(s._id).slice(-4).toUpperCase()}` : '-';
            const totalDays = calculateDays(l.start_date, l.end_date);
            const department = 'Administration';
            const approvedByObj = l.approved_by || null;
            const approvedByName = approvedByObj?.name || (approvedByObj ? String(approvedByObj) : null);

            return {
                _id: l._id,
                leaveId: l._id,
                leave_id: l._id,
                leave_source: 'Staff',
                employeeId: empCode,
                employee_id: empCode,
                raw_employee_id: s._id || l.staff_id,
                employeeName: s.name || 'Staff Member',
                employee_name: s.name || 'Staff Member',
                employeeRole: role,
                employee_role: role,
                role,
                employeeType: 'Staff',
                employee_type: role === 'Staff' ? 'Staff' : `Staff (${role})`,
                raw_role: role,
                department,
                designation: role,
                employeeEmail: s.email || '-',
                employee_email: s.email || '-',
                employeePhone: s.phone || '-',
                employee_phone: s.phone || '-',
                leaveType: l.leave_type,
                leave_type: l.leave_type,
                fromDate: formatDateStr(l.start_date),
                from_date: formatDateStr(l.start_date),
                toDate: formatDateStr(l.end_date),
                to_date: formatDateStr(l.end_date),
                startDate: l.start_date,
                start_date: l.start_date,
                endDate: l.end_date,
                end_date: l.end_date,
                totalDays,
                total_days: totalDays,
                reason: l.reason,
                leaveReason: l.reason,
                description: l.reason,
                appliedDate: l.createdAt,
                applied_date: l.createdAt,
                createdAt: l.createdAt,
                attachment: l.attachment || null,
                status: l.status || 'Pending',
                adminRemarks: l.admin_remarks || null,
                admin_remarks: l.admin_remarks || null,
                approvedBy: approvedByName,
                approved_by: approvedByName,
                approvedDate: l.approved_date || null,
                approved_date: l.approved_date || null,
                academicYear: l.academic_year || '2026-2027',
                academic_year: l.academic_year || '2026-2027'
            };
        });

        let combined = [...formattedTeacherLeaves, ...formattedStaffLeaves];

        // Filter by employeeType / employee_type ('Teacher', 'Staff', or 'all')
        if (employeeTypeParam && employeeTypeParam !== 'all') {
            const targetType = employeeTypeParam.toLowerCase();
            combined = combined.filter(l => l.leave_source.toLowerCase() === targetType || l.employee_type.toLowerCase().includes(targetType));
        }

        // Filter by employeeId / employee_id
        if (employeeIdParam) {
            const targetEmpId = String(employeeIdParam).trim().toLowerCase();
            combined = combined.filter(l =>
                String(l.employee_id).toLowerCase().includes(targetEmpId) ||
                String(l.raw_employee_id).toLowerCase() === targetEmpId
            );
        }

        // Filter by search query if provided
        if (searchParam && searchParam.trim()) {
            const q = searchParam.trim().toLowerCase();
            combined = combined.filter(l =>
                l.employee_name.toLowerCase().includes(q) ||
                l.employee_id.toLowerCase().includes(q) ||
                l.leave_type.toLowerCase().includes(q) ||
                l.reason.toLowerCase().includes(q) ||
                (l.department && l.department.toLowerCase().includes(q))
            );
        }

        // Sort latest first
        combined.sort((a, b) => new Date(b.applied_date) - new Date(a.applied_date));

        const totalRecords = combined.length;
        let paginatedLeaves = combined;
        let totalPages = 1;

        if (limit > 0) {
            totalPages = Math.ceil(totalRecords / limit) || 1;
            const startIndex = (page - 1) * limit;
            paginatedLeaves = combined.slice(startIndex, startIndex + limit);
        }

        const pagination = {
            currentPage: page,
            limit: limit > 0 ? limit : totalRecords,
            totalRecords,
            totalPages
        };

        return res.status(200).json({
            success: true,
            message: 'Leave records retrieved successfully',
            data: {
                leaves: paginatedLeaves,
                pagination
            },
            total: totalRecords,
            leaves: paginatedLeaves
        });
    } catch (error) {
        console.error('getSchoolLeaves error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching leaves',
            error: {
                code: 'LEAVES_FETCH_ERROR',
                details: error.message
            }
        });
    }
};

const updateLeaveStatus = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { id } = req.params;
        const { status, admin_remarks, leave_source } = req.body;

        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ message: 'Status must be Approved, Rejected, or Pending' });
        }

        // Try TeacherLeave first, then StaffLeave (or check leave_source)
        let updatedLeave = null;
        let sourceFound = null;

        if (leave_source === 'Teacher' || !leave_source) {
            updatedLeave = await TeacherLeave.findOne({ _id: id });
            if (updatedLeave) sourceFound = 'Teacher';
        }

        if (!updatedLeave && (leave_source === 'Staff' || !leave_source)) {
            updatedLeave = await StaffLeave.findOne({ _id: id });
            if (updatedLeave) sourceFound = 'Staff';
        }

        if (!updatedLeave) {
            return res.status(404).json({ message: 'Leave application not found' });
        }

        updatedLeave.status = status;
        if (admin_remarks !== undefined) {
            updatedLeave.admin_remarks = admin_remarks;
        }
        await updatedLeave.save();

        res.json({
            success: true,
            message: `Leave application ${status.toLowerCase()} successfully`,
            leave: updatedLeave,
            source: sourceFound
        });
    } catch (error) {
        console.error('updateLeaveStatus error:', error);
        res.status(500).json({ message: 'Server error updating leave status', error: error.message });
    }
};

const createEmployeeLeave = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { employee_id, employee_type, leave_type, from_date, to_date, start_date, end_date, reason, status } = req.body;

        const resolvedStartDate = start_date || from_date;
        const resolvedEndDate = end_date || to_date;

        if (!employee_id || !leave_type || !resolvedStartDate || !resolvedEndDate || !reason) {
            return res.status(400).json({ message: 'Employee ID, leave type, dates, and reason are required' });
        }

        let newLeave;
        if (employee_type === 'Staff') {
            newLeave = await StaffLeave.create({
                staff_id: employee_id,
                school_id,
                leave_type,
                start_date: resolvedStartDate,
                end_date: resolvedEndDate,
                reason: reason.trim(),
                status: status || 'Pending'
            });
        } else {
            newLeave = await TeacherLeave.create({
                teacher_id: employee_id,
                school_id,
                leave_type,
                start_date: resolvedStartDate,
                end_date: resolvedEndDate,
                reason: reason.trim(),
                status: status || 'Pending'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Leave application submitted successfully',
            leave: newLeave
        });
    } catch (error) {
        console.error('createEmployeeLeave error:', error);
        res.status(500).json({ message: 'Server error creating leave', error: error.message });
    }
};

module.exports = {
    loginSchoolAdmin,
    getSchoolAdminProfile,
    getDashboardStats,
    getTeachers, createTeacher, deleteTeacher, updateTeacher, bulkImportTeachers,
    getStaff, createStaff, deleteStaff, updateStaff, bulkImportStaff,
    getSubjects, createSubject, deleteSubject, updateSubject,
    getClasses, createClass, deleteClass, updateClass,
    getClassSubjects, assignSubjectTeacher, removeSubjectTeacher, updateSubjectTeacher,
    getStudents, getStudentById, createStudent, updateStudent, deleteStudent,
    bulkImportStudents,
    getNextStudentNumbers, generateNumbersBatch,
    getSchoolLeaves, updateLeaveStatus, createEmployeeLeave
};