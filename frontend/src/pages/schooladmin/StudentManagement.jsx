import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, Search, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';

const StudentManagement = () => {
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Editing forms
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Table Filters (S1 School style)
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [appliedClassFilter, setAppliedClassFilter] = useState('');
  const [appliedSectionFilter, setAppliedSectionFilter] = useState('');
  
  // Table search & limit
  const [pageSize, setPageSize] = useState(50);
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Dropdown states
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  // Mock student enabled/disabled status
  const [disabledStudentIds, setDisabledStudentIds] = useState(new Set());

  const [editClass, setEditClass] = useState('');
  const [editAvailableSections, setEditAvailableSections] = useState([]);

  const { user } = useAuthStore();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [studentRes, classRes] = await Promise.all([
        axios.get('http://localhost:5005/api/schooladmin/students', config),
        axios.get('http://localhost:5005/api/schooladmin/classes', config)
      ]);
      setStudents(studentRes.data);
      setClasses(classRes.data);
      
      // If initial class ID is present in query parameters, apply it
      if (initialClassId) {
        const matchingClass = classRes.data.find(c => c._id === initialClassId);
        if (matchingClass) {
          setClassFilter(matchingClass.class);
          setSectionFilter(matchingClass._id);
          setAppliedClassFilter(matchingClass.class);
          setAppliedSectionFilter(matchingClass._id);
        }
      }
      
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const onSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`http://localhost:5005/api/schooladmin/students/${editingId}`, data, config);
        toast.success('Student updated!');
      }
      closeForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save student');
    }
  };

  const handleClassChange = (className) => {
    setEditClass(className);
    const sections = classes.filter(c => c.class === className);
    setEditAvailableSections(sections);
    setValue('class_id', '');
  };

  const handleEdit = (student) => {
    setEditMode(true);
    setEditingId(student._id);
    setIsFormOpen(true);

    const stdClass = student.class_id?.class || '';
    setEditClass(stdClass);
    const sections = classes.filter(c => c.class === stdClass);
    setEditAvailableSections(sections);

    setValue('student_name', student.student_name);
    setValue('first_name', student.first_name || '');
    setValue('last_name', student.last_name || '');
    setValue('father_name', student.father_name || '');
    setValue('mother_name', student.mother_name || '');
    setValue('age', student.age || '');
    setValue('dob', student.dob ? student.dob.split('T')[0] : '');
    setValue('blood_group', student.blood_group || 'N/A');
    setValue('address', student.address || '');
    setValue('parent_name', student.parent_name || '');
    setValue('parent_phone', student.parent_phone || '');
    setValue('parent_email', student.parent_email || '');
    setValue('class_id', student.class_id?._id || '');
    setValue('group', student.group || 'Science');
    setValue('gender', student.gender || 'Male');
    setValue('roll_no', student.roll_no || '');
    setValue('registration_no', student.registration_no || '');
    setValue('religion', student.religion || 'Islam');
    setValue('admission_number', student.admission_number || '');
    setValue('guardian_relation', student.guardian_relation || 'Father');
    setValue('guardian_address', student.guardian_address || '');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this student?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`http://localhost:5005/api/schooladmin/students/${id}`, config);
        toast.success('Student deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const toggleStatus = (id) => {
    setDisabledStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    toast.success('Status updated successfully');
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditMode(false);
    setEditingId(null);
    reset();
  };

  // Get unique class standard names
  const uniqueClassNames = [...new Set(classes.map(c => c.class))];

  // Sections for the selected class standard
  const availableSections = classFilter
    ? classes.filter(c => c.class === classFilter)
    : [];

  const handleSearchClick = () => {
    setAppliedClassFilter(classFilter);
    setAppliedSectionFilter(sectionFilter);
  };

  // Filter students array based on filters & global search
  const filteredStudents = students.filter(student => {
    if (appliedClassFilter && student.class_id?.class !== appliedClassFilter) return false;
    if (appliedSectionFilter && student.class_id?._id !== appliedSectionFilter) return false;
    
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      return (
        student.student_name?.toLowerCase().includes(searchLower) ||
        student.roll_no?.toString().includes(searchLower) ||
        (student.admission_number || student._id)?.toLowerCase().includes(searchLower) ||
        student.parent_phone?.includes(searchLower)
      );
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-12 text-slate-550 font-medium">Loading Student List...</div>;

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumb */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Student List</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="text-blue-600">Students</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/school-admin/students/create')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(59,130,246,0.15)] flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add New Student
        </button>
      </div>

      {/* Filter Section Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Class select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Class</label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter('');
              }}
              className="block w-full h-12 px-4 text-slate-850 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
            >
              <option value="">Select Class</option>
              {uniqueClassNames.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Section select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="block w-full h-12 px-4 text-slate-855 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
              disabled={!classFilter}
            >
              <option value="">{classFilter ? 'Select Section' : 'Select Class First'}</option>
              {availableSections.map((s) => (
                <option key={s._id} value={s._id}>{s.section}</option>
              ))}
            </select>
          </div>

          {/* Search trigger button */}
          <div>
            <button
              onClick={handleSearchClick}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Student List Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 overflow-hidden">
        
        {/* Entries page size and Search text input */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-10 px-3 border border-slate-200 rounded-lg outline-none bg-white text-slate-700 cursor-pointer focus:border-blue-500 text-xs font-semibold"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>Entries</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 w-full sm:w-auto">
            <span>Search</span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full sm:w-48 h-10 px-3 text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs font-semibold"
              placeholder="Type name, roll, etc..."
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-left w-12">
                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">IMAGE</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">ROLL</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">ADMISSION NUMBER</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">NAME</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">CLASS</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">SECTION</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">GROUP</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">PHONE NO</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStudents.slice(0, pageSize).map((student) => {
                const isEnabled = !disabledStudentIds.has(student._id);
                const admissionNum = student.admission_number || student._id?.substring(0, 16).toUpperCase();
                
                return (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    {/* Checkbox */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    </td>

                    {/* Image */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.photo ? (
                        <img src={student.photo} alt={student.student_name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-150 flex flex-col items-center justify-center p-1">
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-[6px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">No Image</span>
                        </div>
                      )}
                    </td>

                    {/* Roll */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                      {student.roll_no || '-'}
                    </td>

                    {/* Admission Number */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-655 tracking-wide">
                      {admissionNum}
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                      {student.student_name}
                    </td>

                    {/* Class */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                      {student.class_id?.class || '-'}
                    </td>

                    {/* Section */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                      {student.class_id?.section || '-'}
                    </td>

                    {/* Group */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                      {student.group || '-'}
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">
                      {student.parent_phone || '-'}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(student._id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-rose-500 text-white hover:bg-rose-600'
                        }`}
                      >
                        {isEnabled ? 'Enable' : 'Disable'}
                      </button>
                    </td>

                    {/* Action dropdown */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold relative">
                      <div className="inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === student._id ? null : student._id)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Actions
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {activeDropdownId === student._id && (
                          <div className="absolute right-6 mt-1 w-28 bg-white border border-slate-150 rounded-xl shadow-lg py-1.5 z-20">
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleEdit(student);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-slate-750 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleDelete(student._id);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-slate-400 font-bold">
                    No students match the current filter or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog Modal (if inline edits triggered) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800">Edit Student</h3>
              <button onClick={closeForm} className="text-slate-450 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* First Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">First Name *</label>
                  <input
                    {...register('first_name', { required: 'Required' })}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Last Name</label>
                  <input
                    {...register('last_name')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Student Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Full Student Name *</label>
                  <input
                    {...register('student_name', { required: 'Required' })}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Class Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Class *</label>
                  <select
                    value={editClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                  >
                    <option value="">Select Class</option>
                    {uniqueClassNames.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Section Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Section *</label>
                  <select
                    {...register('class_id', { required: 'Required' })}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                  >
                    <option value="">Select Section</option>
                    {editAvailableSections.map((s) => (
                      <option key={s._id} value={s._id}>{s.section}</option>
                    ))}
                  </select>
                </div>

                {/* Roll No */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Roll No. *</label>
                  <input
                    {...register('roll_no', { required: 'Required' })}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Registration No */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Registration No.</label>
                  <input
                    {...register('registration_no')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Group */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Group *</label>
                  <select
                    {...register('group')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                  >
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts/Humanities">Arts/Humanities</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Gender</label>
                  <select
                    {...register('gender')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    {...register('dob')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Age</label>
                  <input
                    type="number"
                    {...register('age')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Blood Group</label>
                  <input
                    {...register('blood_group')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Religion */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Religion</label>
                  <select
                    {...register('religion')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Hinduism">Hinduism</option>
                    <option value="Buddhism">Buddhism</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Admission Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Admission Number</label>
                  <input
                    {...register('admission_number')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Address</label>
                  <input
                    {...register('address')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Father Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Father Name</label>
                  <input
                    {...register('father_name')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Mother Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Mother Name</label>
                  <input
                    {...register('mother_name')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Guardian Relation */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Relationship</label>
                  <select
                    {...register('guardian_relation')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Guardian Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Guardian Address</label>
                  <input
                    {...register('guardian_address')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Parent Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Parent Name *</label>
                  <input
                    {...register('parent_name', { required: 'Required' })}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Parent Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Parent Phone *</label>
                  <input
                    {...register('parent_phone', { required: 'Required' })}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

                {/* Parent Email */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Parent Email</label>
                  <input
                    {...register('parent_email')}
                    className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
