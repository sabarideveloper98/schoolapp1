/**
 * Student Response Serializer
 * Enriches Student GET responses with all five sections:
 * 1. Academic Information
 * 2. Parent Information
 * 3. Student Information
 * 4. Previous School Information
 * 5. Transport Fee Information
 *
 * Provides top-level backward-compatible fields, alias accessors, and structured nested section objects.
 */

const formatPhotoUrl = (photoVal, req) => {
    if (!photoVal || typeof photoVal !== 'string' || !photoVal.trim()) {
        return null;
    }
    const trimmed = photoVal.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
        return trimmed;
    }
    const host = (req && req.get) ? req.get('host') : ((req && req.headers && req.headers.host) || 'localhost:5005');
    const protocol = (req && req.protocol) ? req.protocol : 'http';
    const baseUrl = `${protocol}://${host}`;
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${cleanPath}`;
};

/**
 * Serialize a single student document
 * @param {Object} studentDoc - Mongoose document or plain JS object
 * @param {Object} req - Express request object for URL building
 * @param {Object} [related] - Optional related documents: { parent, transport, feePayment, studentFee }
 * @returns {Object} Enriched student response object
 */
const serializeStudent = (studentDoc, req = null, related = {}) => {
    if (!studentDoc) return null;

    const student = studentDoc.toObject ? studentDoc.toObject() : { ...studentDoc };
    const parentDoc = related.parent ? (related.parent.toObject ? related.parent.toObject() : related.parent) : null;
    const transportDoc = related.transport ? (related.transport.toObject ? related.transport.toObject() : related.transport) : null;
    const feePaymentDoc = related.feePayment ? (related.feePayment.toObject ? related.feePayment.toObject() : related.feePayment) : null;
    const studentFeeDoc = related.studentFee ? (related.studentFee.toObject ? related.studentFee.toObject() : related.studentFee) : null;

    // --- 1. ACADEMIC INFORMATION ---
    const className = student.class || (student.class_id && student.class_id.class) || '';
    const sectionName = student.section || (student.class_id && student.class_id.section) || '';
    const admissionNumber = student.admission_number || '';
    const rollNo = student.roll_no || '';
    const academicYear = student.academic_year || '';
    const previousClass = student.previous_class || student.previous_class_completed || '';
    const previousClassCompleted = student.previous_class_completed || student.previous_class || '';
    const academicDetails = student.academic_details || student.previous_academic_details || '';
    const previousAcademicDetails = student.previous_academic_details || student.academic_details || '';
    const admissionDate = student.admission_date || null;
    const admissionType = student.admission_type || 'Regular';
    const streamGroup = student.stream_group || student.group || 'Science';
    const mediumOfInstruction = student.medium_of_instruction || 'English';
    const secondLanguage = student.second_language || '';
    const registrationNo = student.registration_no || '';
    const house = student.house || '';
    const studentType = student.student_type || 'Day Scholar';

    // --- 2. PARENT INFORMATION ---
    const fatherName = student.father_name || (parentDoc && parentDoc.father_name) || '';
    const fatherPhone = student.father_phone || (student.guardian_relation === 'Father' ? (student.guardian_phone || student.parent_phone) : '') || (parentDoc && parentDoc.phone) || '';
    const fatherEmail = student.father_email || (student.guardian_relation === 'Father' ? (student.guardian_email || student.parent_email) : '') || (parentDoc && parentDoc.email) || '';
    const fatherOccupation = student.father_occupation || (student.guardian_relation === 'Father' ? (student.guardian_occupation || (parentDoc && parentDoc.occupation)) : (parentDoc && parentDoc.occupation)) || '';

    const motherName = student.mother_name || (parentDoc && parentDoc.mother_name) || '';
    const motherPhone = student.mother_phone || (student.guardian_relation === 'Mother' ? (student.guardian_phone || student.parent_phone) : '') || '';
    const motherEmail = student.mother_email || (student.guardian_relation === 'Mother' ? (student.guardian_email || student.parent_email) : '') || '';
    const motherOccupation = student.mother_occupation || (student.guardian_relation === 'Mother' ? student.guardian_occupation : '') || '';

    const guardianName = student.guardian_name || student.parent_name || (parentDoc && parentDoc.name) || '';
    const parentName = student.parent_name || student.guardian_name || (parentDoc && parentDoc.name) || '';
    const guardianRelation = student.guardian_relation || 'Father';
    const guardianPhone = student.guardian_phone || student.parent_phone || (parentDoc && parentDoc.phone) || (student.parent_user_id && student.parent_user_id.phone) || '';
    const parentPhone = student.parent_phone || student.guardian_phone || (parentDoc && parentDoc.phone) || (student.parent_user_id && student.parent_user_id.phone) || '';
    const guardianEmail = student.guardian_email || student.parent_email || (parentDoc && parentDoc.email) || (student.parent_user_id && student.parent_user_id.email) || '';
    const parentEmail = student.parent_email || student.guardian_email || (parentDoc && parentDoc.email) || (student.parent_user_id && student.parent_user_id.email) || '';
    const guardianOccupation = student.guardian_occupation || (parentDoc && parentDoc.occupation) || '';
    const whatsappNumber = student.whatsapp_number || guardianPhone || '';
    const alternatePhone = student.alternate_phone || (parentDoc && parentDoc.alternate_phone) || '';

    // --- 3. STUDENT INFORMATION ---
    const studentName = student.student_name || (student.first_name ? (student.last_name ? `${student.first_name} ${student.last_name}` : student.first_name) : '');
    const firstName = student.first_name || '';
    const lastName = student.last_name || '';
    const dateOfBirth = student.date_of_birth || student.dob || null;
    const dob = student.dob || student.date_of_birth || null;
    const age = student.age !== undefined && student.age !== null ? student.age : null;
    const gender = student.gender || 'Male';
    const bloodGroup = student.blood_group || 'N/A';
    const religion = student.religion || 'General';
    const caste = student.caste || '';
    const communityCategory = student.community_category || '';
    const nationality = student.nationality || 'Indian';
    const studentEmail = student.student_email || '';
    const studentPhone = student.student_phone || '';
    const apaarId = student.apaar_id || '';
    const aadhaarNumber = student.aadhaar_number || (student.aadhaar_last4 ? `XXXX-XXXX-${student.aadhaar_last4}` : '');
    const aadhaarLast4 = student.aadhaar_last4 || (student.aadhaar_number ? String(student.aadhaar_number).replace(/\D/g, '').slice(-4) : '');
    const photo = formatPhotoUrl(student.photo, req);
    const studentStatus = student.student_status || 'Active';
    const motherTongue = student.mother_tongue || '';
    const penNumber = student.pen_number || '';
    const emisId = student.emis_id || '';
    const economicCategory = student.economic_category || '';
    const isCwsn = student.is_cwsn === true || student.is_cwsn === 'true';
    const disabilityType = student.disability_type || '';
    const siblingAdmissionNo = student.sibling_admission_no || '';
    const emergencyContactName = student.emergency_contact_name || '';
    const emergencyContactPhone = student.emergency_contact_phone || '';
    const allergies = student.allergies || '';
    const medicalNotes = student.medical_notes || '';
    const addressLine = student.address_line || student.address || '';
    const city = student.city || '';
    const district = student.district || '';
    const state = student.state || '';
    const pincode = student.pincode || '';
    const address = student.address || [addressLine, city, state, pincode].filter(Boolean).join(', ');
    const guardianAddress = student.guardian_address || (parentDoc && parentDoc.address) || address;

    // --- 4. PREVIOUS SCHOOL INFORMATION ---
    const previousSchoolName = student.previous_school_name || '';
    const previousSchoolAddress = student.previous_school_address || '';
    const previousSchoolBoard = student.previous_school_board || '';
    const previousAdmissionNumber = student.previous_admission_number || '';
    const previousAcademicYear = student.previous_academic_year || '';
    const previousSchoolLeavingDate = student.previous_school_leaving_date || null;
    const schoolLeavingDate = previousSchoolLeavingDate;
    const transferCertificateNumber = student.transfer_certificate_number || student.previous_tc_number || '';
    const previousTcNumber = student.previous_tc_number || student.transfer_certificate_number || '';
    const transferCertificateFile = student.transfer_certificate_file || '';
    const transferCertificateDocument = transferCertificateFile;

    // --- 5. TRANSPORT FEE INFORMATION ---
    const transportFacility = Boolean(student.transport_required || transportDoc);
    const transportRequired = transportFacility;
    const transportRoute = student.transport_route || student.route_name || (transportDoc && transportDoc.route_id && transportDoc.route_id.route_name) || '';
    const routeName = student.route_name || transportRoute;
    const pickupPoint = student.pickup_point || student.stop_name || (transportDoc && transportDoc.pickup_stop_id && transportDoc.pickup_stop_id.stop_name) || '';
    const stopName = student.stop_name || pickupPoint;
    const dropPoint = student.drop_point || (transportDoc && transportDoc.drop_stop_id && transportDoc.drop_stop_id.stop_name) || '';
    const vehicleNumber = student.vehicle_number || (transportDoc && transportDoc.bus_id && (transportDoc.bus_id.vehicle_reg_number || transportDoc.bus_id.bus_number)) || '';
    const driverName = student.driver_name || '';
    const driverPhone = student.driver_phone || '';
    const driverId = student.driver_id || '';
    const transportFee = (student.transport_fee !== undefined && student.transport_fee !== null) ? Number(student.transport_fee) : 0;
    const transportFeeType = student.transport_fee_type || 'Monthly';
    const transportFeePaymentStatus = student.transport_fee_payment_status || student.transport_fee_status || (feePaymentDoc ? feePaymentDoc.payment_status : 'Pending');
    const transportFeeStatus = student.transport_fee_status || transportFeePaymentStatus;
    const transportFeePaymentDetails = student.transport_fee_payment_details || student.transport_fee_details || (feePaymentDoc ? (feePaymentDoc.notes || feePaymentDoc.receipt_number || '') : '');
    const transportFeeDetails = transportFeePaymentDetails;
    const feeCategory = student.fee_category || 'General Fee';

    // Structured Nested Sections
    const academicInformation = {
        admission_number: admissionNumber,
        roll_number: rollNo,
        roll_no: rollNo,
        academic_year: academicYear,
        class: className,
        section: sectionName,
        class_id: student.class_id,
        previous_class: previousClass,
        previous_class_completed: previousClassCompleted,
        academic_details: academicDetails,
        previous_academic_details: previousAcademicDetails,
        admission_date: admissionDate,
        admission_type: admissionType,
        stream_group: streamGroup,
        group: streamGroup,
        medium_of_instruction: mediumOfInstruction,
        second_language: secondLanguage,
        registration_no: registrationNo,
        house: house,
        student_type: studentType
    };

    const parentInformation = {
        father_name: fatherName,
        father_phone: fatherPhone,
        father_phone_number: fatherPhone,
        father_email: fatherEmail,
        father_occupation: fatherOccupation,
        mother_name: motherName,
        mother_phone: motherPhone,
        mother_phone_number: motherPhone,
        mother_email: motherEmail,
        mother_occupation: motherOccupation,
        guardian_name: guardianName,
        parent_name: parentName,
        guardian_relationship: guardianRelation,
        guardian_relation: guardianRelation,
        guardian_phone_number: guardianPhone,
        guardian_phone: guardianPhone,
        parent_phone: parentPhone,
        guardian_email: guardianEmail,
        parent_email: parentEmail,
        guardian_occupation: guardianOccupation,
        whatsapp_number: whatsappNumber,
        alternate_contact_number: alternatePhone,
        alternate_phone: alternatePhone,
        address: guardianAddress,
        guardian_address: guardianAddress
    };

    const studentInformation = {
        student_name: studentName,
        name: studentName,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        dob: dob,
        age: age,
        gender: gender,
        blood_group: bloodGroup,
        religion: religion,
        caste: caste,
        community_category: communityCategory,
        nationality: nationality,
        student_email: studentEmail,
        student_phone: studentPhone,
        student_phone_number: studentPhone,
        apaar_id: apaarId,
        aadhaar_number: aadhaarNumber,
        aadhaar_last4: aadhaarLast4,
        photo: photo,
        student_photo: photo,
        student_status: studentStatus,
        mother_tongue: motherTongue,
        pen_number: penNumber,
        emis_id: emisId,
        economic_category: economicCategory,
        is_cwsn: isCwsn,
        disability_type: disabilityType,
        sibling_admission_no: siblingAdmissionNo,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        allergies: allergies,
        medical_notes: medicalNotes,
        address_line: addressLine,
        city: city,
        district: district,
        state: state,
        pincode: pincode,
        address: address
    };

    const previousSchoolInformation = {
        previous_school_name: previousSchoolName,
        previous_school_address: previousSchoolAddress,
        previous_school_board: previousSchoolBoard,
        previous_class: previousClass,
        previous_class_completed: previousClassCompleted,
        previous_admission_number: previousAdmissionNumber,
        previous_academic_year: previousAcademicYear,
        school_leaving_date: schoolLeavingDate,
        previous_school_leaving_date: previousSchoolLeavingDate,
        transfer_certificate_number: transferCertificateNumber,
        previous_tc_number: previousTcNumber,
        transfer_certificate_document: transferCertificateDocument,
        transfer_certificate_file: transferCertificateFile
    };

    const transportFeeInformation = {
        transport_facility: transportFacility,
        transport_required: transportRequired,
        transport_route: transportRoute,
        route_name: routeName,
        pickup_point: pickupPoint,
        stop_name: stopName,
        drop_point: dropPoint,
        vehicle_number: vehicleNumber,
        driver_name: driverName,
        driver_phone: driverPhone,
        driver_id: driverId,
        transport_fee: transportFee,
        transport_fee_type: transportFeeType,
        transport_fee_payment_status: transportFeePaymentStatus,
        transport_fee_status: transportFeeStatus,
        transport_fee_details: transportFeeDetails,
        transport_fee_payment_details: transportFeePaymentDetails,
        fee_category: feeCategory
    };

    return {
        // Base document properties
        ...student,

        // 1. Academic Information (top-level)
        admission_number: admissionNumber,
        roll_no: rollNo,
        roll_number: rollNo,
        academic_year: academicYear,
        class: className,
        section: sectionName,
        previous_class: previousClass,
        previous_class_completed: previousClassCompleted,
        academic_details: academicDetails,
        previous_academic_details: previousAcademicDetails,
        admission_date: admissionDate,
        admission_type: admissionType,
        stream_group: streamGroup,
        group: streamGroup,
        medium_of_instruction: mediumOfInstruction,
        second_language: secondLanguage,
        registration_no: registrationNo,
        house: house,
        student_type: studentType,

        // 2. Parent Information (top-level)
        father_name: fatherName,
        father_phone: fatherPhone,
        father_phone_number: fatherPhone,
        father_email: fatherEmail,
        father_occupation: fatherOccupation,
        mother_name: motherName,
        mother_phone: motherPhone,
        mother_phone_number: motherPhone,
        mother_email: motherEmail,
        mother_occupation: motherOccupation,
        guardian_name: guardianName,
        parent_name: parentName,
        guardian_relation: guardianRelation,
        guardian_relationship: guardianRelation,
        guardian_phone: guardianPhone,
        guardian_phone_number: guardianPhone,
        parent_phone: parentPhone,
        guardian_email: guardianEmail,
        parent_email: parentEmail,
        guardian_occupation: guardianOccupation,
        whatsapp_number: whatsappNumber,
        alternate_phone: alternatePhone,
        alternate_contact_number: alternatePhone,
        guardian_address: guardianAddress,

        // 3. Student Information (top-level)
        student_name: studentName,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        dob: dob,
        age: age,
        gender: gender,
        blood_group: bloodGroup,
        religion: religion,
        caste: caste,
        community_category: communityCategory,
        nationality: nationality,
        student_email: studentEmail,
        student_phone: studentPhone,
        student_phone_number: studentPhone,
        apaar_id: apaarId,
        aadhaar_number: aadhaarNumber,
        aadhaar_last4: aadhaarLast4,
        photo: photo,
        student_photo: photo,
        student_status: studentStatus,
        mother_tongue: motherTongue,
        pen_number: penNumber,
        emis_id: emisId,
        economic_category: economicCategory,
        is_cwsn: isCwsn,
        disability_type: disabilityType,
        sibling_admission_no: siblingAdmissionNo,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        allergies: allergies,
        medical_notes: medicalNotes,
        address_line: addressLine,
        city: city,
        district: district,
        state: state,
        pincode: pincode,
        address: address,

        // 4. Previous School Information (top-level)
        previous_school_name: previousSchoolName,
        previous_school_address: previousSchoolAddress,
        previous_school_board: previousSchoolBoard,
        previous_admission_number: previousAdmissionNumber,
        previous_academic_year: previousAcademicYear,
        previous_school_leaving_date: previousSchoolLeavingDate,
        school_leaving_date: schoolLeavingDate,
        transfer_certificate_number: transferCertificateNumber,
        previous_tc_number: previousTcNumber,
        transfer_certificate_file: transferCertificateFile,
        transfer_certificate_document: transferCertificateDocument,

        // 5. Transport Fee Information (top-level)
        transport_facility: transportFacility,
        transport_required: transportRequired,
        transport_route: transportRoute,
        route_name: routeName,
        pickup_point: pickupPoint,
        stop_name: stopName,
        drop_point: dropPoint,
        vehicle_number: vehicleNumber,
        driver_name: driverName,
        driver_phone: driverPhone,
        driver_id: driverId,
        transport_fee: transportFee,
        transport_fee_type: transportFeeType,
        transport_fee_payment_status: transportFeePaymentStatus,
        transport_fee_status: transportFeeStatus,
        transport_fee_details: transportFeeDetails,
        transport_fee_payment_details: transportFeePaymentDetails,
        fee_category: feeCategory,

        // Explicit nested section structures
        academic_information: academicInformation,
        parent_information: parentInformation,
        student_information: studentInformation,
        previous_school_information: previousSchoolInformation,
        transport_fee_information: transportFeeInformation
    };
};

module.exports = {
    serializeStudent,
    formatPhotoUrl
};
