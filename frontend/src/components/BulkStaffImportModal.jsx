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
  RefreshCw,
  Check
} from 'lucide-react';
import { toast } from 'react-toastify';

// Complete list of all supported staff fields with metadata
export const ALL_STAFF_FIELDS = [
  { key: 'name', label: 'Staff Name', required: true, example: 'Kavitha Raman', note: 'Full name' },
  { key: 'role', label: 'Role / Designation', required: true, example: 'Office Staff', note: 'Driver, Peon, Security, Cleaner, Office Staff, Clerk, Other' },
  { key: 'email', label: 'Login Email', required: true, example: 'kavitha.staff@school.com', note: 'Login email address' },
  { key: 'phone', label: 'Mobile Number', required: true, example: '9876543210', note: '10-digit mobile number' },
  { key: 'password', label: 'Login Password', required: false, example: 'Staff@123', note: 'Account password (default: Staff@123 or 123456)' },
  { key: 'qualification', label: 'Qualification', required: false, example: 'B.Com / High School', note: 'Educational qualification' },
  { key: 'experience', label: 'Experience (Years)', required: false, example: '3', note: 'Years of work experience' },
  { key: 'address', label: 'Residential Address', required: false, example: '45 Lake View Road, Chennai', note: 'Current residential address' }
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

// Standalone function to download Staff sample template
export const downloadStaffSampleCSV = () => {
  try {
    const headers = ALL_STAFF_FIELDS.map(f => f.key).join(',');

    const sampleRowData = {
      name: 'Kavitha Raman',
      role: 'Office Staff',
      email: 'kavitha.staff@school.com',
      phone: '9876543210',
      password: 'Staff@123',
      qualification: 'B.Com / High School',
      experience: '3',
      address: '45 Lake View Road, Chennai'
    };

    // Correct column positions: map each field key directly to sampleRowData
    const sampleRow = ALL_STAFF_FIELDS.map(f => escapeCSVCell(sampleRowData[f.key] ?? '')).join(',');

    // Exactly 2 rows: Header row + Sample data row (unwanted second row removed)
    const csvContent = `${headers}\n${sampleRow}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_staff_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    toast.success('Sample staff CSV template downloaded successfully');
  } catch (err) {
    console.error('Download staff sample CSV error:', err);
    toast.error('Failed to download sample file: ' + err.message);
  }
};

const BulkStaffImportModal = ({ isOpen, onClose, onSuccess }) => {
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
    downloadStaffSampleCSV();
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
    if (['staffname', 'name', 'fullname', 'nameofstaff', 'staff'].includes(clean)) return 'name';
    if (['role', 'designation', 'jobtitle', 'post', 'staffrole'].includes(clean)) return 'role';
    if (['email', 'emailaddress', 'mail', 'loginemail', 'login_email'].includes(clean)) return 'email';
    if (['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'contactnumber', 'loginphone'].includes(clean)) return 'phone';
    if (['password', 'loginpassword', 'login_password', 'pwd', 'userpassword'].includes(clean)) return 'password';
    if (['qualification', 'degree', 'qual'].includes(clean)) return 'qualification';
    if (['experience', 'exp', 'yearsofexperience'].includes(clean)) return 'experience';
    if (['address', 'residentialaddress'].includes(clean)) return 'address';
    return rawHeader.toLowerCase().trim().replace(/[\s"'.]/g, '_');
  };

  // Helper to validate and analyze each staff row
  const validateStaffRows = (rawRows) => {
    // Check duplicates within the file by email and phone
    const emailMap = new Map();
    const phoneMap = new Map();
    rawRows.forEach((row) => {
      const em = String(row.email || '').trim().toLowerCase();
      if (em) {
        if (!emailMap.has(em)) emailMap.set(em, []);
        emailMap.get(em).push(row.rowNumber);
      }
      const ph = String(row.phone || row.mobile || '').replace(/\D/g, '');
      if (ph) {
        if (!phoneMap.has(ph)) phoneMap.set(ph, []);
        phoneMap.get(ph).push(row.rowNumber);
      }
    });

    return rawRows.map((row) => {
      const errors = [];

      // Required fields
      if (!row.name?.trim()) {
        errors.push({ field: 'name', message: 'Staff name is mandatory' });
      }

      if (!row.role?.trim()) {
        errors.push({ field: 'role', message: 'Role / Designation is mandatory' });
      }

      // Email validation
      if (!row.email?.trim()) {
        errors.push({ field: 'email', message: 'Email address is required for staff login' });
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email.trim())) {
          errors.push({ field: 'email', message: `Invalid email format "${row.email}"` });
        } else {
          const emKey = row.email.trim().toLowerCase();
          const rowsWithSameEmail = emailMap.get(emKey) || [];
          if (rowsWithSameEmail.length > 1) {
            errors.push({ 
              field: 'email', 
              message: `Duplicate email "${row.email}" found on rows: ${rowsWithSameEmail.join(', ')}` 
            });
          }
        }
      }

      // Phone validation
      if (!row.phone?.trim()) {
        errors.push({ field: 'phone', message: 'Mobile number is mandatory' });
      } else {
        const digits = row.phone.replace(/\D/g, '');
        if (digits.length !== 10) {
          errors.push({ field: 'phone', message: `Mobile must be 10 digits (got "${row.phone}")` });
        } else {
          const rowsWithSamePhone = phoneMap.get(digits) || [];
          if (rowsWithSamePhone.length > 1) {
            errors.push({ 
              field: 'phone', 
              message: `Duplicate mobile "${row.phone}" found on rows: ${rowsWithSamePhone.join(', ')}` 
            });
          }
        }
      }

      // Experience check
      if (row.experience && isNaN(Number(row.experience))) {
        errors.push({ field: 'experience', message: `Experience must be a number (got "${row.experience}")` });
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
          const nameStr = String(rowObj.name || '').toUpperCase();
          const emailStr = String(rowObj.email || '').toUpperCase();
          if (
            nameStr.startsWith('SAMPLE-') ||
            emailStr.includes('SAMPLE@') ||
            nameStr.includes('KAVITHA RAMAN')
          ) {
            sampleExcludedCount++;
            continue;
          }

          // Check if row is entirely empty
          const hasAnyValue = Object.keys(rowObj).some(k => k !== 'rowNumber' && rowObj[k]?.trim() !== '');
          if (!hasAnyValue) continue;

          extractedRows.push(rowObj);
        }

        setSampleRowsExcluded(sampleExcludedCount);

        if (extractedRows.length === 0) {
          if (sampleExcludedCount > 0) {
            toast.warn('The file only contains the sample example row. Please add actual staff records to import.');
          } else {
            toast.error('No staff records found in the CSV file.');
          }
          setParsedRows([]);
          return;
        }

        const validated = validateStaffRows(extractedRows);
        setParsedRows(validated);
        toast.info(`Parsed ${validated.length} staff records (${validated.filter(r => r.isValid).length} valid).`);
      } catch (err) {
        console.error('Error parsing staff CSV:', err);
        toast.error('Failed to parse CSV file: ' + err.message);
        setParsedRows([]);
      }
    };

    reader.readAsText(file);
  };

  // Clear / remove loaded file
  const handleClearFile = () => {
    setFileName('');
    setFileSize(0);
    setParsedRows([]);
    setSampleRowsExcluded(0);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download error report as CSV
  const handleDownloadErrorReport = () => {
    const errorRows = parsedRows.filter(r => !r.isValid);
    if (errorRows.length === 0 && (!importResult?.errors || importResult.errors.length === 0)) {
      return toast.info('No errors to download.');
    }

    const reportHeaders = 'Row Number,Staff Name,Email,Mobile,Error Field,Error Message\n';
    let reportContent = '';

    if (importResult?.errors && importResult.errors.length > 0) {
      importResult.errors.forEach((err) => {
        reportContent += [
          err.row || 'N/A',
          err.name || 'N/A',
          err.email || 'N/A',
          err.phone || 'N/A',
          err.field || 'General',
          err.message || 'Import failed'
        ].map(escapeCSVCell).join(',') + '\n';
      });
    } else {
      errorRows.forEach((row) => {
        row.errors.forEach((err) => {
          reportContent += [
            row.rowNumber,
            row.name || 'N/A',
            row.email || 'N/A',
            row.phone || 'N/A',
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
    link.setAttribute('download', `staff_import_errors_${new Date().toISOString().split('T')[0]}.csv`);
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
      return toast.error('There are no valid staff records to import. Please resolve the validation errors.');
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/schooladmin/staff/bulk-import', {
        staff: validRows
      }, config);

      setImportResult(data);
      if (data.count > 0) {
        toast.success(`Successfully imported ${data.count} staff members!`);
        if (onSuccess) onSuccess();
      } else {
        toast.error('Import completed but no staff records were saved.');
      }
    } catch (error) {
      console.error('Bulk staff import error:', error);
      toast.error(error.response?.data?.message || 'Failed to import staff');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Bulk Import Staff</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Quickly onboard multiple staff members (Drivers, Peons, Clerks, Security, etc.) with login credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top Action & Instructions Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Step 1: Download Sample File */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/40 border border-indigo-100/80 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[10px] uppercase tracking-wider mb-2">
                  Step 1
                </div>
                <h4 className="text-sm font-black text-slate-800 mb-1">Download Sample Template</h4>
                <p className="text-xs font-medium text-slate-500">
                  Pre-configured CSV template with exactly 2 rows (Headers + Sample Data) and aligned login fields.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <Download className="w-4 h-4" /> Download Sample CSV
              </button>
            </div>

            {/* Step 2: Upload CSV File */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/20 border border-slate-200/80 flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
                    Step 2
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHelpAccordion(!showHelpAccordion)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHelpAccordion ? 'Hide Field List' : 'View Supported Fields'}
                  </button>
                </div>
                <h4 className="text-sm font-black text-slate-800 mb-1">Select Completed Staff CSV File</h4>
                <p className="text-xs font-medium text-slate-500">
                  Upload standard comma-delimited (.csv) file. Header names are automatically matched.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="bulk-staff-file-input"
                />
                <label
                  htmlFor="bulk-staff-file-input"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-98"
                >
                  <Upload className="w-4 h-4" />
                  {fileName ? 'Choose Another File' : 'Select CSV File'}
                </label>

                {fileName && (
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="py-2.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Remove selected file"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Collapsible Supported Fields Guide */}
          {showHelpAccordion && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Supported Staff Columns
                </h4>
                <span className="text-[11px] text-slate-400 font-semibold">{ALL_STAFF_FIELDS.length} Total Fields</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-3 max-h-48 overflow-y-auto text-xs pr-1">
                {ALL_STAFF_FIELDS.map(f => (
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
                Detected and automatically excluded {sampleRowsExcluded} sample example row{sampleRowsExcluded > 1 ? 's' : ''}.
              </span>
            </div>
          )}

          {/* Import Results Summary Banner */}
          {importResult && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Import Completed: {importResult.count} Staff Records Successfully Created!</span>
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
                Staff login accounts have been configured using their email addresses. Password specified in the file or standard default was applied.
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
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      filterTab === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Records ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('valid')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                      filterTab === 'valid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-emerald-600 hover:text-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Valid ({validCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('errors')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                      filterTab === 'errors' ? 'bg-white text-red-700 shadow-xs' : 'text-red-600 hover:text-red-800'
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
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Staff Name</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Role / Designation</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Email & Mobile & Pwd</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Qualification</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Experience</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Validation Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRows.map((row) => (
                      <tr 
                        key={row.rowNumber} 
                        className={`font-medium transition-colors ${
                          row.isValid ? 'hover:bg-slate-50/80' : 'bg-red-50/40 hover:bg-red-50/80'
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
                          {row.name || <span className="text-red-500 italic">Missing</span>}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {row.role || 'Staff'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-800">{row.email || <span className="text-red-500 italic">Missing</span>}</div>
                          <div className="text-[10px] font-mono text-slate-400">{row.phone || row.mobile || '-'}</div>
                          <div className="text-[9px] font-mono text-slate-400">{row.password ? 'Pwd: ••••••••' : 'Pwd: (default)'}</div>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.qualification || '-'}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.experience ? `${row.experience} yrs` : '-'}
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

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            {parsedRows.length > 0 ? (
              <span>
                <strong className="text-slate-800">{validCount}</strong> ready to import out of{' '}
                <strong className="text-slate-800">{parsedRows.length}</strong> total records
              </span>
            ) : (
              <span>No file loaded yet</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || validCount === 0}
              onClick={() => setShowConfirmModal(true)}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import {validCount} Staff Record{validCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4 border border-slate-100">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="text-base font-black text-slate-800">Confirm Staff Bulk Import</h4>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              You are about to import <strong className="text-slate-800">{validCount}</strong> valid staff records into the system. Login accounts with email credentials will be provisioned automatically.
              {errorCount > 0 && (
                <span className="block mt-2 text-amber-700 bg-amber-50 p-2 rounded-lg font-bold">
                  Note: {errorCount} invalid rows with errors will be skipped.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                Proceed with Import
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BulkStaffImportModal;
