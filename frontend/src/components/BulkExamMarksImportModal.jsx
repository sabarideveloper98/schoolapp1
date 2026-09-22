import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  Award 
} from 'lucide-react';
import { toast } from 'react-toastify';

const BulkExamMarksImportModal = ({ isOpen, onClose, onSuccess, exams = [], classes = [], subjects = [] }) => {
  const { user } = useAuthStore();
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    if (exams.length > 0 && !selectedExam) setSelectedExam(exams[0]._id);
    if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]._id);
    if (subjects.length > 0 && !selectedSubject) setSelectedSubject(subjects[0]._id);
  }, [exams, classes, subjects]);

  if (!isOpen) return null;

  // Download Sample CSV template for Exam Marks
  const handleDownloadSample = () => {
    const csvHeader = 'roll_no,admission_number,student_name,marks_obtained,max_marks,remarks\n';
    const sampleRow1 = '101,ADM101,Alex Smith,85,100,Excellent performance\n';
    const sampleRow2 = '102,ADM102,Emma Johnson,92,100,Top scorer\n';
    const sampleRow3 = '103,ADM103,Michael Brown,68,100,Needs improvement in algebra\n';
    
    const blob = new Blob([csvHeader + sampleRow1 + sampleRow2 + sampleRow3], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_exam_marks_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample Exam Marks CSV template downloaded');
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s"']/g, '_'));
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

      const row = {};
      headers.forEach((h, index) => {
        let val = cleanValues[index] || '';
        if (h.includes('roll')) row['roll_no'] = val;
        else if (h.includes('adm')) row['admission_number'] = val;
        else if (h.includes('name') || h.includes('student')) row['student_name'] = val;
        else if (h.includes('mark') || h.includes('obtained') || h === 'score') row['marks_obtained'] = Number(val) || 0;
        else if (h.includes('max') || h.includes('total')) row['max_marks'] = Number(val) || 100;
        else if (h.includes('remark') || h.includes('note')) row['remarks'] = val;
        else row[h] = val;
      });

      if (row.roll_no || row.admission_number || row.student_name) {
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
          toast.error('No valid exam marks rows found in the CSV file');
        } else {
          setParsedData(data);
          toast.success(`Parsed ${data.length} student mark entries from CSV`);
        }
      } catch (err) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedData.length === 0) return toast.error('No data to import');
    if (!selectedExam || !selectedClass) return toast.error('Please select Exam and Class');

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const endpoint = user.role === 'Teacher' ? '/api/teacher/marks/bulk-import' : '/api/schooladmin/exam-marks/bulk-import';
      
      const { data } = await axios.post(endpoint, {
        exam_id: selectedExam,
        class_id: selectedClass,
        subject_id: selectedSubject,
        marks_data: parsedData
      }, config);

      setImportResult(data);
      toast.success(data.message || 'Exam marks imported successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import exam marks');
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
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Bulk Exam Marks Import</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Upload CSV file to bulk import student exam marks and grades.</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exam, Class & Subject Selectors */}
        <div className="mt-6 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-indigo-900 mb-1">Select Exam *</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {exams.map(e => (
                <option key={e._id} value={e._id}>{e.name} ({e.term || 'Term 1'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-indigo-900 mb-1">Select Class & Section *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map(c => (
                <option key={c._id} value={c._id}>Class {c.class} ({c.section})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-indigo-900 mb-1">Target Subject (Optional)</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- All / From File --</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.code || 'SUB'})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Step 1</span>
              <h3 className="font-extrabold text-slate-800 text-sm mt-1">Download Marks CSV Template</h3>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                Download CSV structure with columns for Roll No, Student Name, Marks Obtained & Max Marks.
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
              <h3 className="font-extrabold text-slate-800 text-sm mt-1">Upload Marks CSV File</h3>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                {fileName ? `Loaded: ${fileName}` : 'Select completed marks CSV file from your device.'}
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

        {/* Result Banner */}
        {importResult && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Successfully imported marks for {importResult.count} students!</span>
            </div>
          </div>
        )}

        {/* Marks Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" /> Preview Exam Marks ({parsedData.length} Students)
              </h3>
              <span className="text-xs font-semibold text-slate-400">Review before saving</span>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-100 bg-white">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Roll No</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Student Name</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Marks Obtained</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Max Marks</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Percentage</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedData.map((row, idx) => {
                    const max = row.max_marks || 100;
                    const obtained = row.marks_obtained || 0;
                    const pct = Math.round((obtained / max) * 100);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 font-medium">
                        <td className="px-4 py-2.5 font-bold text-indigo-600">{row.roll_no || row.admission_number || idx + 1}</td>
                        <td className="px-4 py-2.5 font-extrabold text-slate-800">{row.student_name || 'N/A'}</td>
                        <td className="px-4 py-2.5 font-black text-emerald-600 text-sm">{obtained}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-500">{max}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            pct >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            pct >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{row.remarks || '-'}</td>
                      </tr>
                    );
                  })}
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
              <Upload className="w-4 h-4" /> {loading ? 'Importing Marks...' : `Import Marks for ${parsedData.length} Students`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkExamMarksImportModal;
