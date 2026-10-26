import { useState, useRef } from 'react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  Trash2,
  AlertTriangle,
  HelpCircle,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

// Complete list of all supported student fields with display metadata
export const ALL_STUDENT_FIELDS = [
  // Required fields
  { key: 'admission_number', label: 'Admission Number', required: true, example: 'ADM2025001', note: 'Unique per school' },
  { key: 'student_name', label: 'Student Name', required: true, example: 'Alex Smith', note: 'Full student name' },
  { key: 'date_of_birth', label: 'Date of Birth', required: true, example: '2010-05-15', note: 'YYYY-MM-DD' },
  { key: 'gender', label: 'Gender', required: true, example: 'Male', note: 'Male / Female / Other' },
  { key: 'admission_date', label: 'Admission Date', required: true, example: '2025-06-01', note: 'YYYY-MM-DD' },
  { key: 'academic_year', label: 'Academic Year', required: true, example: '2025-2026', note: 'e.g. 2025-2026' },
  { key: 'class', label: 'Class / Standard', required: true, example: '10', note: 'e.g. 10 or L.K.G' },
  { key: 'section', label: 'Section', required: true, example: 'A', note: 'e.g. A, B, C' },
  { key: 'roll_no', label: 'Roll Number', required: true, example: '101', note: 'Student roll number' },
  { key: 'student_status', label: 'Student Status', required: true, example: 'Active', note: 'Active / Inactive / Suspended / Transferred / Graduated' },
  { key: 'guardian_name', label: 'Guardian / Parent Name', required: true, example: 'Robert Smith', note: 'Primary parent/guardian' },
  { key: 'guardian_relation', label: 'Guardian Relation', required: true, example: 'Father', note: 'Father / Mother / Guardian' },
  { key: 'guardian_phone', label: 'Guardian Phone', required: true, example: '9876543210', note: '10-digit mobile number' },
  { key: 'address_line', label: 'Address Line', required: true, example: '123 Main Street', note: 'Residential address' },
  { key: 'city', label: 'City', required: true, example: 'Chennai', note: 'City of residence' },
  { key: 'state', label: 'State', required: true, example: 'Tamil Nadu', note: 'State' },
  { key: 'pincode', label: 'Pincode', required: true, example: '600001', note: '6-digit pincode' },

  // Recommended & Optional fields
  { key: 'blood_group', label: 'Blood Group', required: false, example: 'O+', note: 'A+, B+, O+, AB+, etc.' },
  { key: 'admission_type', label: 'Admission Type', required: false, example: 'Regular', note: 'Regular / RTE / Management' },
  { key: 'medium_of_instruction', label: 'Medium of Instruction', required: false, example: 'English', note: 'English / Tamil / Hindi' },
  { key: 'second_language', label: 'Second Language', required: false, example: 'Hindi', note: 'Optional second language' },
  { key: 'nationality', label: 'Nationality', required: false, example: 'Indian', note: 'Default: Indian' },
  { key: 'father_name', label: 'Father Name', required: false, example: 'Robert Smith', note: 'Father name' },
  { key: 'mother_name', label: 'Mother Name', required: false, example: 'Mary Smith', note: 'Mother name' },
  { key: 'whatsapp_number', label: 'WhatsApp Number', required: false, example: '9876543210', note: '10-digit number' },
  { key: 'alternate_phone', label: 'Alternate Phone', required: false, example: '9876543212', note: 'Backup phone' },
  { key: 'emergency_contact_name', label: 'Emergency Contact Name', required: false, example: 'Robert Smith', note: 'Emergency person' },
  { key: 'emergency_contact_phone', label: 'Emergency Contact Phone', required: false, example: '9876543210', note: 'Emergency phone' },
  { key: 'district', label: 'District', required: false, example: 'Chennai', note: 'District' },
  { key: 'transport_required', label: 'Transport Required', required: false, example: 'No', note: 'Yes / No or TRUE / FALSE' },
  { key: 'route_name', label: 'Route Name', required: false, example: 'Route 1', note: 'Bus route name' },
  { key: 'stop_name', label: 'Stop Name', required: false, example: 'Main Gate', note: 'Bus stop' },
  { key: 'fee_category', label: 'Fee Category', required: false, example: 'General', note: 'Fee category slab' },
  { key: 'student_type', label: 'Student Type', required: false, example: 'Day Scholar', note: 'Day Scholar / Hosteler / Day Boarder' },
  { key: 'stream_group', label: 'Stream / Group', required: false, example: 'Science', note: 'Science / Commerce / Arts' },
  { key: 'registration_no', label: 'Registration Number', required: false, example: 'REG202501', note: 'Registration code' },
  { key: 'apaar_id', label: 'APAAR ID', required: false, example: '123456789012', note: 'Government APAAR ID' },
  { key: 'pen_number', label: 'PEN Number', required: false, example: 'PEN2025001', note: 'Permanent Education Number' },
  { key: 'emis_id', label: 'EMIS ID', required: false, example: 'EMIS2025001', note: 'State EMIS code' },
  { key: 'aadhaar_last4', label: 'Aadhaar (Last 4)', required: false, example: '1234', note: 'Last 4 digits only' },
  { key: 'house', label: 'House', required: false, example: 'Red House', note: 'School house name' },
  { key: 'religion', label: 'Religion', required: false, example: 'General', note: 'Religion' },
  { key: 'community_category', label: 'Community Category', required: false, example: 'General', note: 'General / OBC / SC / ST / BC / MBC' },
  { key: 'caste', label: 'Caste', required: false, example: 'General', note: 'Caste' },
  { key: 'mother_tongue', label: 'Mother Tongue', required: false, example: 'English', note: 'Language spoken at home' },
  { key: 'economic_category', label: 'Economic Category', required: false, example: 'General', note: 'General / EWS / BPL' },
  { key: 'is_cwsn', label: 'Is CWSN', required: false, example: 'No', note: 'Children With Special Needs (Yes / No)' },
  { key: 'disability_type', label: 'Disability Type', required: false, example: '', note: 'Required if CWSN is Yes' },
  { key: 'guardian_email', label: 'Guardian Email', required: false, example: 'robert@example.com', note: 'Parent login email' },
  { key: 'password', label: 'Login Password', required: false, example: 'Student@123', note: 'Parent/Student account password (default: 123456)' },
  { key: 'previous_school_name', label: 'Previous School Name', required: false, example: 'Green Valley Public School', note: 'Transfer source' },
  { key: 'previous_class_completed', label: 'Previous Class Completed', required: false, example: '9', note: 'Last passed grade' },
  { key: 'previous_tc_number', label: 'Previous TC Number', required: false, example: 'TC2024098', note: 'Transfer Certificate number' },
  { key: 'sibling_admission_no', label: 'Sibling Admission No', required: false, example: 'ADM2024005', note: 'Sibling admission number' },
  { key: 'allergies', label: 'Allergies', required: false, example: 'Peanuts', note: 'Known allergies' },
  { key: 'medical_notes', label: 'Medical Notes', required: false, example: 'None', note: 'General health notes' },
  { key: 'photo', label: 'Photo URL / Base64', required: false, example: '', note: 'Student photo image string' }
];

// Escape helper for CSV cells
export const escapeCSVCell = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Standalone function to download comprehensive sample template
export const downloadStudentSampleCSV = () => {
  try {
    const headers = ALL_STUDENT_FIELDS.map(f => f.key).join(',');

    const sampleRowData = {
      admission_number: 'SAMPLE-ADM-001',
      student_name: 'John Doe',
      date_of_birth: '2010-05-15',
      gender: 'Male',
      admission_date: '2025-06-01',
      academic_year: '2025-2026',
      class: '10',
      section: 'A',
      roll_no: '101',
      student_status: 'Active',
      guardian_name: 'Robert Doe',
      guardian_relation: 'Father',
      guardian_phone: '9876543210',
      address_line: '123 Main Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      blood_group: 'O+',
      admission_type: 'Regular',
      medium_of_instruction: 'English',
      second_language: 'Hindi',
      nationality: 'Indian',
      father_name: 'Robert Doe',
      mother_name: 'Mary Doe',
      whatsapp_number: '9876543210',
      alternate_phone: '9876543212',
      emergency_contact_name: 'Robert Doe',
      emergency_contact_phone: '9876543210',
      district: 'Chennai',
      transport_required: 'No',
      route_name: '',
      stop_name: '',
      fee_category: 'General',
      student_type: 'Day Scholar',
      stream_group: 'Science',
      registration_no: 'REG1001',
      apaar_id: '123456789012',
      pen_number: 'PEN1001',
      emis_id: 'EMIS1001',
      aadhaar_last4: '1234',
      house: 'Red',
      religion: 'General',
      community_category: 'General',
      caste: 'General',
      mother_tongue: 'Tamil',
      economic_category: 'General',
      is_cwsn: 'No',
      disability_type: '',
      guardian_email: 'robert@example.com',
      password: 'Student@123',
      previous_school_name: 'Green Valley Public School',
      previous_class_completed: '9',
      previous_tc_number: 'TC12345',
      sibling_admission_no: 'ADM099',
      allergies: 'Peanuts',
      medical_notes: 'None',
      photo: ''
    };

    // Correct column positions: map each field key directly to sampleRowData
    const sampleRow = ALL_STUDENT_FIELDS.map(f => escapeCSVCell(sampleRowData[f.key] ?? '')).join(',');

    // Only intended header row and sample data row (unwanted second row removed)
    const csvContent = `${headers}\n${sampleRow}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_bulk_import_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    toast.success('Sample student CSV template downloaded successfully');
  } catch (err) {
    console.error('Download sample CSV error:', err);
    toast.error('Failed to download sample file: ' + err.message);
  }
};

const BulkStudentImportModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [parsedRows, setParsedRows] = useState([]);
  const [sampleRowsExcluded, setSampleRowsExcluded] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'valid' | 'errors'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHelpAccordion, setShowHelpAccordion] = useState(false);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    downloadStudentSampleCSV();
  };

  // Helper to parse individual CSV line handling quotes, commas, and escaped quotes
  const parseCSVLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Map header variations to standardized field names
  const normalizeHeaderKey = (rawHeader) => {
    const clean = rawHeader.toLowerCase().trim().replace(/[\s"'.\-_]/g, '');
    if (['studentname', 'name', 'fullname', 'nameofstudent'].includes(clean)) return 'student_name';
    if (['admissionnumber', 'admissionno', 'admno', 'admnumber', 'admissionnum'].includes(clean)) return 'admission_number';
    if (['class', 'standard', 'grade', 'std'].includes(clean)) return 'class';
    if (['section', 'sec'].includes(clean)) return 'section';
    if (['rollno', 'rollnumber', 'roll'].includes(clean)) return 'roll_no';
    if (['dateofbirth', 'dob', 'birthdate'].includes(clean)) return 'date_of_birth';
    if (['admissiondate', 'admdate'].includes(clean)) return 'admission_date';
    if (['academicyear', 'acadyear', 'year'].includes(clean)) return 'academic_year';
    if (['studentstatus', 'status'].includes(clean)) return 'student_status';
    if (['guardianname', 'parentname'].includes(clean)) return 'guardian_name';
    if (['guardianrelation', 'relation'].includes(clean)) return 'guardian_relation';
    if (['guardianphone', 'parentphone', 'phone', 'mobile', 'contactphone', 'loginphone', 'login_phone'].includes(clean)) return 'guardian_phone';
    if (['guardianemail', 'parentemail', 'email', 'loginemail', 'login_email'].includes(clean)) return 'guardian_email';
    if (['password', 'loginpassword', 'login_password', 'pwd', 'parentpassword', 'userpassword'].includes(clean)) return 'password';
    if (['addressline', 'address', 'street', 'residenceaddress'].includes(clean)) return 'address_line';
    if (['city', 'town'].includes(clean)) return 'city';
    if (['state'].includes(clean)) return 'state';
    if (['pincode', 'pin', 'zip', 'postalcode'].includes(clean)) return 'pincode';
    if (['district'].includes(clean)) return 'district';
    if (['bloodgroup', 'bloodgrp'].includes(clean)) return 'blood_group';
    if (['admissiontype'].includes(clean)) return 'admission_type';
    if (['mediumofinstruction', 'medium'].includes(clean)) return 'medium_of_instruction';
    if (['secondlanguage', 'language2'].includes(clean)) return 'second_language';
    if (['nationality'].includes(clean)) return 'nationality';
    if (['fathername', 'father'].includes(clean)) return 'father_name';
    if (['mothername', 'mother'].includes(clean)) return 'mother_name';
    if (['whatsappnumber', 'whatsapp', 'wanumber'].includes(clean)) return 'whatsapp_number';
    if (['alternatephone', 'altphone'].includes(clean)) return 'alternate_phone';
    if (['emergencycontactname', 'emergencycontact', 'emergencyname'].includes(clean)) return 'emergency_contact_name';
    if (['emergencycontactphone', 'emergencyphone'].includes(clean)) return 'emergency_contact_phone';
    if (['transportrequired', 'transport'].includes(clean)) return 'transport_required';
    if (['routename', 'route'].includes(clean)) return 'route_name';
    if (['stopname', 'stop'].includes(clean)) return 'stop_name';
    if (['feecategory'].includes(clean)) return 'fee_category';
    if (['studenttype'].includes(clean)) return 'student_type';
    if (['streamgroup', 'group', 'stream'].includes(clean)) return 'stream_group';
    if (['registrationno', 'regno'].includes(clean)) return 'registration_no';
    if (['apaarid', 'apaar'].includes(clean)) return 'apaar_id';
    if (['pennumber', 'penno', 'pen'].includes(clean)) return 'pen_number';
    if (['emisid', 'emis'].includes(clean)) return 'emis_id';
    if (['aadhaarlast4', 'aadhaar', 'aadhar', 'aadharno'].includes(clean)) return 'aadhaar_last4';
    if (['house'].includes(clean)) return 'house';
    if (['religion'].includes(clean)) return 'religion';
    if (['communitycategory', 'community'].includes(clean)) return 'community_category';
    if (['caste'].includes(clean)) return 'caste';
    if (['mothertongue'].includes(clean)) return 'mother_tongue';
    if (['economiccategory'].includes(clean)) return 'economic_category';
    if (['iscwsn', 'cwsn'].includes(clean)) return 'is_cwsn';
    if (['disabilitytype'].includes(clean)) return 'disability_type';
    if (['previousschoolname', 'previousschool'].includes(clean)) return 'previous_school_name';
    if (['previousclasscompleted', 'previousclass'].includes(clean)) return 'previous_class_completed';
    if (['previoustcnumber', 'previoustc', 'tcnumber'].includes(clean)) return 'previous_tc_number';
    if (['siblingadmissionno', 'siblingadmissionnumber'].includes(clean)) return 'sibling_admission_no';
    if (['allergies'].includes(clean)) return 'allergies';
    if (['medicalnotes', 'healthnotes'].includes(clean)) return 'medical_notes';
    if (['photo', 'photourl', 'image'].includes(clean)) return 'photo';

    return rawHeader.toLowerCase().trim().replace(/[\s"'.]/g, '_');
  };

  // Helper to validate and analyze each student row
  const validateStudentRows = (rawRows) => {
    // 1. Group admission numbers to detect duplicates within the file
    const admissionCount = new Map();
    rawRows.forEach((row) => {
      const adm = String(row.admission_number || '').trim();
      if (adm) {
        if (!admissionCount.has(adm)) admissionCount.set(adm, []);
        admissionCount.get(adm).push(row.rowNumber);
      }
    });

    const validGenders = ['male', 'female', 'other'];
    const validStatuses = ['active', 'inactive', 'suspended', 'transferred', 'graduated'];
    const validTypes = ['day scholar', 'hosteler', 'day boarder'];

    return rawRows.map((row) => {
      const errors = [];

      // Required fields checks
      if (!row.student_name?.trim()) {
        errors.push({ field: 'student_name', message: 'Student name is mandatory' });
      }
      if (!row.admission_number?.trim()) {
        errors.push({ field: 'admission_number', message: 'Admission number is mandatory' });
      }
      if (!row.class?.trim()) {
        errors.push({ field: 'class', message: 'Class is mandatory' });
      }
      if (!row.section?.trim()) {
        errors.push({ field: 'section', message: 'Section is mandatory' });
      }
      if (!row.roll_no?.trim()) {
        errors.push({ field: 'roll_no', message: 'Roll number is mandatory' });
      }
      if (!row.guardian_name?.trim()) {
        errors.push({ field: 'guardian_name', message: 'Guardian name is mandatory' });
      }
      if (!row.guardian_relation?.trim()) {
        errors.push({ field: 'guardian_relation', message: 'Guardian relation is mandatory' });
      }
      if (!row.address_line?.trim()) {
        errors.push({ field: 'address_line', message: 'Address line is mandatory' });
      }
      if (!row.city?.trim()) {
        errors.push({ field: 'city', message: 'City is mandatory' });
      }
      if (!row.state?.trim()) {
        errors.push({ field: 'state', message: 'State is mandatory' });
      }

      // Guardian phone validation (10 digits)
      if (!row.guardian_phone?.trim()) {
        errors.push({ field: 'guardian_phone', message: 'Guardian phone is mandatory' });
      } else {
        const phoneDigits = String(row.guardian_phone).replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
          errors.push({ field: 'guardian_phone', message: `Guardian phone must be exactly 10 digits (got "${row.guardian_phone}")` });
        }
      }

      // Pincode validation (6 digits)
      if (!row.pincode?.trim()) {
        errors.push({ field: 'pincode', message: 'Pincode is mandatory' });
      } else {
        const pinDigits = String(row.pincode).replace(/\D/g, '');
        if (pinDigits.length !== 6) {
          errors.push({ field: 'pincode', message: `Pincode must be exactly 6 digits (got "${row.pincode}")` });
        }
      }

      // Date of birth validation
      if (!row.date_of_birth?.trim()) {
        errors.push({ field: 'date_of_birth', message: 'Date of birth is mandatory' });
      } else if (isNaN(Date.parse(row.date_of_birth))) {
        errors.push({ field: 'date_of_birth', message: `Invalid Date of Birth "${row.date_of_birth}". Expected format: YYYY-MM-DD` });
      }

      // Admission date validation
      if (!row.admission_date?.trim()) {
        errors.push({ field: 'admission_date', message: 'Admission date is mandatory' });
      } else if (isNaN(Date.parse(row.admission_date))) {
        errors.push({ field: 'admission_date', message: `Invalid Admission Date "${row.admission_date}". Expected format: YYYY-MM-DD` });
      }

      // Academic year
      if (!row.academic_year?.trim()) {
        errors.push({ field: 'academic_year', message: 'Academic year is mandatory (e.g. 2025-2026)' });
      }

      // Gender validation
      if (!row.gender?.trim()) {
        errors.push({ field: 'gender', message: 'Gender is mandatory (Male / Female / Other)' });
      } else if (!validGenders.includes(row.gender.trim().toLowerCase())) {
        errors.push({ field: 'gender', message: `Invalid gender "${row.gender}". Acceptable values: Male, Female, Other` });
      }

      // Student Status validation
      if (row.student_status?.trim() && !validStatuses.includes(row.student_status.trim().toLowerCase())) {
        errors.push({ field: 'student_status', message: `Invalid status "${row.student_status}". Acceptable values: Active, Inactive, Suspended, Transferred, Graduated` });
      }

      // Student Type validation
      if (row.student_type?.trim() && !validTypes.includes(row.student_type.trim().toLowerCase())) {
        errors.push({ field: 'student_type', message: `Invalid student type "${row.student_type}". Acceptable values: Day Scholar, Hosteler, Day Boarder` });
      }

      // Duplicate admission number within the file
      const adm = String(row.admission_number || '').trim();
      if (adm && admissionCount.has(adm) && admissionCount.get(adm).length > 1) {
        const duplicateRows = admissionCount.get(adm);
        errors.push({
          field: 'admission_number',
          message: `Duplicate admission number "${adm}" found on rows ${duplicateRows.join(', ')}`
        });
      }

      return {
        ...row,
        isValid: errors.length === 0,
        errors
      };
    });
  };

  // Handle file selection and parsing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check extension
    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith('.csv') && !nameLower.endsWith('.txt')) {
      if (nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls')) {
        toast.info('For Excel files, please click "Save As" > "CSV (.csv)" in Excel and upload the CSV file.');
      } else {
        toast.error('Unsupported file format. Please upload a standard CSV file (.csv).');
      }
      return;
    }

    setFileName(file.name);
    setFileSize(Math.round(file.size / 1024));
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          toast.error('The selected CSV file has no data rows.');
          setParsedRows([]);
          return;
        }

        const rawHeaders = parseCSVLine(lines[0]);
        const mappedHeaders = rawHeaders.map(normalizeHeaderKey);

        const extractedRows = [];
        let sampleExcludedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const rawLine = lines[i].trim();
          // Skip instruction comment lines
          if (rawLine.startsWith('#') || rawLine.startsWith('//')) {
            continue;
          }

          const values = parseCSVLine(lines[i]);
          const rowObj = { rowNumber: i + 1 };

          mappedHeaders.forEach((key, colIndex) => {
            rowObj[key] = values[colIndex] !== undefined ? values[colIndex] : '';
          });

          // Check if this row is an example/sample row (explicitly excluded as per requirements)
          const admStr = String(rowObj.admission_number || '').toUpperCase();
          const nameStr = String(rowObj.student_name || '').toUpperCase();
          if (
            admStr.startsWith('SAMPLE-') ||
            admStr.includes('SAMPLE') ||
            nameStr.startsWith('SAMPLE') ||
            nameStr.includes('[SAMPLE]')
          ) {
            sampleExcludedCount++;
            continue;
          }

          // Check if row has at least some student info
          if (rowObj.student_name || rowObj.admission_number || rowObj.class) {
            extractedRows.push(rowObj);
          }
        }

        setSampleRowsExcluded(sampleExcludedCount);

        if (extractedRows.length === 0) {
          toast.warning(
            sampleExcludedCount > 0
              ? `Only sample rows (${sampleExcludedCount}) were detected and excluded. Please add your real student records.`
              : 'No student data rows could be detected in this CSV file.'
          );
          setParsedRows([]);
        } else {
          const validated = validateStudentRows(extractedRows);
          setParsedRows(validated);
          const validCount = validated.filter(r => r.isValid).length;
          const errorCount = validated.length - validCount;

          if (errorCount === 0) {
            toast.success(`Loaded ${validated.length} student records. All records passed validation!`);
          } else {
            toast.warning(`Loaded ${validated.length} student records (${validCount} valid, ${errorCount} with validation issues).`);
          }
        }
      } catch (err) {
        console.error('CSV parse error:', err);
        toast.error('Failed to parse CSV file. Please verify file integrity.');
      }
    };

    reader.readAsText(file);
  };

  // Remove/Clear selected file
  const handleRemoveFile = () => {
    setFileName('');
    setFileSize(0);
    setParsedRows([]);
    setSampleRowsExcluded(0);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Selected file cleared');
  };

  // 4. Download Validation / Error Report
  const handleDownloadErrorReport = () => {
    const errorRows = parsedRows.filter(r => !r.isValid);
    if (errorRows.length === 0 && (!importResult || importResult.errors?.length === 0)) {
      return toast.info('No errors to download.');
    }

    const reportHeaders = 'Row Number,Admission Number,Student Name,Class,Section,Field Name,Error Reason\n';
    let reportContent = '';

    // If server errors exist, use server errors
    if (importResult?.errors && importResult.errors.length > 0) {
      importResult.errors.forEach((err) => {
        reportContent += [
          err.row || 'N/A',
          err.admission_number || 'N/A',
          err.student_name || 'N/A',
          err.class || 'N/A',
          err.section || 'N/A',
          err.field || 'General',
          err.message || 'Import failed'
        ].map(escapeCSVCell).join(',') + '\n';
      });
    } else {
      // Use client-side validation errors
      errorRows.forEach((row) => {
        row.errors.forEach((err) => {
          reportContent += [
            row.rowNumber,
            row.admission_number || 'N/A',
            row.student_name || 'N/A',
            row.class || 'N/A',
            row.section || 'N/A',
            err.field,
            err.message
          ].map(escapeCSVCell).join(',') + '\n';
        });
      });
    }

    const blob = new Blob([reportHeaders + reportContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `student_import_errors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Error report downloaded');
  };

  // 5. Submit valid rows to backend
  const handleExecuteImport = async () => {
    setShowConfirmModal(false);
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      return toast.error('There are no valid student records to import. Please resolve the validation errors.');
    }

    setLoading(true);
    try {
      const token = user?.token || user?.accessToken || (typeof localStorage !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}')?.token || localStorage.getItem('token')) : '') || '';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const { data } = await axios.post('/api/schooladmin/students/bulk-import', {
        students: validRows
      }, config);

      setImportResult(data);
      if (data.count > 0) {
        toast.success(`Successfully admitted ${data.count} students!`);
        if (onSuccess) onSuccess();
      } else {
        toast.error('Import completed but no student records were saved.');
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error(error.response?.data?.message || 'Failed to import students. Please review errors.');
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const errorCount = parsedRows.length - validCount;

  // Filtered rows for display
  const displayedRows = parsedRows.filter(row => {
    if (filterTab === 'valid') return row.isValid;
    if (filterTab === 'errors') return !row.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Student Bulk Upload & Template
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">CSV / Excel</span>
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Download the official student admission template, fill in student records, and import in bulk.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1">

          {/* Step 1 & 2 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Step 1: Download Sample File */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-100/60 px-2 py-0.5 rounded-md">
                    Step 1
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHelpAccordion(!showHelpAccordion)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHelpAccordion ? 'Hide Field Guide' : 'View Field Guide'}
                  </button>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mt-2">Download Sample Template</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Download the official CSV template pre-populated with all 40+ supported student fields, formatting instructions, and sample rows.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="w-full px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 hover:text-blue-700 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" /> Download Sample File (.csv)
                </button>
              </div>
            </div>

            {/* Step 2: Upload Completed File */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-100/60 px-2 py-0.5 rounded-md">
                    Step 2
                  </span>
                  {fileName && (
                    <span className="text-[11px] font-bold text-slate-500">
                      {fileSize} KB
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mt-2">Upload Completed File</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  {fileName
                    ? `Loaded: ${fileName} (${parsedRows.length} student records detected)`
                    : 'Select your filled student CSV template from your computer to inspect and validate.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                {fileName ? (
                  <div className="flex items-center gap-2 w-full">
                    <label className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <RefreshCw className="w-3.5 h-3.5" /> Change File
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <label className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg">
                    <Upload className="w-4 h-4" /> Browse CSV / Excel File
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

          </div>

          {/* Collapsible Supported Fields Guide */}
          {showHelpAccordion && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Complete Field Specification (All 40+ Fields)
                </h4>
                <span className="text-[11px] text-slate-400 font-semibold">17 Mandatory Fields</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3 max-h-48 overflow-y-auto text-xs pr-1">
                {ALL_STUDENT_FIELDS.map(f => (
                  <div key={f.key} className="p-2 bg-white rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">{f.label}</span>
                      {f.required ? (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-red-100 text-red-700">Required</span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">Optional</span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{f.key}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 italic">{f.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample Rows Excluded Notice */}
          {sampleRowsExcluded > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Detected and automatically excluded {sampleRowsExcluded} sample example row{sampleRowsExcluded > 1 ? 's' : ''} (prefixed with "SAMPLE-").
              </span>
            </div>
          )}

          {/* Import Results Summary Banner */}
          {importResult && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Import Completed: {importResult.count} Student Records Successfully Created!</span>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Error Report ({importResult.errors.length})
                  </button>
                )}
              </div>
              <p className="text-slate-600 font-medium">
                Parent portal accounts have been registered using guardian phone numbers. Default login password is: <code className="bg-white px-2 py-0.5 rounded text-emerald-800 font-mono font-bold border border-emerald-200">123456</code>.
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-emerald-200 text-red-700">
                  <span className="font-extrabold">{importResult.errors.length} rows could not be imported</span> due to database validation (e.g. existing duplicate admission numbers). Use the error report above to review and rectify.
                </div>
              )}
            </div>
          )}

          {/* Parsed Records Validation Bar & Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              {/* Filter Tabs and Count Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${filterTab === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    All Records ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('valid')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${filterTab === 'valid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-emerald-600 hover:text-emerald-800'
                      }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Valid ({validCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('errors')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${filterTab === 'errors' ? 'bg-white text-red-700 shadow-xs' : 'text-red-600 hover:text-red-800'
                      }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    Has Errors ({errorCount})
                  </button>
                </div>

                {errorCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Error Report ({errorCount})
                  </button>
                )}
              </div>

              {/* Data Preview Table */}
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Row</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Status</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Admission No</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Student Name</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Class & Section</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Roll No</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Parent & Phone</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Validation Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={`font-medium transition-colors ${row.isValid ? 'hover:bg-slate-50/80' : 'bg-red-50/40 hover:bg-red-50/80'
                          }`}
                      >
                        <td className="px-3 py-2 font-bold text-slate-400">
                          #{row.rowNumber}
                        </td>
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3 text-emerald-600" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3 text-red-600" /> {row.errors.length} Issue{row.errors.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-700">
                          {row.admission_number || <span className="text-red-500 italic">Missing</span>}
                        </td>
                        <td className="px-3 py-2 font-extrabold text-slate-800">
                          {row.student_name || <span className="text-red-500 italic">Missing</span>}
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100 text-[11px]">
                            {row.class || '?'}-{row.section || '?'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-600">
                          {row.roll_no || '-'}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          <div className="font-semibold text-slate-800">{row.guardian_name || '-'}</div>
                          <div className="text-[10px] font-mono text-slate-400">{row.guardian_phone || '-'}</div>
                          <div className="text-[9px] font-mono text-slate-400">{row.password ? 'Pwd: ••••••••' : 'Pwd: (default)'}</div>
                        </td>
                        <td className="px-3 py-2 max-w-xs">
                          {row.isValid ? (
                            <span className="text-emerald-600 font-semibold text-[11px]">Ready for import</span>
                          ) : (
                            <div className="space-y-0.5">
                              {row.errors.map((err, errIdx) => (
                                <div key={errIdx} className="text-red-600 text-[11px] leading-tight flex items-start gap-1">
                                  <span className="font-black text-red-700">•</span>
                                  <span>{err.message}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="pt-4 mt-auto border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {parsedRows.length > 0 && (
              <span>
                Ready to import <strong className="text-emerald-700 font-extrabold">{validCount}</strong> valid student{validCount !== 1 ? 's' : ''}
                {errorCount > 0 && <span className="text-red-600 font-bold"> ({errorCount} rows have validation issues)</span>}.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>

            {parsedRows.length > 0 && validCount > 0 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {loading ? 'Importing Students...' : `Import ${validCount} Student${validCount > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Confirmation Step Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Confirm Student Bulk Import</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You are about to import <strong className="text-slate-800 font-bold">{validCount} student records</strong> into the school management system.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Class and section records will be linked automatically.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Parent login credentials will be generated using phone numbers.</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-2 text-amber-700 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{errorCount} rows with errors will be skipped.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteImport}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                {loading ? 'Admitting Students...' : 'Yes, Import Students'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BulkStudentImportModal;
