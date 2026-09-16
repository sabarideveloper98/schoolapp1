import { useState, useEffect } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { 
  Award, 
  BookOpen, 
  Save, 
  CheckCircle2, 
  FileSpreadsheet, 
  Trophy, 
  Users, 
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherExams = () => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maxMarks, setMaxMarks] = useState(100);

  // Active Tab: 'entry' | 'report'
  const [activeTab, setActiveTab] = useState('entry');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [clsRes, exRes] = await Promise.all([
        axios.get('/api/teacher/classes', config),
        axios.get('/api/teacher/exams', config)
      ]);
      setClasses(clsRes.data);
      setExams(exRes.data);
      if (clsRes.data.length > 0) setSelectedClass(clsRes.data[0]._id);
      if (exRes.data.length > 0) {
        setSelectedExam(exRes.data[0]._id);
        setMaxMarks(exRes.data[0].max_marks || 100);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load classes and exams');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedExam) {
      if (activeTab === 'entry') {
        fetchStudentsForEntry();
      } else {
        fetchMarksReport();
      }
    }
  }, [selectedClass, selectedExam, activeTab]);

  const fetchStudentsForEntry = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/teacher/students?classId=${selectedClass}`, config);
      setStudents(data);

      // Default marks 0
      const initMarks = {};
      const initRemarks = {};
      data.forEach(s => {
        initMarks[s._id] = '';
        initRemarks[s._id] = '';
      });
      setMarksMap(initMarks);
      setRemarksMap(initRemarks);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load students');
      setLoading(false);
    }
  };

  const fetchMarksReport = async () => {
    setReportLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/teacher/marks/report?classId=${selectedClass}&examId=${selectedExam}`, config);
      setReportData(data);
      setReportLoading(false);
    } catch (error) {
      toast.error('Failed to load exam marks report');
      setReportLoading(false);
    }
  };

  const handleMarkChange = (studentId, val) => {
    setMarksMap(prev => ({ ...prev, [studentId]: val }));
  };

  const handleRemarkChange = (studentId, val) => {
    setRemarksMap(prev => ({ ...prev, [studentId]: val }));
  };

  const handleSaveMarks = async () => {
    if (!selectedExam || !selectedClass) return toast.error('Select class and exam');
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const marksList = Object.keys(marksMap).map(sId => ({
        student_id: sId,
        marks_obtained: Number(marksMap[sId]) || 0,
        remarks: remarksMap[sId] || ''
      }));

      await axios.post('/api/teacher/marks', {
        exam_id: selectedExam,
        class_id: selectedClass,
        marksList
      }, config);

      toast.success('Exam marks saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" /> Exam Marks & Assessment
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Enter marks, generate rank lists, and track academic performance.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button
            onClick={() => setActiveTab('entry')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'entry' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Mark Entry
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Marks Report
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Class</label>
          <SearchableSelect
            options={classes.map(c => ({
              value: c._id,
              label: `Class ${c.class} - ${c.section}`
            }))}
            value={selectedClass}
            onChange={(val) => setSelectedClass(val)}
            placeholder="Search & select class..."
            searchPlaceholder="Search class..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Exam</label>
          <SearchableSelect
            options={exams.map(e => ({
              value: e._id,
              label: `${e.name} (${e.subject_id?.name || 'Subject'}) - Max: ${e.max_marks || 100}`
            }))}
            value={selectedExam}
            onChange={(val) => {
              setSelectedExam(val);
              const ex = exams.find(x => x._id === val);
              if (ex) setMaxMarks(ex.max_marks || 100);
            }}
            placeholder="Search & select exam..."
            searchPlaceholder="Search exam or subject..."
          />
        </div>

        <div className="flex items-center justify-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <div className="text-center">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Maximum Marks</p>
            <p className="text-2xl font-black text-indigo-700">{maxMarks}</p>
          </div>
        </div>
      </div>

      {activeTab === 'entry' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Roll No</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Student Name</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Marks Obtained</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Percentage</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => {
                  const ob = Number(marksMap[s._id]) || 0;
                  const pct = maxMarks > 0 ? ((ob / maxMarks) * 100).toFixed(1) : 0;
                  return (
                    <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {s.roll_no || s.admission_no || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-extrabold text-slate-800">
                        {s.student_name || s.name || 'Student'}
                      </td>
                      <td className="px-6 py-4 text-center max-w-[150px]">
                        <input
                          type="number"
                          max={maxMarks}
                          min={0}
                          value={marksMap[s._id] ?? ''}
                          onChange={(e) => handleMarkChange(s._id, e.target.value)}
                          placeholder={`0 - ${maxMarks}`}
                          className="w-24 text-center px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 font-extrabold text-sm outline-none bg-white"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          pct >= 75 ? 'bg-emerald-50 text-emerald-700' :
                          pct >= 40 ? 'bg-blue-50 text-blue-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={remarksMap[s._id] || ''}
                          onChange={(e) => handleRemarkChange(s._id, e.target.value)}
                          placeholder="e.g. Excellent work"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-bold">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveMarks}
              disabled={saving || students.length === 0}
              className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving Marks...' : 'Save Marks'}
            </button>
          </div>
        </div>
      ) : (
        /* Report View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Rank List & Performance Report
          </h2>

          {reportLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : reportData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Student Name</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Marks</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Grade</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((rec, index) => (
                    <tr key={rec._id}>
                      <td className="px-6 py-4 text-center font-black text-slate-800">
                        {index === 0 ? <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">🥇 1st</span> :
                         index === 1 ? <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 text-xs">🥈 2nd</span> :
                         index === 2 ? <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs">🥉 3rd</span> :
                         `#${index + 1}`}
                      </td>
                      <td className="px-6 py-4 text-sm font-extrabold text-slate-800">
                        {rec.student_id?.name || 'Student'}
                      </td>
                      <td className="px-6 py-4 text-center font-extrabold text-indigo-600">
                        {rec.marks_obtained} / {maxMarks}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                          {rec.grade || (rec.marks_obtained >= 75 ? 'A+' : rec.marks_obtained >= 50 ? 'B' : 'C')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-semibold">
                        {rec.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No marks entered yet for this exam</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherExams;
