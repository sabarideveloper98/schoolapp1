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
  UserCheck,
  Trash2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Check
} from 'lucide-react';
import { toast } from 'react-toastify';

// Complete list of all supported teacher fields with metadata
export const ALL_TEACHER_FIELDS = [
  { key: 'teacher_name', label: 'Teacher Name', required: true, example: 'Dr. Rajesh Sharma', note: 'Full name' },
  { key: 'email', label: 'Email Address', required: true, example: 'rajesh.teacher@school.com', note: 'Login email' },
  { key: 'mobile', label: 'Mobile Number', required: true, example: '9876543210', note: '10-digit number' },
  { key: 'password', label: 'Login Password', required: false, example: 'Teacher@123', note: 'Account password (default: 123456)' },
  { key: 'employee_id', label: 'Employee ID', required: false, example: 'SAMPLE-EMP-101', note: 'Staff code' },
  { key: 'qualification', label: 'Qualification', required: true, example: 'Ph.D in Physics', note: 'Degree / B.Ed' },
  { key: 'experience', label: 'Experience (Years)', required: false, example: '5', note: 'Years of experience' },
  { key: 'department', label: 'Department', required: false, example: 'Science', note: 'Department name' },
  { key: 'designation', label: 'Designation', required: false, example: 'Senior Teacher', note: 'Job title' },
  { key: 'gender', label: 'Gender', required: false, example: 'Male', note: 'Male / Female / Other' },
  { key: 'joining_date', label: 'Joining Date', required: false, example: '2022-06-01', note: 'YYYY-MM-DD' },
  { key: 'address', label: 'Address', required: true, example: '123 Academy Lane', note: 'Residential address' },
  { key: 'subjects', label: 'Subjects / Domains', required: false, example: 'Physics, Mathematics', note: 'Comma-separated subjects' }
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

// Standalone function to download Teacher sample template
export const downloadTeacherSampleCSV = () => {
  try {
    const headers = ALL_TEACHER_FIELDS.map(f => f.key).join(',');

    const sampleRowData = {
      teacher_name: 'Dr. Rajesh Sharma',
      email: 'rajesh.teacher@school.com',
      mobile: '9876543210',
      password: 'Teacher@123',
      employee_id: 'SAMPLE-EMP-101',
      qualification: 'Ph.D in Physics',
      experience: '5',
      department: 'Science',
      designation: 'Senior Teacher',
      gender: 'Male',
      joining_date: '2022-06-01',
      address: '123 Academy Lane',
      subjects: 'Physics, Mathematics'
    };

    // Correct column positions: map each field key directly to sampleRowData
    const sampleRow = ALL_TEACHER_FIELDS.map(f => escapeCSVCell(sampleRowData[f.key] ?? '')).join(',');

    // Exactly 2 rows: Header row + Sample data row (unwanted second row removed)
    const csvContent = `${headers}\n${sampleRow}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_teachers_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    toast.success('Sample teacher CSV template downloaded successfully');
  } catch (err) {
    console.error('Download teacher sample CSV error:', err);
    toast.error('Failed to download sample file: ' + err.message);
  }
};

const BulkTeacherImportModal = ({ isOpen, onClose, onSuccess }) => {
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
    downloadTeacherSampleCSV();
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
    if (['teachername', 'name', 'fullname', 'nameofteacher', 'teacher'].includes(clean)) return 'teacher_name';
    if (['email', 'emailaddress', 'mail'].includes(clean)) return 'email';
    if (['mobile', 'mobilenumber', 'phone', 'phonenumber', 'contact', 'contactnumber'].includes(clean)) return 'mobile';
    if (['password', 'loginpassword', 'login_password', 'pwd', 'userpassword'].includes(clean)) return 'password';
    if (['employeeid', 'empid', 'staffid', 'employeecode'].includes(clean)) return 'employee_id';
    if (['qualification', 'degree', 'qual'].includes(clean)) return 'qualification';
    if (['experience', 'exp', 'yearsofexperience'].includes(clean)) return 'experience';
    if (['department', 'dept'].includes(clean)) return 'department';
    if (['designation', 'desig', 'role', 'title'].includes(clean)) return 'designation';
    if (['gender', 'sex'].includes(clean)) return 'gender';
    if (['joiningdate', 'joindate', 'dateofjoining'].includes(clean)) return 'joining_date';
    if (['address', 'residentialaddress'].includes(clean)) return 'address';
    if (['subjects', 'domains', 'subject', 'subjectstaught'].includes(clean)) return 'subjects';
    return rawHeader.toLowerCase().trim().replace(/[\s"'.]/g, '_');
  };

  // Helper to validate and analyze each teacher row
  const validateTeacherRows = (rawRows) => {
    // Check duplicates within the file by email and mobile
    const emailMap = new Map();
    const phoneMap = new Map();
    rawRows.forEach((row) => {
      const em = String(row.email || '').trim().toLowerCase();
      if (em) {
        if (!emailMap.has(em)) emailMap.set(em, []);
        emailMap.get(em).push(row.rowNumber);
      }
      const ph = String(row.mobile || '').replace(/\D/g, '');
      if (ph) {
        if (!phoneMap.has(ph)) phoneMap.set(ph, []);
        phoneMap.get(ph).push(row.rowNumber);
      }
    });

    const validGenders = ['male', 'female', 'other'];

    return rawRows.map((row) => {
      const errors = [];

      // Required fields
      if (!row.teacher_name?.trim()) {
        errors.push({ field: 'teacher_name', message: 'Teacher name is mandatory' });
      }

      if (!row.email?.trim()) {
        errors.push({ field: 'email', message: 'Email address is mandatory' });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
        errors.push({ field: 'email', message: `Invalid email format "${row.email}"` });
      } else if (emailMap.get(row.email.trim().toLowerCase())?.length > 1) {
        const dups = emailMap.get(row.email.trim().toLowerCase());
        errors.push({ field: 'email', message: `Duplicate email found in file (rows ${dups.join(', ')})` });
      }

      if (!row.mobile?.trim()) {
        errors.push({ field: 'mobile', message: 'Mobile number is mandatory' });
      } else {
        const phoneDigits = String(row.mobile).replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
          errors.push({ field: 'mobile', message: `Mobile number must be exactly 10 digits (got "${row.mobile}")` });
        } else if (phoneMap.get(phoneDigits)?.length > 1) {
          const dups = phoneMap.get(phoneDigits);
          errors.push({ field: 'mobile', message: `Duplicate mobile found in file (rows ${dups.join(', ')})` });
        }
      }

      if (!row.qualification?.trim()) {
        errors.push({ field: 'qualification', message: 'Qualification is mandatory' });
      }

      if (!row.address?.trim()) {
        errors.push({ field: 'address', message: 'Address is mandatory' });
      }

      // Gender check
      if (row.gender?.trim() && !validGenders.includes(row.gender.trim().toLowerCase())) {
        errors.push({ field: 'gender', message: `Invalid gender "${row.gender}". Acceptable values: Male, Female, Other` });
      }

      // Joining date check
      if (row.joining_date?.trim() && isNaN(Date.parse(row.joining_date))) {
        errors.push({ field: 'joining_date', message: `Invalid joining date "${row.joining_date}". Expected YYYY-MM-DD` });
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
          if (rawLine.startsWith('#') || rawLine.startsWith('//')) {
            continue;
          }

          const values = parseCSVLine(lines[i]);
          const rowObj = { rowNumber: i + 1 };

          mappedHeaders.forEach((key, colIndex) => {
            rowObj[key] = values[colIndex] !== undefined ? values[colIndex] : '';
          });

          // Check if this row is a sample row
          const empStr = String(rowObj.employee_id || '').toUpperCase();
          const nameStr = String(rowObj.teacher_name || '').toUpperCase();
          if (
            empStr.startsWith('SAMPLE-') ||
            empStr.includes('SAMPLE') ||
            nameStr.startsWith('SAMPLE') ||
            nameStr.includes('[SAMPLE]')
          ) {
            sampleExcludedCount++;
            continue;
          }

          if (rowObj.teacher_name || rowObj.email || rowObj.mobile) {
            extractedRows.push(rowObj);
          }
        }

        setSampleRowsExcluded(sampleExcludedCount);

        if (extractedRows.length === 0) {
          toast.warning(
            sampleExcludedCount > 0
              ? `Only sample rows (${sampleExcludedCount}) were detected and excluded. Please add your real teacher records.`
              : 'No teacher data rows could be detected in this CSV file.'
          );
          setParsedRows([]);
        } else {
          const validated = validateTeacherRows(extractedRows);
          setParsedRows(validated);
          const validCount = validated.filter(r => r.isValid).length;
          const errorCount = validated.length - validCount;

          if (errorCount === 0) {
            toast.success(`Loaded ${validated.length} teacher records. All records passed validation!`);
          } else {
            toast.warning(`Loaded ${validated.length} teacher records (${validCount} valid, ${errorCount} with validation issues).`);
          }
        }
      } catch (err) {
        console.error('Teacher CSV parse error:', err);
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

  // Download Error Report
  const handleDownloadErrorReport = () => {
    const errorRows = parsedRows.filter(r => !r.isValid);
    if (errorRows.length === 0 && (!importResult || importResult.errors?.length === 0)) {
      return toast.info('No errors to download.');
    }

    const reportHeaders = 'Row Number,Teacher Name,Email,Mobile,Error Field,Error Reason\n';
    let reportContent = '';

    if (importResult?.errors && importResult.errors.length > 0) {
      importResult.errors.forEach((err) => {
        reportContent += [
          err.row || 'N/A',
          err.teacher_name || 'N/A',
          err.email || 'N/A',
          err.mobile || 'N/A',
          err.field || 'General',
          err.message || 'Import failed'
        ].map(escapeCSVCell).join(',') + '\n';
      });
    } else {
      errorRows.forEach((row) => {
        row.errors.forEach((err) => {
          reportContent += [
            row.rowNumber,
            row.teacher_name || 'N/A',
            row.email || 'N/A',
            row.mobile || 'N/A',
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
    link.setAttribute('download', `teacher_import_errors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Error report downloaded');
  };

  // Submit valid rows to backend
  const handleExecuteImport = async () => {
    setShowConfirmModal(false);
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      return toast.error('There are no valid teacher records to import. Please resolve the validation errors.');
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/schooladmin/teachers/bulk-import', {
        teachers: validRows
      }, config);

      setImportResult(data);
      if (data.count > 0) {
        toast.success(`Successfully imported ${data.count} teachers!`);
        if (onSuccess) onSuccess();
      } else {
        toast.error('Import completed but no teacher records were saved.');
      }
    } catch (error) {
      console.error('Bulk teacher import error:', error);
      toast.error(error.response?.data?.message || 'Failed to import teachers');
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const errorCount = parsedRows.length - validCount;

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
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Teacher Bulk Upload & Template
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">CSV</span>
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Download the official teacher onboarding template, fill in teacher profiles, and import in bulk.
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
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-100/60 px-2 py-0.5 rounded-md">
                    Step 1
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHelpAccordion(!showHelpAccordion)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHelpAccordion ? 'Hide Field Guide' : 'View Field Guide'}
                  </button>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mt-2">Download Sample Template</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Download the official CSV template with aligned columns for Teacher Name, Email, Contact, Qualifications, and Subjects.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="w-full px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-600 hover:text-indigo-700 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
                    ? `Loaded: ${fileName} (${parsedRows.length} teacher records detected)`
                    : 'Select your filled teacher CSV template from your computer to inspect and validate.'}
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
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Supported Teacher Columns
                </h4>
                <span className="text-[11px] text-slate-400 font-semibold">{ALL_TEACHER_FIELDS.length} Total Fields</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3 max-h-48 overflow-y-auto text-xs pr-1">
                {ALL_TEACHER_FIELDS.map(f => (
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
                  <span>Import Completed: {importResult.count} Teacher Records Successfully Created!</span>
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
                Teacher portal accounts have been registered using their email addresses. Default login password is: <code className="bg-white px-2 py-0.5 rounded text-emerald-800 font-mono font-bold border border-emerald-200">123456</code>.
              </p>
            </div>
          )}

          {/* Parsed Records Validation Bar & Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
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
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Teacher Name</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Emp ID</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Email & Mobile</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Qualification</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Subjects</th>
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
                        <td className="px-3 py-2 font-extrabold text-slate-800">
                          {row.teacher_name || <span className="text-red-500 italic">Missing</span>}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-indigo-600">
                          {row.employee_id || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-800">{row.email || <span className="text-red-500 italic">Missing</span>}</div>
                          <div className="text-[10px] font-mono text-slate-400">{row.mobile || '-'}</div>
                          <div className="text-[9px] font-mono text-slate-400">{row.password ? 'Pwd: ••••••••' : 'Pwd: (default)'}</div>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.qualification || '-'}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.subjects || 'General'}
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
                Ready to import <strong className="text-emerald-700 font-extrabold">{validCount}</strong> valid teacher{validCount !== 1 ? 's' : ''}
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
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {loading ? 'Importing Teachers...' : `Import ${validCount} Teacher${validCount > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Confirmation Step Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Confirm Teacher Bulk Import</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You are about to import <strong className="text-slate-800 font-bold">{validCount} teacher records</strong> into the school management system.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Teacher portal accounts will be registered with their emails.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Default password for new accounts will be set to 123456.</span>
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
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                {loading ? 'Importing...' : 'Yes, Import Teachers'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BulkTeacherImportModal;
