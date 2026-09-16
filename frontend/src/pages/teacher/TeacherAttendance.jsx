import { useState, useEffect } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { 
  CheckSquare, 
  Calendar, 
  Users, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherAttendance = () => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Active View Tab: 'mark' | 'report'
  const [activeTab, setActiveTab] = useState('mark');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [user]);

  const fetchClasses = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/teacher/classes', config);
      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0]._id);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load assigned classes');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      if (activeTab === 'mark') {
        fetchStudentsAndAttendance();
      } else {
        fetchAttendanceReport();
      }
    }
  }, [selectedClass, attendanceDate, activeTab]);

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/teacher/students?classId=${selectedClass}`, config);
      setStudents(data);

      // Default all to 'Present'
      const initialAtt = {};
      const initialRem = {};
      data.forEach(s => {
        initialAtt[s._id] = 'Present';
        initialRem[s._id] = '';
      });
      setAttendanceMap(initialAtt);
      setRemarksMap(initialRem);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load student list for attendance');
      setLoading(false);
    }
  };

  const fetchAttendanceReport = async () => {
    setReportLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/teacher/attendance/report?classId=${selectedClass}&date=${attendanceDate}`, config);
      setReportData(data);
      setReportLoading(false);
    } catch (error) {
      toast.error('Failed to load attendance report');
      setReportLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleRemarkChange = (studentId, remark) => {
    setRemarksMap(prev => ({ ...prev, [studentId]: remark }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s._id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return toast.error('Please select a class');
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const attendanceList = Object.keys(attendanceMap).map(studentId => ({
        student_id: studentId,
        status: attendanceMap[studentId],
        remarks: remarksMap[studentId] || ''
      }));

      await axios.post('/api/teacher/attendance', {
        class_id: selectedClass,
        date: attendanceDate,
        attendanceList
      }, config);

      toast.success('Attendance saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const studentName = (s.student_name || s.name || '').toString().toLowerCase();
    const term = (searchTerm || '').toString().toLowerCase();
    const rollNo = (s.roll_no || s.admission_no || '').toString().toLowerCase();
    return studentName.includes(term) || rollNo.includes(term);
  });

  const presentCount = Object.values(attendanceMap).filter(st => st === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter(st => st === 'Absent').length;
  const leaveCount = Object.values(attendanceMap).filter(st => st === 'Leave').length;
  const halfDayCount = Object.values(attendanceMap).filter(st => st === 'Half Day').length;

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
            <CheckSquare className="w-6 h-6 text-indigo-600" /> Attendance Management
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Mark and review daily attendance for assigned classes.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button
            onClick={() => setActiveTab('mark')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'mark' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Attendance Report
          </button>
        </div>
      </div>

      {/* Selector Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Class & Section</label>
          <SearchableSelect
            options={classes.map(c => ({
              value: c._id,
              label: `Class ${c.class} - ${c.section} (${c.no_student || 0} Students)`
            }))}
            value={selectedClass}
            onChange={(val) => setSelectedClass(val)}
            placeholder="Search & select class..."
            searchPlaceholder="Search class or section..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Attendance Date</label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold transition-all outline-none bg-white"
          />
        </div>

        {activeTab === 'mark' && (
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Search Student</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or roll no..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm font-semibold transition-all outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'mark' ? (
        <>
          {/* Quick Mark All & Counter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-2">Quick Mark:</span>
              <button
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-extrabold border border-emerald-100 transition-colors cursor-pointer"
              >
                All Present
              </button>
              <button
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-extrabold border border-rose-100 transition-colors cursor-pointer"
              >
                All Absent
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-extrabold">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                Present: {presentCount}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
                Absent: {absentCount}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                Leave: {leaveCount}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                Half Day: {halfDayCount}
              </span>
            </div>
          </div>

          {/* Student Attendance List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Roll No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Student Name</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => {
                    const status = attendanceMap[s._id] || 'Present';
                    return (
                      <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                          {s.roll_no || s.admission_no || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-extrabold text-slate-800">{s.student_name || s.name || 'Student'}</div>
                          <div className="text-xs font-medium text-slate-400">Adm: {s.admission_no || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            {[
                              { label: 'P', value: 'Present', color: 'bg-emerald-600 text-white' },
                              { label: 'A', value: 'Absent', color: 'bg-rose-600 text-white' },
                              { label: 'L', value: 'Leave', color: 'bg-amber-500 text-white' },
                              { label: 'HD', value: 'Half Day', color: 'bg-purple-600 text-white' }
                            ].map((st) => (
                              <button
                                key={st.value}
                                onClick={() => handleStatusChange(s._id, st.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                  status === st.value ? `${st.color} shadow-xs` : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={remarksMap[s._id] || ''}
                            onChange={(e) => handleRemarkChange(s._id, e.target.value)}
                            placeholder="Optional remark..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs font-semibold outline-none bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-slate-400 font-bold">
                        No students found for this class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveAttendance}
                disabled={saving || students.length === 0}
                className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving Attendance...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Attendance Report View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Attendance Records for {attendanceDate}
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Roll No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Student Name</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((rec) => (
                    <tr key={rec._id}>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {rec.student_id?.roll_no || rec.student_id?.admission_no || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-extrabold text-slate-800">
                        {rec.student_id?.name || 'Student'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          rec.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          rec.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          rec.status === 'Leave' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-purple-50 text-purple-700 border-purple-100'
                        }`}>
                          {rec.status}
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
              <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No attendance marked for this date</p>
              <p className="text-xs text-slate-400 mt-1">Switch to 'Mark Attendance' tab to submit attendance.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;
