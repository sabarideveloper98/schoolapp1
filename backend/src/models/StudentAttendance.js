const mongoose = require('mongoose');

const studentAttendanceRecordSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    admission_number: {
        type: String,
        required: false
    },
    roll_no: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Leave', 'Late', 'Half Day'],
        required: true,
        default: 'Present'
    },
    remarks: {
        type: String,
        required: false,
        default: ''
    }
});

const studentAttendanceSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    records: [studentAttendanceRecordSchema]
}, { timestamps: true });

// Ensure unique index for school, class, and date
studentAttendanceSchema.index({ school_id: 1, class_id: 1, date: 1 }, { unique: true });

const StudentAttendance = mongoose.model('StudentAttendance', studentAttendanceSchema);
module.exports = StudentAttendance;
