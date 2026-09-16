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
    const csvHeader = 'student_name,class,section,roll_no,gender,group,blood_group,religion,admission_number,registration_no,address,guardian_name,guardian_phone,guardian_email,guardian_relation\n';
    const sampleRow1 = 'Alex Smith,10,A,101,Male,Science,O+,Islam,ADM101,REG101,123 Main St,Robert Smith,9876543210,robert@gmail.com,Father\n';
    const sampleRow2 = 'Emma Johnson,10,B,102,Female,Commerce,A+,Christianity,ADM102,REG102,456 Park Ave,Sarah Johnson,9876543211,sarah@gmail.com,Mother\n';
    
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

  // Helper to parse CSV text into objects
  const parseCSV = (csvText) => {
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s"']/g, '_'));
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      // Regex to handle comma separated values with optional quotes
      const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

      const row = {};
      headers.forEach((h, index) => {
        let val = cleanValues[index] || '';
        if (h.includes('name') && (h.includes('student') || h === 'name' || h === 'full_name')) row['student_name'] = val;
        else if (h.includes('class') || h === 'std' || h === 'standard') row['class'] = val;
        else if (h.includes('sec')) row['section'] = val;
        else if (h.includes('roll')) row['roll_no'] = val;
        else if (h.includes('gender')) row['gender'] = val;
        else if (h.includes('group')) row['group'] = val;
        else if (h.includes('blood')) row['blood_group'] = val;
        else if (h.includes('relig')) row['religion'] = val;
        else if (h.includes('adm')) row['admission_number'] = val;
        else if (h.includes('reg')) row['registration_no'] = val;
        else if (h.includes('address')) row['address'] = val;
        else if (h.includes('parent_name') || h.includes('guardian_name')) row['guardian_name'] = val;
        else if (h.includes('parent_phone') || h.includes('guardian_phone') || h === 'phone' || h === 'mobile') row['guardian_phone'] = val;
        else if (h.includes('parent_email') || h.includes('guardian_email') || h === 'email') row['guardian_email'] = val;
        else if (h.includes('relation')) row['guardian_relation'] = val;
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
