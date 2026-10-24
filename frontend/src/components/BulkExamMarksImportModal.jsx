import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Award,
  Trash2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Check
} from 'lucide-react';
import { toast } from 'react-toastify';
import SearchableSelect from './SearchableSelect';

// Complete list of all supported exam marks fields
export const ALL_MARKS_FIELDS = [
  { key: 'roll_no', label: 'Roll Number', required: true, example: '101', note: 'Student roll number' },
  { key: 'admission_number', label: 'Admission Number', required: true, example: 'SAMPLE-ADM-101', note: 'Student admission number' },
  { key: 'student_name', label: 'Student Name', required: true, example: 'Alex Smith', note: 'Student name' },
  { key: 'marks_obtained', label: 'Marks Obtained', required: true, example: '85', note: 'Score secured' },
  { key: 'max_marks', label: 'Maximum Marks', required: true, example: '100', note: 'Total maximum marks' },
  { key: 'remarks', label: 'Remarks', required: false, example: 'Good performance', note: 'Optional teacher feedback' }
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

// Standalone function to download Exam Marks sample template
export const downloadExamMarksSampleCSV = () => {
  try {
    const headers = ALL_MARKS_FIELDS.map(f => f.key).join(',');

    const sampleRowData = {
      roll_no: '101',
      admission_number: 'SAMPLE-ADM-101',
      student_name: 'Alex Smith',
      marks_obtained: '85',
      max_marks: '100',
      remarks: 'Good performance'
    };

    // Correct column positions: map each field key directly to sampleRowData
    const sampleRow = ALL_MARKS_FIELDS.map(f => escapeCSVCell(sampleRowData[f.key] ?? '')).join(',');

    // Exactly 2 rows: Header row + Sample data row (unwanted second row removed)
    const csvContent = `${headers}\n${sampleRow}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_exam_marks_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    toast.success('Sample Exam Marks CSV template downloaded successfully');
  } catch (err) {
    console.error('Download exam marks sample CSV error:', err);
    toast.error('Failed to download sample file: ' + err.message);
  }
};

const BulkExamMarksImportModal = ({ isOpen, onClose, onSuccess, exams = [], classes = [], subjects = [] }) => {
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);

  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [parsedRows, setParsedRows] = useState([]);
  const [sampleRowsExcluded, setSampleRowsExcluded] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'valid' | 'errors'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHelpAccordion, setShowHelpAccordion] = useState(false);

  useEffect(() => {
    if (exams.length > 0 && !selectedExam) setSelectedExam(exams[0]._id);
    if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]._id);
    if (subjects.length > 0 && !selectedSubject) setSelectedSubject(subjects[0]._id);
  }, [exams, classes, subjects, selectedExam, selectedClass, selectedSubject]);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    downloadExamMarksSampleCSV();
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
    if (['rollno', 'rollnumber', 'roll'].includes(clean)) return 'roll_no';
    if (['admissionnumber', 'admissionno', 'admno', 'adm', 'admnumber'].includes(clean)) return 'admission_number';
    if (['studentname', 'name', 'student', 'fullname'].includes(clean)) return 'student_name';
    if (['marksobtained', 'marks', 'mark', 'score', 'obtained', 'obtainedmarks'].includes(clean)) return 'marks_obtained';
    if (['maxmarks', 'maxmark', 'totalmarks', 'totalmark', 'maximummarks', 'max', 'total'].includes(clean)) return 'max_marks';
    if (['remarks', 'remark', 'comments', 'comment', 'feedback', 'notes', 'note'].includes(clean)) return 'remarks';
    return rawHeader.toLowerCase().trim().replace(/[\s"'.]/g, '_');
  };

  // Validate student marks rows
  const validateMarksRows = (rawRows) => {
    const studentIdentifierMap = new Map();

    rawRows.forEach((row) => {
      const idKey = (row.admission_number || row.roll_no || row.student_name || '').trim().toLowerCase();
      if (idKey) {
        if (!studentIdentifierMap.has(idKey)) studentIdentifierMap.set(idKey, []);
        studentIdentifierMap.get(idKey).push(row.rowNumber);
      }
    });

    return rawRows.map((row) => {
      const errors = [];

      // Student identification check
      if (!row.roll_no?.trim() && !row.admission_number?.trim() && !row.student_name?.trim()) {
        errors.push({ field: 'student', message: 'Roll Number or Admission Number is required to identify the student' });
      }

      // Check duplicate student entries in the same file
      const idKey = (row.admission_number || row.roll_no || row.student_name || '').trim().toLowerCase();
      if (idKey && studentIdentifierMap.get(idKey)?.length > 1) {
        const dups = studentIdentifierMap.get(idKey);
        errors.push({ field: 'student', message: `Duplicate student mark entry found in file (rows ${dups.join(', ')})` });
      }

      // Marks obtained validation
      const marksVal = Number(row.marks_obtained);
      if (row.marks_obtained === undefined || row.marks_obtained === '' || isNaN(marksVal)) {
        errors.push({ field: 'marks_obtained', message: 'Marks Obtained must be a valid number' });
      } else if (marksVal < 0) {
        errors.push({ field: 'marks_obtained', message: 'Marks Obtained cannot be negative' });
      }

      // Max marks validation
      const maxVal = row.max_marks !== undefined && row.max_marks !== '' ? Number(row.max_marks) : 100;
      if (isNaN(maxVal) || maxVal <= 0) {
        errors.push({ field: 'max_marks', message: 'Maximum Marks must be greater than 0' });
      } else if (!isNaN(marksVal) && marksVal > maxVal) {
        errors.push({ field: 'marks_obtained', message: `Marks obtained (${marksVal}) exceeds maximum marks (${maxVal})` });
      }

      return {
        ...row,
        max_marks: isNaN(maxVal) ? 100 : maxVal,
        marks_obtained: isNaN(marksVal) ? 0 : marksVal,
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

          if (rowObj.roll_no || rowObj.admission_number || rowObj.student_name || rowObj.marks_obtained !== '') {
            extractedRows.push(rowObj);
          }
        }

        setSampleRowsExcluded(sampleExcludedCount);

        if (extractedRows.length === 0) {
          toast.warning(
            sampleExcludedCount > 0 
              ? `Only sample rows (${sampleExcludedCount}) were detected and excluded. Please add your real student mark records.`
              : 'No student mark entries could be detected in this CSV file.'
          );
          setParsedRows([]);
        } else {
          const validated = validateMarksRows(extractedRows);
          setParsedRows(validated);
          const validCount = validated.filter(r => r.isValid).length;
          const errorCount = validated.length - validCount;

          if (errorCount === 0) {
            toast.success(`Loaded ${validated.length} student mark entries. All records passed validation!`);
          } else {
            toast.warning(`Loaded ${validated.length} student mark entries (${validCount} valid, ${errorCount} with validation issues).`);
          }
        }
      } catch (err) {
        console.error('Marks CSV parse error:', err);
        toast.error('Failed to parse CSV file. Please verify file integrity.');
      }
    };

    reader.readAsText(file);
  };

  // Clear selected file
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

    const reportHeaders = 'Row Number,Roll No,Admission Number,Student Name,Marks Obtained,Max Marks,Error Reason\n';
    let reportContent = '';

    if (importResult?.errors && importResult.errors.length > 0) {
      importResult.errors.forEach((err) => {
        reportContent += [
          err.row || 'N/A',
          err.roll_no || 'N/A',
          err.admission_number || 'N/A',
          err.student_name || 'N/A',
          'N/A',
          'N/A',
          err.message || 'Import failed'
        ].map(escapeCSVCell).join(',') + '\n';
      });
    } else {
      errorRows.forEach((row) => {
        row.errors.forEach((err) => {
          reportContent += [
            row.rowNumber,
            row.roll_no || 'N/A',
            row.admission_number || 'N/A',
            row.student_name || 'N/A',
            row.marks_obtained,
            row.max_marks,
            err.message
          ].map(escapeCSVCell).join(',') + '\n';
        });
      });
    }

    const blob = new Blob([reportHeaders + reportContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `marks_import_errors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Error report downloaded');
  };

  // Submit valid marks to backend
  const handleExecuteImport = async () => {
    setShowConfirmModal(false);
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      return toast.error('No valid marks data to import. Please resolve the validation issues.');
    }
    if (!selectedExam || !selectedClass) {
      return toast.error('Please select Exam and Class');
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const endpoint = user.role === 'Teacher' ? '/api/teacher/marks/bulk-import' : '/api/schooladmin/exam-marks/bulk-import';
      
      const { data } = await axios.post(endpoint, {
        exam_id: selectedExam,
        class_id: selectedClass,
        subject_id: selectedSubject || undefined,
        marks_data: validRows
      }, config);

      setImportResult(data);
      if (data.count > 0) {
        toast.success(data.message || `Successfully imported exam marks for ${data.count} students!`);
        if (onSuccess) onSuccess();
      } else {
        toast.error('Import completed but no exam marks were saved.');
      }
    } catch (error) {
      console.error('Marks bulk import error:', error);
      toast.error(error.response?.data?.message || 'Failed to import exam marks');
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
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Exam Marks Bulk Import & Template
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">CSV</span>
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Upload student marks in bulk matching Roll Numbers or Admission Numbers.
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
          
          {/* Target Exam, Class & Subject Selectors */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
              Target Assessment Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Target Exam *</label>
                <SearchableSelect
                  options={exams.map(e => ({ value: e._id, label: e.name }))}
                  value={selectedExam}
                  onChange={(val) => setSelectedExam(val)}
                  placeholder="Select Exam"
                  searchPlaceholder="Search exam..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Target Class *</label>
                <SearchableSelect
                  options={classes.map(c => ({ value: c._id, label: `${c.class} - ${c.section}` }))}
                  value={selectedClass}
                  onChange={(val) => setSelectedClass(val)}
                  placeholder="Select Class & Section"
                  searchPlaceholder="Search class..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Subject (Optional if specified in file)</label>
                <SearchableSelect
                  options={subjects.map(s => ({ value: s._id, label: s.name }))}
                  value={selectedSubject}
                  onChange={(val) => setSelectedSubject(val)}
                  placeholder="Select Subject"
                  searchPlaceholder="Search subject..."
                />
              </div>
            </div>
          </div>

          {/* Step 1 & 2 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Step 1: Download Sample File */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider bg-emerald-100/60 px-2 py-0.5 rounded-md">
                    Step 1
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHelpAccordion(!showHelpAccordion)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHelpAccordion ? 'Hide Field Guide' : 'View Field Guide'}
                  </button>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mt-2">Download Sample Template</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Download the official marks CSV template with aligned columns for Roll No, Admission No, Marks, Max Marks, and Remarks.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="w-full px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-600 hover:text-emerald-700 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" /> Download Sample File (.csv)
                </button>
              </div>
            </div>

            {/* Step 2: Upload Completed File */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider bg-emerald-100/60 px-2 py-0.5 rounded-md">
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
                    ? `Loaded: ${fileName} (${parsedRows.length} student marks detected)` 
                    : 'Select your completed marks CSV file from your computer to inspect and validate.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                {fileName ? (
                  <div className="flex items-center gap-2 w-full">
                    <label className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
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
                  <label className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg">
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
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Supported Marks Columns
                </h4>
                <span className="text-[11px] text-slate-400 font-semibold">{ALL_MARKS_FIELDS.length} Total Columns</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3 max-h-48 overflow-y-auto text-xs pr-1">
                {ALL_MARKS_FIELDS.map(f => (
                  <div key={f.key} className="p-2 bg-white rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">{f.label}</span>
                      {f.required ? (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Required</span>
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
                  <span>Import Completed: {importResult.count} Student Marks Successfully Saved!</span>
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
                Student exam report cards and class marks registers have been updated.
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
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Roll No</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Admission No</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Student Name</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Marks Obtained</th>
                      <th className="px-3 py-2.5 text-left font-bold text-slate-500">Max Marks</th>
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
                        <td className="px-3 py-2 font-bold text-slate-700">
                          {row.roll_no || '-'}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700">
                          {row.admission_number || '-'}
                        </td>
                        <td className="px-3 py-2 font-extrabold text-slate-800">
                          {row.student_name || '-'}
                        </td>
                        <td className="px-3 py-2 font-bold text-indigo-700">
                          {row.marks_obtained}
                        </td>
                        <td className="px-3 py-2 text-slate-500 font-semibold">
                          {row.max_marks}
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
                Ready to import <strong className="text-emerald-700 font-extrabold">{validCount}</strong> valid student mark entry{validCount !== 1 ? 'ies' : ''} 
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
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {loading ? 'Importing Marks...' : `Import ${validCount} Marks Now`}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Confirmation Step Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Confirm Marks Bulk Import</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You are about to save <strong className="text-slate-800 font-bold">{validCount} student mark entries</strong> for the selected Exam and Class.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Existing student scores for this subject will be updated.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Student rank registers and analytics will be refreshed.</span>
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
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                {loading ? 'Saving Marks...' : 'Yes, Import Marks'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BulkExamMarksImportModal;
