import { useState, useEffect, useMemo } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { Plus, Search, Users, GraduationCap, Award, Phone, Mail, UserCheck, Calendar, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [inchargeClasses, setInchargeClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const location = useLocation();
  const [selectedClassFilter, setSelectedClassFilter] = useState(location.state?.classId || '');
  const { user } = useAuthStore();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const fetchStudents = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const { data } = await axios.get('/api/teacher/students', config);
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch students error:', error);
      toast.error('Failed to fetch students');
    }
  };

  const fetchClasses = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const { data } = await axios.get('/api/teacher/classes', config);
      const list = Array.isArray(data) ? data : [];
      setAllClasses(list);
      setInchargeClasses(list.filter(c => c.isIncharge));
    } catch (error) {
      console.error('Fetch classes error:', error);
      toast.error('Failed to fetch classes');
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      if (user?.token) {
        await Promise.all([fetchStudents(), fetchClasses()]);
      }
      setLoading(false);
    };
    loadAll();
  }, [user]);

  const onSubmit = async (formData) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const res = await axios.post('/api/teacher/students', formData, config);
      
      if (res.data?.parentPassword) {
        toast.success(`Student created! Parent Password is: ${res.data.parentPassword}`, { autoClose: 8000 });
      } else {
        toast.success('Student created successfully!');
      }

      setIsFormOpen(false);
      reset();
      await fetchStudents();
      await fetchClasses();
    } catch (error) {
      console.error('Create student error:', error);
      toast.error(error.response?.data?.message || 'Failed to create student');
    }
  };

  // Helper to extract string classId safely from student object
  const getStudentClassId = (student) => {
    if (!student?.class_id) return 'unassigned';
    if (typeof student.class_id === 'object' && student.class_id._id) {
      return student.class_id._id.toString();
    }
    return student.class_id.toString();
  };

  // Group students accurately by class ID
  const { groupedStudents, classWiseCounts, totalStudentsCount } = useMemo(() => {
    const groups = {};
    const counts = {};

    // 1. Initialize for all assigned classes
    allClasses.forEach(c => {
      const cid = c._id.toString();
      groups[cid] = {
        classInfo: c,
        students: []
      };
      counts[cid] = 0;
    });

    // 2. Put each student into their proper class bucket
    students.forEach(student => {
      const cid = getStudentClassId(student);

      if (cid && groups[cid]) {
        groups[cid].students.push(student);
        counts[cid] = (counts[cid] || 0) + 1;
      } else if (cid && cid !== 'unassigned') {
        // Student has a valid class that wasn't in allClasses
        const clsObj = typeof student.class_id === 'object' ? student.class_id : {};
        if (!groups[cid]) {
          groups[cid] = {
            classInfo: {
              _id: cid,
              class: clsObj.class || 'Class',
              section: clsObj.section || '',
              isIncharge: false
            },
            students: []
          };
          counts[cid] = 0;
        }
        groups[cid].students.push(student);
        counts[cid] = (counts[cid] || 0) + 1;
      } else {
        // Unassigned students
        if (!groups['unassigned']) {
          groups['unassigned'] = {
            classInfo: {
              _id: 'unassigned',
              class: 'Unassigned',
              section: '',
              isIncharge: false
            },
            students: []
          };
          counts['unassigned'] = 0;
        }
        groups['unassigned'].students.push(student);
        counts['unassigned'] = (counts['unassigned'] || 0) + 1;
      }
    });

    return {
      groupedStudents: groups,
      classWiseCounts: counts,
      totalStudentsCount: students.length
    };
  }, [allClasses, students]);

  // Filter groups based on selected class & search keyword
  const filteredGroups = useMemo(() => {
    const result = {};
    const targetGroups = selectedClassFilter
      ? (groupedStudents[selectedClassFilter] ? { [selectedClassFilter]: groupedStudents[selectedClassFilter] } : {})
      : groupedStudents;

    const term = searchTerm.trim().toLowerCase();

    Object.entries(targetGroups).forEach(([cid, group]) => {
      if (!group) return;

      if (!term) {
        result[cid] = group;
      } else {
        const matchedStudents = group.students.filter(s => {
          const name = (s.student_name || '').toLowerCase();
          const roll = (s.roll_no || '').toLowerCase();
          const adm = (s.admission_number || '').toLowerCase();
          const parent = (s.parent_name || '').toLowerCase();
          const phone = (s.parent_phone || '').toLowerCase();
          return name.includes(term) || roll.includes(term) || adm.includes(term) || parent.includes(term) || phone.includes(term);
        });

        // Include the group if there are matching students or if the class name itself matches
        const classMatch = `${group.classInfo?.class} ${group.classInfo?.section}`.toLowerCase().includes(term);
        if (matchedStudents.length > 0 || classMatch) {
          result[cid] = {
            ...group,
            students: term && !classMatch ? matchedStudents : (matchedStudents.length > 0 ? matchedStudents : group.students)
          };
        }
      }
    });

    return result;
  }, [groupedStudents, selectedClassFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] bg-white rounded-2xl border border-slate-100 p-8 shadow-xs">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-base font-bold text-slate-700">Loading Student Records...</div>
        <div className="text-xs text-slate-400 mt-1">Fetching assigned classes and students list</div>
      </div>
    );
  }

  const formatClassName = (cls, sec) => {
    if (!cls) return 'Class';
    const base = cls.startsWith('Class') ? cls : `Class ${cls}`;
    return sec ? `${base} - Section ${sec}` : base;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold mb-2">
            <GraduationCap className="w-3.5 h-3.5" /> Student Directory
          </div>
          <h2 className="text-2xl font-black tracking-tight">My Class Students</h2>
          <p className="text-xs text-blue-100 mt-1">
            View student enrollments, parent contacts, and class-wise roll distribution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { reset(); setIsFormOpen(true); }}
            className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Student
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Students */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{totalStudentsCount}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Across assigned classes</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* 2. Total Classes Managed */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Classes</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{allClasses.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Teaching & in-charge</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* 3. Class Incharge Roles */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-Charge Classes</div>
            <div className="text-2xl font-black text-purple-600 mt-1">{inchargeClasses.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Full class authority</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Active Filter State */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current View</div>
            <div className="text-base font-black text-emerald-600 mt-1 truncate max-w-[140px]">
              {selectedClassFilter 
                ? (allClasses.find(c => c._id === selectedClassFilter)?.class || 'Selected Class')
                : 'All Classes'}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {Object.values(filteredGroups).reduce((acc, g) => acc + (g?.students?.length || 0), 0)} students shown
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Class-wise Count Distribution Chips */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Class-Wise Student Counts</span>
          {selectedClassFilter && (
            <button
              onClick={() => setSelectedClassFilter('')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* All Classes Chip */}
          <button
            onClick={() => setSelectedClassFilter('')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedClassFilter === ''
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>All Classes</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              selectedClassFilter === '' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
            }`}>
              {totalStudentsCount}
            </span>
          </button>

          {/* Individual Classes */}
          {allClasses.map(c => {
            const cid = c._id.toString();
            const count = classWiseCounts[cid] || 0;
            const isSelected = selectedClassFilter === cid;

            return (
              <button
                key={cid}
                onClick={() => setSelectedClassFilter(isSelected ? '' : cid)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{c.class} - {c.section}</span>
                {c.isIncharge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    isSelected ? 'bg-purple-300 text-purple-950' : 'bg-purple-100 text-purple-700'
                  }`}>
                    In-charge
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected 
                    ? 'bg-white/20 text-white' 
                    : (count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500')
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, or phone..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dropdown Select */}
        <div className="w-full sm:w-64">
          <SearchableSelect
            options={[
              { value: '', label: `All Classes (${totalStudentsCount} Students)` },
              ...allClasses.map(c => ({
                value: c._id,
                label: `Class ${c.class} - ${c.section} (${classWiseCounts[c._id.toString()] || 0} Students)`
              }))
            ]}
            value={selectedClassFilter}
            onChange={(val) => setSelectedClassFilter(val)}
            placeholder="Select class filter..."
            searchPlaceholder="Search class..."
          />
        </div>
      </div>

      {/* Add Student Form Modal / Expandable */}
      {isFormOpen && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-2xl border border-blue-100 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-lg font-black text-slate-800">Add New Student</h3>
              <p className="text-xs text-slate-400 mt-0.5">Enroll a student into your in-charge classes</p>
            </div>
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {inchargeClasses.length === 0 && (
            <div className="mb-5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
              <span className="text-base">⚠️</span>
              <span>You are not assigned as an In-charge to any class. Only Class In-charges can enroll students.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Class & Section *</label>
              <SearchableSelect
                options={inchargeClasses.map(c => ({
                  value: c._id,
                  label: `Class ${c.class} - Section ${c.section}`
                }))}
                value={watch('class_id') || ''}
                onChange={(val) => setValue('class_id', val, { shouldValidate: true })}
                placeholder="Select an in-charge class..."
                searchPlaceholder="Search class..."
                disabled={inchargeClasses.length === 0}
              />
              <input type="hidden" {...register('class_id', { required: 'Please select a class' })} />
              {errors.class_id && <p className="text-red-500 text-xs mt-1">{errors.class_id.message}</p>}
            </div>

            <div className="md:col-span-2 border-b border-slate-100 pb-1 mt-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-400">Student Details</h4>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name *</label>
              <input 
                {...register('student_name', { required: 'Student name is required' })} 
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                placeholder="e.g. Alex Smith"
              />
              {errors.student_name && <p className="text-red-500 text-xs mt-1">{errors.student_name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number</label>
              <input 
                {...register('roll_no')} 
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                placeholder="e.g. 101"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
              <input 
                type="date" 
                {...register('dob')} 
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
              <input 
                type="number" 
                {...register('age')} 
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                placeholder="e.g. 12"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
              <input 
                {...register('blood_group')} 
                placeholder="e.g. O+" 
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
              <input 
                {...register('address')} 
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                placeholder="e.g. 123 Main Street"
              />
            </div>

            <div className="md:col-span-2 border-b border-slate-100 pb-1 mt-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-400">Parent Details</h4>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Parent Name *</label>
              <input 
                {...register('parent_name', { required: 'Parent name is required' })} 
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                placeholder="e.g. Robert Smith"
              />
              {errors.parent_name && <p className="text-red-500 text-xs mt-1">{errors.parent_name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Parent Phone Number *</label>
              <input 
                {...register('parent_phone', { required: 'Parent phone is required' })} 
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                placeholder="e.g. 9876543210"
              />
              {errors.parent_phone && <p className="text-red-500 text-xs mt-1">{errors.parent_phone.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Parent Email</label>
              <input 
                type="email" 
                {...register('parent_email')} 
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                placeholder="e.g. parent@example.com"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)} 
              className="px-5 py-2.5 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={inchargeClasses.length === 0} 
              className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
            >
              Save Student
            </button>
          </div>
        </form>
      )}

      {/* Class Wise Students Section */}
      <div className="space-y-6">
        {Object.keys(filteredGroups).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 font-semibold shadow-xs">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-base font-bold text-slate-700">No students match your criteria</div>
            <p className="text-xs text-slate-400 mt-1">Try resetting the class filter or clearing the search query</p>
          </div>
        ) : (
          Object.entries(filteredGroups).map(([classId, group]) => {
            if (!group) return null;
            const studentsList = group.students || [];

            return (
              <div key={classId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                {/* Class Card Header */}
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                      {group.classInfo?.class ? group.classInfo.class.replace('Class ', '') : 'C'}
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-800">
                        {formatClassName(group.classInfo?.class, group.classInfo?.section)}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {group.classInfo?.isIncharge ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                            ⭐ Class In-charge
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            📖 Subject Teacher
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-3 py-1 rounded-full">
                      {studentsList.length} {studentsList.length === 1 ? 'Student' : 'Students'}
                    </span>
                  </div>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="px-5 py-3 w-16 text-center">Roll #</th>
                        <th className="px-5 py-3">Student Name</th>
                        <th className="px-5 py-3">Age / DOB</th>
                        <th className="px-5 py-3">Parent Details</th>
                        <th className="px-5 py-3">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {studentsList.map((student, idx) => {
                        const initials = (student.student_name || 'S')
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        return (
                          <tr key={student._id || idx} className="hover:bg-slate-50/70 transition-colors">
                            {/* Roll Number */}
                            <td className="px-5 py-3.5 text-center">
                              <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                                {student.roll_no || `${idx + 1}`}
                              </span>
                            </td>

                            {/* Student Name */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {student.student_name}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                    {student.admission_number && (
                                      <span>Adm: {student.admission_number}</span>
                                    )}
                                    {student.blood_group && (
                                      <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 font-bold">
                                        {student.blood_group}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Age & DOB */}
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-800">
                                {student.age ? `${student.age} yrs` : '—'}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>

                            {/* Parent Details */}
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-800">
                                {student.parent_name || 'Parent'}
                              </div>
                              {student.parent_email && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-2.5 h-2.5" /> {student.parent_email}
                                </div>
                              )}
                            </td>

                            {/* Contact Number */}
                            <td className="px-5 py-3.5">
                              {student.parent_phone ? (
                                <a 
                                  href={`tel:${student.parent_phone}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{student.parent_phone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {studentsList.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                            <div className="font-semibold text-slate-600">No students enrolled in this class yet.</div>
                            {group.classInfo?.isIncharge && (
                              <button
                                onClick={() => {
                                  reset({ class_id: classId });
                                  setIsFormOpen(true);
                                }}
                                className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                              >
                                + Enroll Student to {formatClassName(group.classInfo?.class, group.classInfo?.section)}
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeacherStudents;
