import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Link as LinkIcon, Edit, X, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

const ClassManagement = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' or 'assignments'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [inchargeFilter, setInchargeFilter] = useState('');

  const [assignClassFilter, setAssignClassFilter] = useState('');
  const [assignSubjectFilter, setAssignSubjectFilter] = useState('');
  const [assignTeacherFilter, setAssignTeacherFilter] = useState('');

  const { user } = useAuthStore();
  const { register, handleSubmit, reset, setValue } = useForm();
  const assignmentForm = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [clsRes, assignRes, techRes, subRes] = await Promise.all([
        axios.get('http://localhost:5005/api/schooladmin/classes', config),
        axios.get('http://localhost:5005/api/schooladmin/assignments', config),
        axios.get('http://localhost:5005/api/schooladmin/teachers', config),
        axios.get('http://localhost:5005/api/schooladmin/subjects', config),
      ]);
      setClasses(clsRes.data);
      setAssignments(assignRes.data);
      setTeachers(techRes.data);
      setSubjects(subRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user]);

  const onClassSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`http://localhost:5005/api/schooladmin/classes/${editingId}`, data, config);
        toast.success('Class updated!');
      } else {
        await axios.post('http://localhost:5005/api/schooladmin/classes', data, config);
        toast.success('Class created!');
      }
      closeClassForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} class`);
    }
  };

  const handleEditClass = (cls) => {
    setEditMode(true);
    setEditingId(cls._id);
    setIsFormOpen(true);
    setValue('standard', cls.class);
    setValue('section', cls.section);
    setValue('class_incharge_id', cls.class_incharge_id?._id || '');
  };

  const closeClassForm = () => {
    setIsFormOpen(false);
    setEditMode(false);
    setEditingId(null);
    reset();
  };

  const onAssignSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`http://localhost:5005/api/schooladmin/assignments/${editingId}`, data, config);
        toast.success('Assignment updated!');
      } else {
        await axios.post('http://localhost:5005/api/schooladmin/assignments', data, config);
        toast.success('Subject assigned to teacher!');
      }
      closeAssignmentForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign subject');
    }
  };

  const handleEditAssignment = (assgn) => {
    setEditMode(true);
    setEditingId(assgn._id);
    setIsFormOpen(true);
    assignmentForm.setValue('class_id', assgn.class_id?._id || '');
    assignmentForm.setValue('subject_id', assgn.subject_id?._id || '');
    assignmentForm.setValue('teacher_id', assgn.teacher_id?._id || '');
  };

  const closeAssignmentForm = () => {
    setIsFormOpen(false);
    setEditMode(false);
    setEditingId(null);
    assignmentForm.reset();
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm('Delete this class?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`http://localhost:5005/api/schooladmin/classes/${id}`, config);
        toast.success('Class deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete class');
      }
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Remove this assignment?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`http://localhost:5005/api/schooladmin/assignments/${id}`, config);
        toast.success('Assignment removed');
        fetchData();
      } catch (error) {
        toast.error('Failed to remove assignment');
      }
    }
  };

  if (loading) return <div className="flex justify-center py-12">Loading class data...</div>;

  // Filter Data
  const filteredClasses = classes.filter(cls => {
    const matchClass = classFilter ? cls._id === classFilter : true;
    const matchIncharge = inchargeFilter ? cls.class_incharge_id?._id === inchargeFilter : true;
    return matchClass && matchIncharge;
  });

  const filteredAssignments = assignments.filter(assgn => {
    const matchClass = assignClassFilter ? assgn.class_id?._id === assignClassFilter : true;
    const matchSubject = assignSubjectFilter ? assgn.subject_id?._id === assignSubjectFilter : true;
    const matchTeacher = assignTeacherFilter ? assgn.teacher_id?._id === assignTeacherFilter : true;
    return matchClass && matchSubject && matchTeacher;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/40">
        <div className="flex space-x-6 px-6">
          <button 
            className={`py-4 px-2 border-b-2 text-sm font-bold transition-all cursor-pointer ${activeTab === 'classes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-850'}`}
            onClick={() => { setActiveTab('classes'); closeClassForm(); }}
          >
            Classes & Sections
          </button>
          <button 
            className={`py-4 px-2 border-b-2 text-sm font-bold transition-all cursor-pointer ${activeTab === 'assignments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-850'}`}
            onClick={() => { setActiveTab('assignments'); closeAssignmentForm(); }}
          >
            Subject Teachers Assignment
          </button>
        </div>
      </div>

      {activeTab === 'classes' && (
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Class Management</h2>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select 
                value={classFilter} 
                onChange={e => setClassFilter(e.target.value)} 
                className="rounded-xl border border-slate-205 bg-white text-slate-700 focus:border-blue-500 sm:text-sm p-2.5 outline-none cursor-pointer"
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.class} - {c.section}</option>)}
              </select>
              <select 
                value={inchargeFilter} 
                onChange={e => setInchargeFilter(e.target.value)} 
                className="rounded-xl border border-slate-205 bg-white text-slate-700 focus:border-blue-500 sm:text-sm p-2.5 outline-none cursor-pointer"
              >
                <option value="">All Incharges</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              {(classFilter || inchargeFilter) && (
                <button 
                  onClick={() => { setClassFilter(''); setInchargeFilter(''); }}
                  className="text-slate-400 hover:text-red-500 p-2 cursor-pointer transition-colors"
                  title="Clear Filters"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => { closeClassForm(); setIsFormOpen(true); }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Class
              </button>
            </div>
          </div>

          {isFormOpen && (
            <form onSubmit={handleSubmit(onClassSubmit)} className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100 shadow-inner">
              <h3 className="text-md font-bold mb-5 text-slate-800">{editMode ? 'Edit Class & Section' : 'Add New Class & Section'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Standard/Class</label>
                  <input 
                    {...register('standard', { required: 'Required' })} 
                    placeholder="e.g. Class 10" 
                    className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section</label>
                  <input 
                    {...register('section', { required: 'Required' })} 
                    placeholder="e.g. A" 
                    className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Class Incharge (Optional)</label>
                  <select 
                    {...register('class_incharge_id')} 
                    className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={closeClassForm} 
                  className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
                >
                  {editMode ? 'Update Class' : 'Save Class'}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Standard</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class Incharge</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map((cls) => (
                  <tr key={cls._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{cls.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{cls.section}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{cls.class_incharge_id?.name || 'Not Assigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                      <button 
                        onClick={() => navigate(`/school-admin/students?classId=${cls._id}`)}
                        className="text-emerald-600 hover:text-emerald-500 mr-4 cursor-pointer hover:scale-110 transition-transform inline-block"
                        title="View Students"
                      >
                        <Users className="w-5 h-5 inline" />
                      </button>
                      <button 
                        onClick={() => handleEditClass(cls)} 
                        className="text-blue-600 hover:text-blue-500 mr-4 cursor-pointer hover:scale-110 transition-transform inline-block"
                        title="Edit Class"
                      >
                        <Edit className="w-5 h-5 inline" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClass(cls._id)} 
                        className="text-red-600 hover:text-red-500 cursor-pointer hover:scale-110 transition-transform inline-block"
                        title="Delete Class"
                      >
                        <Trash2 className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredClasses.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-semibold">No classes found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Assign Subject Teachers</h2>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select 
                value={assignClassFilter} 
                onChange={e => setAssignClassFilter(e.target.value)} 
                className="rounded-xl border border-slate-205 bg-white text-slate-700 focus:border-blue-500 sm:text-sm p-2.5 outline-none cursor-pointer"
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.class} - {c.section}</option>)}
              </select>
              <select 
                value={assignSubjectFilter} 
                onChange={e => setAssignSubjectFilter(e.target.value)} 
                className="rounded-xl border border-slate-205 bg-white text-slate-700 focus:border-blue-500 sm:text-sm p-2.5 outline-none cursor-pointer"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <select 
                value={assignTeacherFilter} 
                onChange={e => setAssignTeacherFilter(e.target.value)} 
                className="rounded-xl border border-slate-205 bg-white text-slate-700 focus:border-blue-500 sm:text-sm p-2.5 outline-none cursor-pointer"
              >
                <option value="">All Teachers</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              {(assignClassFilter || assignSubjectFilter || assignTeacherFilter) && (
                <button 
                  onClick={() => { setAssignClassFilter(''); setAssignSubjectFilter(''); setAssignTeacherFilter(''); }}
                  className="text-slate-400 hover:text-red-500 p-2 cursor-pointer transition-colors"
                  title="Clear Filters"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => { closeAssignmentForm(); setIsFormOpen(true); }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
              >
                <LinkIcon className="w-4 h-4 mr-2" /> Assign Teacher
              </button>
            </div>
          </div>

          {isFormOpen && (
            <form onSubmit={assignmentForm.handleSubmit(onAssignSubmit)} className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100 shadow-inner">
              <h3 className="text-md font-bold mb-5 text-slate-800">{editMode ? 'Edit Assignment' : 'Link Subject to Class & Teacher'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Class & Section</label>
                  <select 
                    {...assignmentForm.register('class_id', { required: 'Required' })} 
                    className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.class} - {c.section}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                  <select 
                    {...assignmentForm.register('subject_id', { required: 'Required' })} 
                    className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject Teacher</label>
                  <select 
                    {...assignmentForm.register('teacher_id', { required: 'Required' })} 
                    className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={closeAssignmentForm} 
                  className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
                >
                  {editMode ? 'Update Assignment' : 'Assign'}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((assgn) => (
                  <tr key={assgn._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{assgn.class_id?.class} - {assgn.class_id?.section}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{assgn.subject_id?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{assgn.teacher_id?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                      <button 
                        onClick={() => handleEditAssignment(assgn)} 
                        className="text-blue-600 hover:text-blue-500 mr-4 cursor-pointer hover:scale-110 transition-transform inline-block"
                        title="Edit Assignment"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAssignment(assgn._id)} 
                        className="text-red-600 hover:text-red-500 cursor-pointer hover:scale-110 transition-transform inline-block"
                        title="Remove Assignment"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAssignments.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-semibold">No assignments found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
