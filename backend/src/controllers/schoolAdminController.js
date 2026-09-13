const Teacher = require('../models/Teacher');
const User = require('../models/User');
const School = require('../models/School');
const Staff = require('../models/Staff');
const Driver = require('../models/Driver');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Student = require('../models/Student');

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

        res.json({
            totalTeachers,
            totalStaff,
            totalClasses,
            totalSubjects,
            totalStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all teachers for the school
// @route   GET /api/schooladmin/teachers
// @access  Private (SchoolAdmin only)
const getTeachers = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const teachers = await Teacher.find({ school_id });
        res.json(teachers);
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
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Use custom password or fallback
        const rawPassword = password || `${name.replace(/\s+/g, '')}@123`;

        // Create User account
        const user = await User.create({
            email,
            password: rawPassword,
            role: 'Teacher'
        });

        // Create Teacher profile
        const teacher = await Teacher.create({
            name, email, phone, address, qualification, experience, photo,
            school_id,
            user_id: user._id,
            domains: parsedDomains
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

        if (email && email !== teacher.email) {
            const userExists = await User.findOne({ email });
            if (userExists) return res.status(400).json({ message: 'Email already in use' });
        }

        const user = await User.findById(teacher.user_id);
        
        if (password) {
            user.password = password;
        }
        if (email) {
            user.email = email;
            teacher.email = email;
        }

        await user.save();

        teacher.name = name || teacher.name;
        teacher.phone = phone || teacher.phone;
        teacher.address = address || teacher.address;
        teacher.qualification = qualification || teacher.qualification;
        teacher.experience = experience || teacher.experience;
        if (photo) teacher.photo = photo;
        if (domains) {
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
        const staff = await Staff.find({ school_id });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createStaff = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, email, phone, role, address, qualification, experience, photo, password } = req.body; // role like Driver, Peon

        if (email) {
            const userExists = await User.findOne({ email });
            if (userExists) return res.status(400).json({ message: 'User already exists' });
        }

        const rawPassword = password || `${name.replace(/\s+/g, '')}@123`;
        // Staff user needs email to login. If no email is provided, we can't create a User account properly, 
        // but let's assume if password is provided they must have an email, or handle phone-based login later.
        if (!email) {
             return res.status(400).json({ message: 'Email is required to create a login account' });
        }

        const user = await User.create({ email, phone, password: rawPassword, role: 'Staff' });
        const staff = await Staff.create({ name, email, phone, role, address, qualification, experience, photo, school_id, user_id: user._id });
        user.reference_id = staff._id;
        await user.save();

        // If role is Driver, sync with Transport Management Driver collection
        if (role && role.trim().toLowerCase() === 'driver') {
            const driverExists = await Driver.findOne({ mobile_number: phone, school_id });
            if (!driverExists) {
                await Driver.create({
                    school_id,
                    driver_id: `DRV-${Date.now()}`,
                    name,
                    mobile_number: phone,
                    email: email || '',
                    address: address || '',
                    license_number: `DL-${phone}`,
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
        const { name, email, phone, role, address, qualification, experience, photo, password } = req.body;
        
        const staff = await Staff.findOne({ _id: req.params.id, school_id });
        if (!staff) return res.status(404).json({ message: 'Staff not found' });

        if (email && email !== staff.email) {
            const userExists = await User.findOne({ email });
            if (userExists) return res.status(400).json({ message: 'Email already in use' });
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
        const classes = await Class.find({ school_id }).populate('class_incharge_id', 'name email');
        res.json(classes);
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
        const students = await Student.find({ school_id }).populate('class_id', 'class section').populate('parent_user_id', 'email phone');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createStudent = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { 
            first_name, last_name, father_name, mother_name, class_id, group, section, gender,
            roll_no, registration_no, blood_group, religion, admission_number, address,
            guardian_name, guardian_email, guardian_phone, guardian_relation, guardian_address,
            login_email, login_phone, login_password, photo,
            // legacy fallbacks
            student_name, age, dob, parent_name, parent_phone, parent_email
        } = req.body;

        const final_student_name = student_name || (last_name ? `${first_name} ${last_name}` : first_name);
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

        const student = await Student.create({
            student_name: final_student_name,
            first_name,
            last_name,
            father_name,
            mother_name,
            group,
            section,
            gender,
            roll_no,
            registration_no,
            religion,
            admission_number,
            address,
            guardian_relation,
            guardian_address,
            blood_group,
            photo,
            age: age || 0,
            dob: dob || new Date(),
            parent_name: final_parent_name,
            parent_phone: final_parent_phone,
            parent_email: final_parent_email,
            class_id,
            school_id,
            parent_user_id: parentUser._id
        });

        res.status(201).json({
            student,
            parentPassword: parentPassword || 'Existing Account',
            message: 'Student and Parent account created'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateStudent = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { 
            first_name, last_name, father_name, mother_name, class_id, group, section, gender,
            roll_no, registration_no, blood_group, religion, admission_number, address,
            guardian_name, guardian_email, guardian_phone, guardian_relation, guardian_address,
            photo, password, student_name, age, dob, parent_name, parent_phone, parent_email
        } = req.body;

        const student = await Student.findOne({ _id: req.params.id, school_id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const final_student_name = student_name || (last_name ? `${first_name} ${last_name}` : first_name) || student.student_name;
        const final_parent_name = guardian_name || parent_name || student.parent_name;
        const final_parent_phone = guardian_phone || parent_phone || student.parent_phone;
        const final_parent_email = guardian_email || parent_email || student.parent_email;

        const parentUser = await User.findById(student.parent_user_id);
        if (parentUser) {
            if (password) parentUser.password = password;
            if (final_parent_email) parentUser.email = final_parent_email;
            if (final_parent_phone) parentUser.phone = final_parent_phone;
            await parentUser.save();
        }

        const updatedStudent = await Student.findOneAndUpdate(
            { _id: req.params.id, school_id },
            { 
                student_name: final_student_name,
                first_name,
                last_name,
                father_name,
                mother_name,
                group,
                section,
                gender,
                roll_no,
                registration_no,
                religion,
                admission_number,
                address,
                guardian_relation,
                guardian_address,
                blood_group,
                photo,
                age: age || student.age,
                dob: dob || student.dob,
                parent_name: final_parent_name,
                parent_phone: final_parent_phone,
                parent_email: final_parent_email,
                class_id 
            },
            { new: true }
        ).populate('class_id', 'class section').populate('parent_user_id', 'email phone');

        res.json({ student: updatedStudent, message: 'Student updated successfully' });
    } catch (error) {
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

module.exports = {
    getDashboardStats,
    getTeachers, createTeacher, deleteTeacher, updateTeacher,
    getStaff, createStaff, deleteStaff, updateStaff,
    getSubjects, createSubject, deleteSubject, updateSubject,
    getClasses, createClass, deleteClass, updateClass,
    getClassSubjects, assignSubjectTeacher, removeSubjectTeacher, updateSubjectTeacher,
    getStudents, createStudent, updateStudent, deleteStudent
};
