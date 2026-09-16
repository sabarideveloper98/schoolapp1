import { useState, useEffect } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { 
  Award, 
  Plus, 
  Trash2, 
  Star, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  Users,
  Search
} from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherRemarks = () => {
  const { user } = useAuthStore();
  const [remarks, setRemarks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [category, setCategory] = useState('Appreciation'); // Appreciation | Behaviour | Academic | Discipline
  const [remarkText, setRemarkText] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [remRes, clsRes] = await Promise.all([
        axios.get('/api/teacher/remarks', config),
        axios.get('/api/teacher/classes', config)
      ]);
      setRemarks(remRes.data);
      setClasses(clsRes.data);
      if (clsRes.data.length > 0) {
        setSelectedClass(clsRes.data[0]._id);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load student remarks');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchClassStudents = async (classId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/teacher/students?classId=${classId}`, config);
      setStudents(data);
      if (data.length > 0) setSelectedStudent(data[0]._id);
    } catch (error) {
      toast.error('Failed to load class students');
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !remarkText) return toast.error('Please complete the form');
    setSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/teacher/remarks', {
        student_id: selectedStudent,
        category,
        remark: remarkText
      }, config);

      setRemarks([data, ...remarks]);
      toast.success('Student remark saved');
      setShowAddModal(false);
      setRemarkText('');
    } catch (error) {
      toast.error('Failed to save remark');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRemark = async (id) => {
    if (!window.confirm('Are you sure you want to delete this remark?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/teacher/remarks/${id}`, config);
      setRemarks(remarks.filter(r => r._id !== id));
      toast.success('Remark deleted');
    } catch (error) {
      toast.error('Failed to delete remark');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" /> Student Behaviour & Remarks
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Record student appreciation, conduct, and academic notes for parent visibility.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Remark
        </button>
      </div>

      {/* Remarks Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {remarks.map((item) => (
          <div key={item._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  item.category === 'Appreciation' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  item.category === 'Discipline' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                  item.category === 'Academic' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                  'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {item.category}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-800 text-base">{item.student_id?.name || 'Student'}</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Class {item.student_id?.class_id?.class || 'Assigned'} | Roll: {item.student_id?.roll_no || '-'}
              </p>

              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-xs font-medium leading-relaxed">
                "{item.remark}"
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">By {user?.name}</span>
              <button
                onClick={() => handleDeleteRemark(item._id)}
                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {remarks.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No student remarks recorded yet</p>
          </div>
        )}
      </div>

      {/* Add Remark Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> Add Student Remark
            </h2>

            <form onSubmit={handleAddRemark} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Class</label>
                <SearchableSelect
                  options={classes.map(c => ({
                    value: c._id,
                    label: `Class ${c.class} - ${c.section}`
                  }))}
                  value={selectedClass}
                  onChange={(val) => setSelectedClass(val)}
                  placeholder="Select class..."
                  searchPlaceholder="Search class..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Student</label>
                <SearchableSelect
                  options={students.map(s => ({
                    value: s._id,
                    label: `${s.student_name || s.name || 'Student'} (Roll: ${s.roll_no || s.admission_no || '-'})`
                  }))}
                  value={selectedStudent}
                  onChange={(val) => setSelectedStudent(val)}
                  placeholder="Search student..."
                  searchPlaceholder="Search student name or roll..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                <SearchableSelect
                  options={[
                    { value: 'Appreciation', label: 'Appreciation & Star Performance' },
                    { value: 'Behaviour', label: 'General Behaviour & Conduct' },
                    { value: 'Academic', label: 'Academic Improvement Note' },
                    { value: 'Discipline', label: 'Discipline / Attention Needed' }
                  ]}
                  value={category}
                  onChange={(val) => setCategory(val)}
                  placeholder="Select category..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Remark / Note</label>
                <textarea
                  rows="3"
                  required
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Enter detailed feedback or appreciation note..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Remark'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherRemarks;
