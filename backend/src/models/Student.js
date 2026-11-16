const { createTenantModelProxy } = require('../services/tenantConnectionManager');
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    // --- 1. Student Basic Information ---
    student_name: {
        type: String,
        required: true,
        trim: true,
    },
    first_name: {
        type: String,
        required: false,
        trim: true,
    },
    last_name: {
        type: String,
        required: false,
        trim: true,
    },
    date_of_birth: {
        type: Date,
        required: false,
    },
    dob: {
        type: Date,
        required: false,
    },
    gender: {
        type: String,
        required: false,
        enum: ['Male', 'Female', 'Other'],
        default: 'Male',
    },
    blood_group: {
        type: String,
        required: false,
        default: 'N/A',
    },
    nationality: {
        type: String,
        required: false,
        default: 'Indian',
        trim: true,
    },
    mother_tongue: {
        type: String,
        required: false,
        trim: true,
    },
    student_status: {
        type: String,
        required: false,
        enum: ['Active', 'Inactive', 'Suspended', 'Transferred', 'Graduated'],
        default: 'Active',
    },
    age: {
        type: Number,
        required: false,
    },
    student_email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
    },
    student_phone: {
        type: String,
        required: false,
        trim: true,
    },

    // --- 2. Admission & Academic Information ---
    admission_number: {
        type: String,
        required: false,
        trim: true,
    },
    admission_date: {
        type: Date,
        required: false,
        default: Date.now,
    },
    academic_year: {
        type: String,
        required: false,
        trim: true,
    },
    class: {
        type: String,
        required: false,
        trim: true,
    },
    section: {
        type: String,
        required: false,
        trim: true,
    },
    roll_no: {
        type: String,
        required: false,
        trim: true,
    },
    previous_class: {
        type: String,
        required: false,
        trim: true,
    },
    previous_academic_details: {
        type: String,
        required: false,
        trim: true,
    },
    admission_type: {
        type: String,
        required: false,
        default: 'Regular',
        trim: true,
    },
    stream_group: {
        type: String,
        required: false,
        trim: true,
    },
    group: {
        type: String,
        required: false,
        trim: true,
    },
    medium_of_instruction: {
        type: String,
        required: false,
        default: 'English',
        trim: true,
    },
    second_language: {
        type: String,
        required: false,
        trim: true,
    },
    registration_no: {
        type: String,
        required: false,
        trim: true,
    },
    house: {
        type: String,
        required: false,
        trim: true,
    },
    student_type: {
        type: String,
        required: false,
        enum: ['Day Scholar', 'Hosteler', 'Day Boarder'],
        default: 'Day Scholar',
    },

    // --- 3. Parent & Guardian Information ---
    father_name: {
        type: String,
        required: false,
        trim: true,
    },
    father_phone: {
        type: String,
        required: false,
        trim: true,
    },
    father_occupation: {
        type: String,
        required: false,
        trim: true,
    },
    father_email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
    },
    mother_name: {
        type: String,
        required: false,
        trim: true,
    },
    mother_phone: {
        type: String,
        required: false,
        trim: true,
    },
    mother_occupation: {
        type: String,
        required: false,
        trim: true,
    },
    mother_email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
    },
    guardian_name: {
        type: String,
        required: false,
        trim: true,
    },
    parent_name: {
        type: String,
        required: function () {
            return !this.guardian_name;
        },
        trim: true,
    },
    guardian_relation: {
        type: String,
        required: false,
        default: 'Father',
        trim: true,
    },
    guardian_phone: {
        type: String,
        required: false,
        trim: true,
    },
    parent_phone: {
        type: String,
        required: function () {
            return !this.guardian_phone;
        },
        trim: true,
    },
    guardian_occupation: {
        type: String,
        required: false,
        trim: true,
    },
    guardian_email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
    },
    parent_email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
    },
    whatsapp_number: {
        type: String,
        required: false,
        trim: true,
    },
    alternate_phone: {
        type: String,
        required: false,
        trim: true,
    },

    // --- 4. Contact & Address Information ---
    address_line: {
        type: String,
        required: false,
        trim: true,
    },
    city: {
        type: String,
        required: false,
        trim: true,
    },
    district: {
        type: String,
        required: false,
        trim: true,
    },
    state: {
        type: String,
        required: false,
        trim: true,
    },
    pincode: {
        type: String,
        required: false,
        trim: true,
    },
    address: {
        type: String,
        required: false,
        trim: true,
    },
    guardian_address: {
        type: String,
        required: false,
        trim: true,
    },

    // --- 5. Additional Student Information ---
    apaar_id: {
        type: String,
        required: false,
        trim: true,
    },
    pen_number: {
        type: String,
        required: false,
        trim: true,
    },
    emis_id: {
        type: String,
        required: false,
        trim: true,
    },
    aadhaar_number: {
        type: String,
        required: false,
        trim: true,
    },
    aadhaar_last4: {
        type: String,
        required: false,
        trim: true,
        set: function (val) {
            if (!val) return val;
            const clean = String(val).replace(/\D/g, '');
            return clean.length > 4 ? clean.slice(-4) : clean;
        },
        maxlength: 4,
    },
    religion: {
        type: String,
        required: false,
        default: 'General',
        trim: true,
    },
    community_category: {
        type: String,
        required: false,
        trim: true,
    },
    caste: {
        type: String,
        required: false,
        trim: true,
    },
    economic_category: {
        type: String,
        required: false,
        trim: true,
    },
    is_cwsn: {
        type: Boolean,
        required: false,
        default: false,
    },
    disability_type: {
        type: String,
        required: false,
        trim: true,
    },
    sibling_admission_no: {
        type: String,
        required: false,
        trim: true,
    },

    // --- 6. Previous School Information ---
    previous_school_name: {
        type: String,
        required: false,
        trim: true,
    },
    previous_school_address: {
        type: String,
        required: false,
        trim: true,
    },
    previous_school_board: {
        type: String,
        required: false,
        trim: true,
    },
    previous_class_completed: {
        type: String,
        required: false,
        trim: true,
    },
    previous_admission_number: {
        type: String,
        required: false,
        trim: true,
    },
    previous_school_leaving_date: {
        type: Date,
        required: false,
    },
    previous_academic_year: {
        type: String,
        required: false,
        trim: true,
    },
    previous_tc_number: {
        type: String,
        required: false,
        trim: true,
    },
    transfer_certificate_number: {
        type: String,
        required: false,
        trim: true,
    },
    transfer_certificate_file: {
        type: String,
        required: false,
    },

    // --- 7. Transport & Fee Information ---
    transport_required: {
        type: Boolean,
        required: false,
        default: false,
    },
    route_name: {
        type: String,
        required: false,
        trim: true,
    },
    transport_route: {
        type: String,
        required: false,
        trim: true,
    },
    stop_name: {
        type: String,
        required: false,
        trim: true,
    },
    pickup_point: {
        type: String,
        required: false,
        trim: true,
    },
    drop_point: {
        type: String,
        required: false,
        trim: true,
    },
    vehicle_number: {
        type: String,
        required: false,
        trim: true,
    },
    driver_name: {
        type: String,
        required: false,
        trim: true,
    },
    driver_phone: {
        type: String,
        required: false,
        trim: true,
    },
    driver_id: {
        type: String,
        required: false,
        trim: true,
    },
    transport_fee: {
        type: Number,
        required: false,
        default: 0,
    },
    transport_fee_type: {
        type: String,
        required: false,
        default: 'Monthly',
        trim: true,
    },
    transport_fee_payment_status: {
        type: String,
        required: false,
        default: 'Pending',
        enum: ['Pending', 'Paid', 'Partial', 'Waived', 'N/A'],
    },
    transport_fee_status: {
        type: String,
        required: false,
        default: 'Pending',
    },
    transport_fee_payment_details: {
        type: String,
        required: false,
        trim: true,
    },
    fee_category: {
        type: String,
        required: false,
        trim: true,
    },

    // --- 8. Medical & Emergency Information ---
    emergency_contact_name: {
        type: String,
        required: false,
        trim: true,
    },
    emergency_contact_phone: {
        type: String,
        required: false,
        trim: true,
    },
    allergies: {
        type: String,
        required: false,
        trim: true,
    },
    medical_notes: {
        type: String,
        required: false,
        trim: true,
    },

    // --- 9. Documents & Photo ---
    photo: {
        type: String,
        required: false,
    },

    // --- System / Relational References ---
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

// Pre-validate synchronization hook to keep mapped fields in sync before Mongoose checks required constraints
studentSchema.pre('validate', function () {
    // 1. Sync student name
    if (!this.student_name && this.first_name) {
        this.student_name = this.last_name ? `${this.first_name} ${this.last_name}` : this.first_name;
    }

    // 2. Sync date of birth
    if (this.date_of_birth && !this.dob) this.dob = this.date_of_birth;
    if (this.dob && !this.date_of_birth) this.date_of_birth = this.dob;

    // 3. Sync guardian and parent names
    if (this.guardian_name && !this.parent_name) this.parent_name = this.guardian_name;
    if (this.parent_name && !this.guardian_name) this.guardian_name = this.parent_name;

    // 4. Sync guardian and parent phones
    if (this.guardian_phone && !this.parent_phone) this.parent_phone = this.guardian_phone;
    if (this.parent_phone && !this.guardian_phone) this.guardian_phone = this.parent_phone;

    // 5. Sync guardian and parent emails
    if (this.guardian_email && !this.parent_email) this.parent_email = this.guardian_email;
    if (this.parent_email && !this.guardian_email) this.guardian_email = this.parent_email;

    // 6. Sync stream_group and group
    if (this.stream_group && !this.group) this.group = this.stream_group;
    if (this.group && !this.stream_group) this.stream_group = this.group;

    // 7. Sync address fields
    if (this.address_line && !this.address) {
        this.address = [this.address_line, this.city, this.state, this.pincode].filter(Boolean).join(', ');
    }
    if (this.address && !this.address_line) {
        this.address_line = this.address;
    }
    if (!this.guardian_address && this.address) {
        this.guardian_address = this.address;
    }

    // 8. Sanitize aadhaar_last4 & sync aadhaar_number
    if (this.aadhaar_number && !this.aadhaar_last4) {
        const cleanAadhaar = String(this.aadhaar_number).replace(/\D/g, '');
        this.aadhaar_last4 = cleanAadhaar.length > 4 ? cleanAadhaar.slice(-4) : cleanAadhaar;
    }
    if (this.aadhaar_last4) {
        const cleanAadhaar = String(this.aadhaar_last4).replace(/\D/g, '');
        this.aadhaar_last4 = cleanAadhaar.length > 4 ? cleanAadhaar.slice(-4) : cleanAadhaar;
    }

    // 9. Sync previous class and TC fields
    if (this.previous_class && !this.previous_class_completed) {
        this.previous_class_completed = this.previous_class;
    }
    if (this.previous_class_completed && !this.previous_class) {
        this.previous_class = this.previous_class_completed;
    }
    if (this.previous_tc_number && !this.transfer_certificate_number) {
        this.transfer_certificate_number = this.previous_tc_number;
    }
    if (this.transfer_certificate_number && !this.previous_tc_number) {
        this.previous_tc_number = this.transfer_certificate_number;
    }

    // 10. Sync transport route, stops, and fee status
    if (this.route_name && !this.transport_route) {
        this.transport_route = this.route_name;
    }
    if (this.transport_route && !this.route_name) {
        this.route_name = this.transport_route;
    }
    if (this.stop_name && !this.pickup_point) {
        this.pickup_point = this.stop_name;
    }
    if (this.pickup_point && !this.stop_name) {
        this.stop_name = this.pickup_point;
    }
    if (this.isModified('transport_fee_payment_status') && this.transport_fee_payment_status) {
        this.transport_fee_status = this.transport_fee_payment_status;
    } else if (this.isModified('transport_fee_status') && this.transport_fee_status) {
        this.transport_fee_payment_status = this.transport_fee_status;
    } else if (this.transport_fee_payment_status && (!this.transport_fee_status || this.transport_fee_status === 'Pending')) {
        this.transport_fee_status = this.transport_fee_payment_status;
    } else if (this.transport_fee_status && (!this.transport_fee_payment_status || this.transport_fee_payment_status === 'Pending')) {
        this.transport_fee_payment_status = this.transport_fee_status;
    }
});

// Sparse index on admission_number per school to prevent duplicates while permitting empty/null values
studentSchema.index({ school_id: 1, admission_number: 1 }, { unique: true, sparse: true });

const Student = createTenantModelProxy('Student', studentSchema);
module.exports = Student;
