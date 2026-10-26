import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Link as LinkIcon, Edit, X, Users, Search, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import SearchableSelect from '../../components/SearchableSelect';

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

  // Class Students Modal state
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [inchargeFilter, setInchargeFilter] = useState('');

  const [assignClassFilter, setAssignClassFilter] = useState('');
  const [assignSubjectFilter, setAssignSubjectFilter] = useState('');
  const [assignTeacherFilter, setAssignTeacherFilter] = useState('');

  const { user } = useAuthStore();
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const assignmentForm = useForm();

  const handleViewStudents = async (cls) => {
    setSelectedClassForStudents(cls);
    setLoadingClassStudents(true);
    setStudentSearchTerm('');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/schooladmin/students', config);
      const data = Array.isArray(res.data) ? res.data : (res.data?.students || []);
      const classIdStr = String(cls._id);
      const matched = data.filter(s => {
        const sClassId = String(s.class_id?._id || s.class_id || '');
        const matchesId = sClassId && sClassId === classIdStr;
        const matchesNameAndSection = 
          String(s.class || s.class_id?.class || '').trim().toLowerCase() === String(cls.class || '').trim().toLowerCase() &&
          String(s.section || s.class_id?.section || '').trim().toUpperCase() === String(cls.section || '').trim().toUpperCase();
        return matchesId || matchesNameAndSection;
      });
      setClassStudents(matched);
    } catch (err) {
      toast.error('Failed to load students for this class');
    } finally {
      setLoadingClassStudents(false);
    }
  };

  const filteredClassStudents = classStudents.filter((st) => {
    if (!studentSearchTerm.trim()) return true;
    const term = studentSearchTerm.toLowerCase();
    return (
      (st.student_name || '').toLowerCase().includes(term) ||
      (st.roll_no || '').toString().toLowerCase().includes(term) ||
      (st.admission_number || '').toLowerCase().includes(term) ||
      (st.guardian_phone || st.parent_phone || '').includes(term)
    );
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [clsRes, assignRes, techRes, subRes, studentRes] = await Promise.all([
        axios.get('/api/schooladmin/classes', config),
        axios.get('/api/schooladmin/assignments', config),
        axios.get('/api/schooladmin/teachers', config),
        axios.get('/api/schooladmin/subjects', config),
        axios.get('/api/schooladmin/students', config).catch(() => ({ data: [] }))
      ]);
      const rawStudents = Array.isArray(studentRes.data) ? studentRes.data : (studentRes.data?.students || []);
      const classesWithCount = (clsRes.data || []).map(cls => {
        const classIdStr = String(cls._id);
        const count = rawStudents.filter(s => {
          const sClassId = String(s.class_id?._id || s.class_id || '');
          const matchesId = sClassId && sClassId === classIdStr;
          const matchesNameAndSection = 
            String(s.class || s.class_id?.class || '').trim().toLowerCase() === String(cls.class || '').trim().toLowerCase() &&
            String(s.section || s.class_id?.section || '').trim().toUpperCase() === String(cls.section || '').trim().toUpperCase();
          return matchesId || matchesNameAndSection;
        }).length;
        return {
          ...cls,
          studentCount: count || cls.studentCount || cls.no_student || 0
        };
      });
      setClasses(classesWithCount);
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
        await axios.put(`/api/schooladmin/classes/${editingId}`, data, config);
        toast.success('Class updated!');
      } else {
        await axios.post('/api/schooladmin/classes', data, config);
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
        await axios.put(`/api/schooladmin/assignments/${editingId}`, data, config);
        toast.success('Assignment updated!');
      } else {
        await axios.post('/api/schooladmin/assignments', data, config);
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
        await axios.delete(`/api/schooladmin/classes/${id}`, config);
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
        await axios.delete(`/api/schooladmin/assignments/${id}`, config);
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
              <SearchableSelect 
                options={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c._id, label: `${c.class} - ${c.section}` }))]}
                value={classFilter} 
                onChange={(val) => setClassFilter(val)} 
                placeholder="All Classes"
                searchPlaceholder="Search class..."
                className="w-44"
                buttonClassName="rounded-xl border border-slate-200 bg-white text-slate-700 sm:text-sm p-2.5 outline-none cursor-pointer"
              />
              <SearchableSelect 
                options={[{ value: '', label: 'All Incharges' }, ...teachers.map(t => ({ value: t._id, label: t.name }))]}
                value={inchargeFilter} 
                onChange={(val) => setInchargeFilter(val)} 
                placeholder="All Incharges"
                searchPlaceholder="Search incharge..."
                className="w-44"
                buttonClassName="rounded-xl border border-slate-200 bg-white text-slate-700 sm:text-sm p-2.5 outline-none cursor-pointer"
              />
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
                  <SearchableSelect 
                    options={[{ value: '', label: 'Select Teacher' }, ...teachers.map(t => ({ value: t._id, label: t.name }))]}
                    value={watch('class_incharge_id')} 
                    onChange={(val) => setValue('class_incharge_id', val)}
                    placeholder="Select Teacher"
                    searchPlaceholder="Search teacher..."
                    buttonClassName="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none sm:text-sm"
                  />
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class Incharge</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map((cls) => (
                  <tr key={cls._id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{cls.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{cls.section}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => handleViewStudents(cls)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Click to view students"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{cls.studentCount ?? cls.no_student ?? 0} {Number(cls.studentCount ?? cls.no_student) === 1 ? 'Student' : 'Students'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{cls.class_incharge_id?.name || 'Not Assigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                      <button 
                        onClick={() => handleViewStudents(cls)}
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
                {filteredClasses.length === 0 && <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-semibold">No classes found.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* View Class Students Modal */}
          {selectedClassForStudents && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        Class {selectedClassForStudents.class} - Section {selectedClassForStudents.section} Students
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Class In-charge: <span className="font-semibold text-slate-700">{selectedClassForStudents.class_incharge_id?.name || 'Not Assigned'}</span> • {classStudents.length} {classStudents.length === 1 ? 'student enrolled' : 'students enrolled'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedClassForStudents(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Search Bar */}
                <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student by name, roll no, admission no..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const cid = selectedClassForStudents._id;
                      setSelectedClassForStudents(null);
                      navigate(`/school-admin/students?classId=${cid}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Open in full student management page"
                  >
                    <span>Open in All Students</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Modal Content / Students Table */}
                <div className="p-6 overflow-y-auto flex-1">
                  {loadingClassStudents ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-semibold text-sm">
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                      Loading students...
                    </div>
                  ) : filteredClassStudents.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No students found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {studentSearchTerm ? 'No students match your search criteria' : 'No students enrolled in this class'}
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
                      <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Roll</th>
                            <th className="px-4 py-3">Adm No</th>
                            <th className="px-4 py-3">Student Name</th>
                            <th className="px-4 py-3">Gender / Blood</th>
                            <th className="px-4 py-3">Guardian & Phone</th>
                            <th className="px-4 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredClassStudents.map((st) => (
                            <tr key={st._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-700">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                                  {st.roll_no || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-black text-blue-600">
                                {st.admission_number || st._id?.substring(0, 8).toUpperCase()}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-800">
                                {st.student_name}
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-medium">
                                {st.gender || '-'} {st.blood_group && st.blood_group !== 'N/A' ? `• ${st.blood_group}` : ''}
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-medium">
                                <div>{st.guardian_name || st.parent_name || 'Guardian'}</div>
                                <div className="text-[11px] text-slate-400">{st.guardian_phone || st.parent_phone || '-'}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  (st.student_status || 'Active').toLowerCase() === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {st.student_status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                  <button
                    onClick={() => setSelectedClassForStudents(null)}
                    className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Assign Subject Teachers</h2>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <SearchableSelect 
                options={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c._id, label: `${c.class} - ${c.section}` }))]}
                value={assignClassFilter} 
                onChange={(val) => setAssignClassFilter(val)} 
                placeholder="All Classes"
                searchPlaceholder="Search class..."
                className="w-40"
                buttonClassName="rounded-xl border border-slate-200 bg-white text-slate-700 sm:text-sm p-2.5 outline-none cursor-pointer"
              />
              <SearchableSelect 
                options={[{ value: '', label: 'All Subjects' }, ...subjects.map(s => ({ value: s._id, label: s.name }))]}
                value={assignSubjectFilter} 
                onChange={(val) => setAssignSubjectFilter(val)} 
                placeholder="All Subjects"
                searchPlaceholder="Search subject..."
                className="w-40"
                buttonClassName="rounded-xl border border-slate-200 bg-white text-slate-700 sm:text-sm p-2.5 outline-none cursor-pointer"
              />
              <SearchableSelect 
                options={[{ value: '', label: 'All Teachers' }, ...teachers.map(t => ({ value: t._id, label: t.name }))]}
                value={assignTeacherFilter} 
                onChange={(val) => setAssignTeacherFilter(val)} 
                placeholder="All Teachers"
                searchPlaceholder="Search teacher..."
                className="w-40"
                buttonClassName="rounded-xl border border-slate-200 bg-white text-slate-700 sm:text-sm p-2.5 outline-none cursor-pointer"
              />
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
                  <SearchableSelect 
                    options={[{ value: '', label: 'Select Class' }, ...classes.map(c => ({ value: c._id, label: `${c.class} - ${c.section}` }))]}
                    value={assignmentForm.watch('class_id')} 
                    onChange={(val) => assignmentForm.setValue('class_id', val, { shouldValidate: true })}
                    placeholder="Select Class"
                    searchPlaceholder="Search class..."
                    buttonClassName="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                  <SearchableSelect 
                    options={[{ value: '', label: 'Select Subject' }, ...subjects.map(s => ({ value: s._id, label: `${s.name} (${s.code || 'SUB'})` }))]}
                    value={assignmentForm.watch('subject_id')} 
                    onChange={(val) => assignmentForm.setValue('subject_id', val, { shouldValidate: true })}
                    placeholder="Select Subject"
                    searchPlaceholder="Search subject..."
                    buttonClassName="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject Teacher</label>
                  <SearchableSelect 
                    options={[{ value: '', label: 'Select Teacher' }, ...teachers.map(t => ({ value: t._id, label: t.name }))]}
                    value={assignmentForm.watch('teacher_id')} 
                    onChange={(val) => assignmentForm.setValue('teacher_id', val, { shouldValidate: true })}
                    placeholder="Select Teacher"
                    searchPlaceholder="Search teacher..."
                    buttonClassName="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none sm:text-sm"
                  />
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
