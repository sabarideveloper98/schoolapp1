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
  BookOpen, 
  Users,
  Search,
  Filter,
  X,
  TrendingUp,
  Smile,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';

const CATEGORY_OPTIONS = [
  { value: 'Appreciation', label: '⭐ Appreciation & Star Performance', color: 'emerald' },
  { value: 'Performance', label: '📈 Academic & Learning Progress', color: 'indigo' },
  { value: 'Behaviour', label: '🤝 General Conduct & Behaviour', color: 'amber' },
  { value: 'Discipline', label: '⚠️ Discipline & Attention Needed', color: 'rose' }
];

const TeacherRemarks = () => {
  const { user } = useAuthStore();
  const [remarks, setRemarks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Filters & Search
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [category, setCategory] = useState('Appreciation');
  const [title, setTitle] = useState('');
  const [remarkText, setRemarkText] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const [remRes, clsRes] = await Promise.all([
        axios.get('/api/teacher/remarks', config),
        axios.get('/api/teacher/classes', config)
      ]);

      const loadedRemarks = Array.isArray(remRes.data) ? remRes.data : [];
      const loadedClasses = Array.isArray(clsRes.data) ? clsRes.data : [];

      setRemarks(loadedRemarks);
      setClasses(loadedClasses);

      if (loadedClasses.length > 0) {
        setSelectedClass(loadedClasses[0]._id);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load student remarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass);
    } else {
      setStudents([]);
      setSelectedStudent('');
    }
  }, [selectedClass]);

  const fetchClassStudents = async (classId) => {
    try {
      setLoadingStudents(true);
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const { data } = await axios.get(`/api/teacher/students?class_id=${classId}&classId=${classId}`, config);
      const studentList = Array.isArray(data) ? data : [];
      setStudents(studentList);
      if (studentList.length > 0) {
        setSelectedStudent(studentList[0]._id);
      } else {
        setSelectedStudent('');
      }
    } catch (error) {
      console.error('Failed to load class students:', error);
      toast.error('Failed to load students for selected class');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenAddModal = () => {
    setTitle('');
    setRemarkText('');
    setCategory('Appreciation');
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]._id);
    }
    setShowAddModal(true);
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!selectedClass) return toast.error('Please select a class');
    if (!selectedStudent) return toast.error('Please select a student');
    if (!remarkText.trim()) return toast.error('Please write remark description');

    setSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const finalTitle = title.trim() || `${category} Note`;
      const finalDescription = remarkText.trim();

      const payload = {
        student_id: selectedStudent,
        class_id: selectedClass,
        type: category === 'Academic' ? 'Performance' : category,
        category: category,
        title: finalTitle,
        description: finalDescription,
        remark: finalDescription
      };

      const res = await axios.post('/api/teacher/remarks', payload, config);
      const newRemark = res.data?.remark || res.data;

      setRemarks((prev) => [newRemark, ...prev]);
      toast.success(res.data?.message || 'Remark added successfully!');
      setShowAddModal(false);
      setTitle('');
      setRemarkText('');
    } catch (error) {
      console.error('Add remark error:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to save remark';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRemark = async (id) => {
    if (!window.confirm('Are you sure you want to delete this remark?')) return;
    setDeletingId(id);
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      await axios.delete(`/api/teacher/remarks/${id}`, config);
      setRemarks((prev) => prev.filter((r) => r._id !== id));
      toast.success('Remark deleted successfully');
    } catch (error) {
      console.error('Delete remark error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete remark');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter remarks
  const filteredRemarks = remarks.filter((item) => {
    const itemType = item.type || item.category || 'Behaviour';
    const matchesCategory = filterCategory === 'All' || itemType === filterCategory || (filterCategory === 'Performance' && itemType === 'Academic');

    const itemClassId = item.class_id?._id || item.class_id || item.student_id?.class_id?._id || item.student_id?.class_id;
    const matchesClass = filterClass === 'All' || String(itemClassId) === String(filterClass);

    const studentName = (item.student_id?.student_name || item.student_id?.name || '').toLowerCase();
    const rollNo = (item.student_id?.roll_no || item.student_id?.admission_number || '').toLowerCase();
    const remarkContent = (item.description || item.remark || item.title || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = !searchTerm || studentName.includes(query) || rollNo.includes(query) || remarkContent.includes(query);

    return matchesCategory && matchesClass && matchesSearch;
  });

  const getCategoryTheme = (type) => {
    switch (type) {
      case 'Appreciation':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badge: 'bg-emerald-500',
          icon: <Award className="w-3.5 h-3.5" />,
          border: 'border-emerald-100',
          ring: 'group-hover:border-emerald-300'
        };
      case 'Performance':
      case 'Academic':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          badge: 'bg-indigo-500',
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          border: 'border-indigo-100',
          ring: 'group-hover:border-indigo-300'
        };
      case 'Discipline':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          badge: 'bg-rose-500',
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          border: 'border-rose-100',
          ring: 'group-hover:border-rose-300'
        };
      case 'Behaviour':
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'bg-amber-500',
          icon: <Smile className="w-3.5 h-3.5" />,
          border: 'border-amber-100',
          ring: 'group-hover:border-amber-300'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
        <p className="text-xs font-bold text-slate-400">Loading student remarks...</p>
      </div>
    );
  }

  // Count summaries
  const totalCount = remarks.length;
  const appreciationCount = remarks.filter((r) => (r.type || r.category) === 'Appreciation').length;
  const performanceCount = remarks.filter((r) => ['Performance', 'Academic'].includes(r.type || r.category)).length;
  const behaviourCount = remarks.filter((r) => (r.type || r.category) === 'Behaviour').length;
  const disciplineCount = remarks.filter((r) => (r.type || r.category) === 'Discipline').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Remarks & Behaviour</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1.5 ml-11">
            Record appreciation, progress, conduct notes, and disciplinary feedback visible to students & parents.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Remark
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div 
          onClick={() => setFilterCategory('All')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterCategory === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total Remarks</div>
          <div className="text-2xl font-black mt-1">{totalCount}</div>
        </div>

        <div 
          onClick={() => setFilterCategory('Appreciation')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterCategory === 'Appreciation' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-emerald-50/60 border-emerald-100 text-emerald-900 hover:border-emerald-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-80">
            <Award className="w-3 h-3" /> Appreciation
          </div>
          <div className="text-2xl font-black mt-1">{appreciationCount}</div>
        </div>

        <div 
          onClick={() => setFilterCategory('Performance')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterCategory === 'Performance' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-indigo-50/60 border-indigo-100 text-indigo-900 hover:border-indigo-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-80">
            <TrendingUp className="w-3 h-3" /> Performance
          </div>
          <div className="text-2xl font-black mt-1">{performanceCount}</div>
        </div>

        <div 
          onClick={() => setFilterCategory('Behaviour')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterCategory === 'Behaviour' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-amber-50/60 border-amber-100 text-amber-900 hover:border-amber-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-80">
            <Smile className="w-3 h-3" /> Behaviour
          </div>
          <div className="text-2xl font-black mt-1">{behaviourCount}</div>
        </div>

        <div 
          onClick={() => setFilterCategory('Discipline')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterCategory === 'Discipline' ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-rose-50/60 border-rose-100 text-rose-900 hover:border-rose-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-80">
            <AlertCircle className="w-3 h-3" /> Discipline
          </div>
          <div className="text-2xl font-black mt-1">{disciplineCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, or remark keywords..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-48">
            <SearchableSelect
              options={[
                { value: 'All', label: 'All Classes' },
                ...classes.map((c) => ({
                  value: c._id,
                  label: `Class ${c.class}${c.section ? ` - ${c.section}` : ''}`
                }))
              ]}
              value={filterClass}
              onChange={(val) => setFilterClass(val)}
              placeholder="Filter by class..."
              searchPlaceholder="Search class..."
            />
          </div>
        </div>
      </div>

      {/* Remarks Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRemarks.map((item) => {
          const type = item.type || item.category || 'Behaviour';
          const theme = getCategoryTheme(type);
          const studentName = item.student_id?.student_name || item.student_id?.name || 'Student';
          const rollNo = item.student_id?.roll_no || item.student_id?.admission_number || '-';
          const classNameStr = item.class_id?.class 
            ? `Class ${item.class_id.class}${item.class_id.section ? ' - ' + item.class_id.section : ''}`
            : (item.student_id?.class_id?.class ? `Class ${item.student_id.class_id.class}` : 'Assigned Class');
          const remarkDate = item.createdAt || item.date;

          return (
            <div
              key={item._id}
              className={`group bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${theme.ring}`}
            >
              <div>
                {/* Header: Category Badge and Date */}
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${theme.bg}`}>
                    {theme.icon}
                    {type}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-300" />
                    {remarkDate ? new Date(remarkDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                  </span>
                </div>

                {/* Student Info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-800 text-sm truncate">{studentName}</h3>
                    <p className="text-[11px] font-semibold text-slate-400 truncate">
                      {classNameStr} • Roll: {rollNo}
                    </p>
                  </div>
                </div>

                {/* Remark Title */}
                {item.title && (
                  <h4 className="text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </h4>
                )}

                {/* Remark Description Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-xs font-medium leading-relaxed italic">
                  "{item.description || item.remark || 'No description provided.'}"
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 truncate max-w-[170px]">
                  By {user?.name || 'Teacher'}
                </span>
                <button
                  onClick={() => handleDeleteRemark(item._id)}
                  disabled={deletingId === item._id}
                  title="Delete Remark"
                  className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredRemarks.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-3">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-700">No student remarks found</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || filterCategory !== 'All' || filterClass !== 'All'
                ? 'Try adjusting your filters or search terms.'
                : 'Click the "Add Remark" button to record notes, conduct observations, or star achievements.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Remark
            </button>
          </div>
        )}
      </div>

      {/* Add Remark Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Star className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">Add Student Remark</h2>
                  <p className="text-[11px] font-semibold text-slate-400">Record positive reinforcement or behavior notice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRemark} className="space-y-4">
              {/* Class Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Class <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={classes.map((c) => ({
                    value: c._id,
                    label: `Class ${c.class}${c.section ? ` - ${c.section}` : ''}`
                  }))}
                  value={selectedClass}
                  onChange={(val) => setSelectedClass(val)}
                  placeholder="Select Class..."
                  searchPlaceholder="Search class..."
                />
              </div>

              {/* Student Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student <span className="text-rose-500">*</span>
                </label>
                {loadingStudents ? (
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    Loading students for this class...
                  </div>
                ) : (
                  <SearchableSelect
                    options={students.map((s) => ({
                      value: s._id,
                      label: `${s.student_name || s.name || 'Student'} (Roll: ${s.roll_no || s.admission_number || '-'})`
                    }))}
                    value={selectedStudent}
                    onChange={(val) => setSelectedStudent(val)}
                    placeholder={students.length > 0 ? "Select student..." : "No students in this class"}
                    searchPlaceholder="Search student name or roll..."
                    disabled={students.length === 0}
                  />
                )}
                {students.length === 0 && !loadingStudents && (
                  <p className="text-[11px] text-amber-600 font-semibold mt-1">
                    No students currently found in this class.
                  </p>
                )}
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={(val) => setCategory(val)}
                  placeholder="Select Category..."
                />
              </div>

              {/* Remark Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remark Title <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`e.g. Star Performer or Active Participation`}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                />
              </div>

              {/* Remark Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remark / Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Enter detailed feedback or appreciation note for student & parent..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 leading-relaxed"
                ></textarea>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedStudent || !remarkText.trim()}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Remark'
                  )}
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
