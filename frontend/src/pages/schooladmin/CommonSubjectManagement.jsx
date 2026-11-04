import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Search, BookOpen, CheckCircle2, 
  XCircle, Filter, Users, Sparkles, RefreshCw, X, AlertTriangle, Layers
} from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';

const QUICK_SUBJECT_SUGGESTIONS = [
  { name: 'Tamil', code: 'TAM101', desc: 'Language and regional literature studies' },
  { name: 'English', code: 'ENG101', desc: 'Grammar, prose, poetry and communication skills' },
  { name: 'Mathematics', code: 'MATH101', desc: 'Arithmetic, Algebra, Geometry and Trigonometry' },
  { name: 'Science', code: 'SCI101', desc: 'Physics, Chemistry and Natural Sciences' },
  { name: 'Social Science', code: 'SOC101', desc: 'History, Geography, Civics and Economics' },
  { name: 'Computer Science', code: 'CS101', desc: 'Information technology and computer applications' },
  { name: 'Physics', code: 'PHY101', desc: 'Mechanics, Electromagnetism and Modern Physics' },
  { name: 'Chemistry', code: 'CHEM101', desc: 'Organic, Inorganic and Physical Chemistry' },
  { name: 'Biology', code: 'BIO101', desc: 'Botany, Zoology, Genetics and Ecology' },
  { name: 'Hindi', code: 'HIN101', desc: 'Hindi language, grammar and literature' }
];

const CommonSubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Inactive'

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalSubject, setDeleteModalSubject] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuthStore();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      status: 'Active'
    }
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/schooladmin/common-subjects', config);
      setSubjects(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch common subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchSubjects();
    }
  }, [user]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(sub => {
      const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        sub.name?.toLowerCase().includes(q) || 
        sub.code?.toLowerCase().includes(q) || 
        sub.description?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [subjects, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = subjects.length;
    const active = subjects.filter(s => s.status === 'Active').length;
    const inactive = subjects.filter(s => s.status === 'Inactive').length;
    const totalAssigned = subjects.reduce((sum, s) => sum + (s.teacherCount || 0), 0);
    return { total, active, inactive, totalAssigned };
  }, [subjects]);

  const openCreateModal = () => {
    setEditMode(false);
    setEditingId(null);
    reset({
      name: '',
      code: '',
      description: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setEditMode(true);
    setEditingId(sub._id);
    reset({
      name: sub.name,
      code: sub.code,
      description: sub.description || '',
      status: sub.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: (data.description || '').trim(),
        status: data.status || 'Active'
      };

      if (editMode) {
        await axios.put(`/api/schooladmin/common-subjects/${editingId}`, payload, config);
        toast.success(`Subject "${payload.name}" updated successfully!`);
      } else {
        await axios.post('/api/schooladmin/common-subjects', payload, config);
        toast.success(`Subject "${payload.name}" created successfully!`);
      }
      closeModal();
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} subject`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (sub) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.patch(`/api/schooladmin/common-subjects/${sub._id}/toggle-status`, {}, config);
      toast.success(res.data?.message || 'Status updated');
      setSubjects(prev => prev.map(s => s._id === sub._id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalSubject) return;
    try {
      setDeleting(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/schooladmin/common-subjects/${deleteModalSubject._id}`, config);
      toast.success(`Subject "${deleteModalSubject.name}" deleted successfully`);
      setDeleteModalSubject(null);
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete subject');
    } finally {
      setDeleting(false);
    }
  };

  const applySuggestion = (sug) => {
    setValue('name', sug.name, { shouldValidate: true });
    setValue('code', sug.code, { shouldValidate: true });
    setValue('description', sug.desc, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Common Subject Management</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Staff Information &bull; Manage central subjects and teacher assignments
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchSubjects}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl transition-all cursor-pointer hover:rotate-180"
            title="Refresh subjects"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-[0_4px_16px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add New Subject
          </button>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Subjects</div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Subjects</div>
            <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inactive Subjects</div>
            <div className="text-2xl font-black text-slate-600">{stats.inactive}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Teachers Assigned</div>
            <div className="text-2xl font-black text-indigo-600">{stats.totalAssigned}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 rounded-2xl w-full sm:w-auto">
          {['All', 'Active', 'Inactive'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === tab ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab === 'All' ? stats.total : tab === 'Active' ? stats.active : stats.inactive}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects or codes..."
            className="w-full h-11 pl-10 pr-4 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-500">Loading common subjects...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Code</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Teachers Assigned</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((sub) => {
                  const isActive = sub.status === 'Active';
                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">{sub.name}</span>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          {sub.code}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {sub.description || <span className="italic text-slate-400">No description provided</span>}
                      </td>

                      {/* Teachers Assigned */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          sub.teacherCount > 0 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          <Users className="w-3.5 h-3.5" />
                          {sub.teacherCount || 0} Teacher{sub.teacherCount === 1 ? '' : 's'}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(sub)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title={`Click to set ${isActive ? 'Inactive' : 'Active'}`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(sub)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                            title="Edit Subject"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModalSubject(sub)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredSubjects.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">No Common Subjects Found</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {searchQuery || statusFilter !== 'All' 
                            ? 'Try clearing the search query or changing filter.' 
                            : 'Click "Add New Subject" to create subjects for your school.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editMode ? 'Edit Common Subject' : 'Add New Common Subject'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Configure subject details and enable for teacher assignments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggestions (when adding) */}
            {!editMode && (
              <div className="pt-4 pb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quick Suggestions:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUBJECT_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.code}
                      type="button"
                      onClick={() => applySuggestion(sug)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-600 transition-all cursor-pointer"
                    >
                      {sug.name} ({sug.code})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              {/* Subject Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', { required: 'Subject Name is required' })}
                  placeholder="e.g. Tamil, Mathematics, Science"
                  className="w-full h-12 px-4 text-xs font-semibold bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition-all"
                />
                {errors.name && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.name.message}</p>}
              </div>

              {/* Subject Code */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Subject Code <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('code', { required: 'Subject Code is required' })}
                  placeholder="e.g. TAM101, MATH101, CS101"
                  className="w-full h-12 px-4 text-xs font-mono font-bold uppercase bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition-all"
                />
                {errors.code && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.code.message}</p>}
              </div>

              {/* Subject Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  {...register('description')}
                  rows="3"
                  placeholder="Brief summary of curriculum or focus areas..."
                  className="w-full p-3.5 text-xs font-medium bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition-all"
                />
              </div>

              {/* Status Radio / Select */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Subject Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                    watch('status') === 'Active' 
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800 font-bold' 
                      : 'bg-white border-slate-200 text-slate-600 font-medium'
                  }`}>
                    <input
                      type="radio"
                      value="Active"
                      {...register('status')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Active</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                    watch('status') === 'Inactive' 
                      ? 'bg-slate-100 border-slate-300 text-slate-800 font-bold' 
                      : 'bg-white border-slate-200 text-slate-600 font-medium'
                  }`}>
                    <input
                      type="radio"
                      value="Inactive"
                      {...register('status')}
                      className="text-slate-600 focus:ring-slate-500"
                    />
                    <XCircle className="w-4 h-4 text-slate-500" />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.2)] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editMode ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Common Subject</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">"{deleteModalSubject.name}"</span> ({deleteModalSubject.code})?
            </p>

            {deleteModalSubject.teacherCount > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> This subject is currently assigned to {deleteModalSubject.teacherCount} teacher(s). Deleting will be prevented until teachers are unassigned.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalSubject(null)}
                className="px-5 py-2.5 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(225,29,72,0.2)] disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonSubjectManagement;
