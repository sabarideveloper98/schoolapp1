import { useState } from 'react';
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
  FileText 
} from 'lucide-react';
import { toast } from 'react-toastify';

const BulkStudentImportModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  // Download Sample CSV template
  const handleDownloadSample = () => {
    const csvHeader = 'student_name,class,section,roll_no,gender,date_of_birth,admission_date,academic_year,admission_number,student_status,guardian_name,guardian_relation,guardian_phone,guardian_email,address_line,city,state,pincode,blood_group,religion\n';
    const sampleRow1 = 'Alex Smith,10,A,101,Male,2010-05-15,2025-06-01,2025-2026,ADM101,Active,Robert Smith,Father,9876543210,robert@gmail.com,123 Main St,Chennai,Tamil Nadu,600001,O+,General\n';
    const sampleRow2 = 'Emma Johnson,10,B,102,Female,2010-08-20,2025-06-01,2025-2026,ADM102,Active,Sarah Johnson,Mother,9876543211,sarah@gmail.com,456 Park Ave,Coimbatore,Tamil Nadu,641001,A+,General\n';
    
    const blob = new Blob([csvHeader + sampleRow1 + sampleRow2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_students_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV template downloaded');
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

  // Helper to parse CSV text into objects
  const parseCSV = (csvText) => {
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[\s"'.]/g, '_'));
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const cleanValues = parseCSVLine(lines[i]);

      const row = {};
      headers.forEach((h, index) => {
        let val = cleanValues[index] !== undefined ? cleanValues[index] : '';
        if (h.includes('name') && (h.includes('student') || h === 'name' || h === 'full_name')) row['student_name'] = val;
        else if (h.includes('class') || h === 'std' || h === 'standard') row['class'] = val;
        else if (h.includes('sec')) row['section'] = val;
        else if (h.includes('roll')) row['roll_no'] = val;
        else if (h.includes('gender') || h === 'sex') row['gender'] = val;
        else if (h.includes('birth') || h === 'dob') { row['date_of_birth'] = val; row['dob'] = val; }
        else if (h.includes('adm_date') || h.includes('admission_date')) row['admission_date'] = val;
        else if (h.includes('academic') || h.includes('year')) row['academic_year'] = val;
        else if (h.includes('status')) row['student_status'] = val;
        else if (h.includes('group') || h.includes('stream')) { row['group'] = val; row['stream_group'] = val; }
        else if (h.includes('blood')) row['blood_group'] = val;
        else if (h.includes('relig')) row['religion'] = val;
        else if (h.includes('adm')) row['admission_number'] = val;
        else if (h.includes('reg')) row['registration_no'] = val;
        else if (h.includes('address_line') || h === 'street') row['address_line'] = val;
        else if (h.includes('address')) { row['address'] = val; if (!row['address_line']) row['address_line'] = val; }
        else if (h === 'city') row['city'] = val;
        else if (h === 'state') row['state'] = val;
        else if (h.includes('pin') || h.includes('zip')) row['pincode'] = val;
        else if (h.includes('dist')) row['district'] = val;
        else if (h.includes('parent_name') || h.includes('guardian_name')) { row['guardian_name'] = val; row['parent_name'] = val; }
        else if (h.includes('parent_phone') || h.includes('guardian_phone') || h === 'phone' || h === 'mobile') { row['guardian_phone'] = val; row['parent_phone'] = val; }
        else if (h.includes('parent_email') || h.includes('guardian_email') || h === 'email') { row['guardian_email'] = val; row['parent_email'] = val; }
        else if (h.includes('relation')) row['guardian_relation'] = val;
        else if (h.includes('father')) row['father_name'] = val;
        else if (h.includes('mother')) row['mother_name'] = val;
        else if (h.includes('apaar')) row['apaar_id'] = val;
        else if (h.includes('pen')) row['pen_number'] = val;
        else if (h.includes('emis')) row['emis_id'] = val;
        else if (h.includes('aadhaar')) row['aadhaar_last4'] = val;
        else row[h] = val;
      });

      if (row.student_name || row.first_name) {
        results.push(row);
      }
    }
    return results;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const data = parseCSV(text);
        if (data.length === 0) {
          toast.error('No valid student rows found in the CSV file');
        } else {
          setParsedData(data);
          toast.success(`Parsed ${data.length} student records from CSV`);
        }
      } catch (err) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedData.length === 0) return toast.error('No data to import');
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/schooladmin/students/bulk-import', {
        students: parsedData
      }, config);

      setImportResult(data);
      toast.success(data.message || 'Students imported successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Bulk Student Import</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Upload CSV file to import multiple students with class, section & parent details.</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls: Download Template & File Upload */}
        <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Step 1</span>
              <h3 className="font-extrabold text-slate-800 text-sm mt-1">Download CSV Template</h3>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                Use our pre-formatted CSV template with pre-filled headers for Class, Section, Parent & Contact info.
              </p>
            </div>
            <button
              onClick={handleDownloadSample}
              className="mt-4 px-4 py-2.5 rounded-xl bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" /> Download Sample CSV
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Step 2</span>
              <h3 className="font-extrabold text-slate-800 text-sm mt-1">Upload CSV File</h3>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                {fileName ? `Loaded: ${fileName}` : 'Select your completed CSV file from your computer.'}
              </p>
            </div>
            <label className="mt-4 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md">
              <Upload className="w-4 h-4" /> {fileName ? 'Change CSV File' : 'Browse CSV File'}
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>
        </div>

        {/* Import Results Banner */}
        {importResult && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Successfully imported {importResult.count} students! Default Parent Login Password is set to <code className="bg-white px-2 py-0.5 rounded text-emerald-700 border border-emerald-200 font-mono">123456</code>.</span>
            </div>
          </div>
        )}

        {/* Live Parsed Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Preview Student Data ({parsedData.length} Records)
              </h3>
              <span className="text-xs font-semibold text-slate-400">Review before importing</span>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-100 bg-white">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">#</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Student Name</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Class & Section</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Roll No</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Gender / Group</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Parent Name</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Parent Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 font-medium">
                      <td className="px-4 py-2.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-extrabold text-slate-800">{row.student_name || 'N/A'}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                          Class {row.class || '-'} ({row.section || 'A'})
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-600">{row.roll_no || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{row.gender || 'Male'} / {row.group || 'Science'}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{row.guardian_name || 'N/A'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{row.guardian_phone || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>

          {parsedData.length > 0 && (
            <button
              type="button"
              disabled={loading}
              onClick={handleImportSubmit}
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> {loading ? 'Importing Students...' : `Import ${parsedData.length} Students Now`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkStudentImportModal;
