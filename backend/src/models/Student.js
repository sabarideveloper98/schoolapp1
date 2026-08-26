const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    student_name: {
        type: String,
        required: true,
    },
    first_name: {
        type: String,
        required: false,
    },
    last_name: {
        type: String,
        required: false,
    },
    father_name: {
        type: String,
        required: false,
    },
    mother_name: {
        type: String,
        required: false,
    },
    group: {
        type: String,
        required: false,
    },
    section: {
        type: String,
        required: false,
    },
    gender: {
        type: String,
        required: false,
    },
    roll_no: {
        type: String,
        required: false,
    },
    registration_no: {
        type: String,
        required: false,
    },
    religion: {
        type: String,
        required: false,
    },
    admission_number: {
        type: String,
        required: false,
    },
    guardian_relation: {
        type: String,
        required: false,
    },
    guardian_address: {
        type: String,
        required: false,
    },
    age: {
        type: Number,
        required: false,
    },
    address: {
        type: String,
        required: false,
    },
    photo: {
        type: String,
        required: false,
    },
    dob: {
        type: Date,
        required: false,
    },
    blood_group: {
        type: String,
        required: false,
    },
    parent_name: {
        type: String,
        required: true,
    },
    parent_phone: {
        type: String,
        required: true,
    },
    parent_email: {
        type: String,
        required: false,
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    parent_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
