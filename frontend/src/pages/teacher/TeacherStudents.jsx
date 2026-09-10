import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [inchargeClasses, setInchargeClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const location = useLocation();
  const [selectedClassFilter, setSelectedClassFilter] = useState(location.state?.classId || '');
  const { user } = useAuthStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchStudents = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/teacher/students', config);
      setStudents(data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch students');
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/teacher/classes', config);
      setAllClasses(data);
      setInchargeClasses(data.filter(c => c.isIncharge));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchStudents();
      fetchClasses();
    }
  }, [user]);

  const onSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.post('/api/teacher/students', data, config);
      
      if (res.data.parentPassword) {
        toast.success(`Student created! Parent Password is: ${res.data.parentPassword}`, { autoClose: false });
      } else {
        toast.success('Student created successfully!');
      }

      setIsFormOpen(false);
      reset();
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create student');
    }
  };

  if (loading) return <div className="flex justify-center py-12">Loading...</div>;

  // Group students by class
  const groupedStudents = {};
  
  // Initialize groups for all assigned classes
  allClasses.forEach(c => {
    groupedStudents[c._id] = {
      classInfo: c,
      students: []
    };
  });

  // Add students to their respective groups
  students.forEach(student => {
    if (student.class_id && groupedStudents[student.class_id]) {
      groupedStudents[student.class_id].students.push(student);
    } else {
      // If student belongs to a class not in the incharge list (e.g. subject assignment only)
      if (!groupedStudents[student.class_id]) {
        groupedStudents[student.class_id] = {
           classInfo: { class: 'Other', section: 'Classes' },
           students: []
        };
      }
      groupedStudents[student.class_id].students.push(student);
    }
  });

  const displayGroups = selectedClassFilter 
    ? { [selectedClassFilter]: groupedStudents[selectedClassFilter] }
    : groupedStudents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">My Class Students</h2>
          <p className="text-slate-400 text-xs font-bold mt-1">Manage and view students under your assigned classes.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={selectedClassFilter} 
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="rounded-xl border border-slate-205 bg-white text-slate-700 focus:border-blue-500 sm:text-sm p-2.5 outline-none cursor-pointer"
          >
            <option value="">All Classes</option>
            {allClasses.map(c => (
              <option key={c._id} value={c._id}>{c.class} - {c.section}</option>
            ))}
          </select>
          <button 
            onClick={() => { reset(); setIsFormOpen(true); }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer animate-fade-in"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Student
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
          <h3 className="text-md font-bold mb-5 text-slate-800">Add New Student</h3>
          
          {inchargeClasses.length === 0 && (
            <div className="mb-5 text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 shadow-[0_4px_12px_rgba(245,158,11,0.03)]">
              <svg className="w-5 h-5 text-amber-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>You are not assigned as an In-charge to any class. You cannot add students.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Class & Section</label>
              <select 
                {...register('class_id', { required: 'Required' })} 
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                disabled={inchargeClasses.length === 0}
              >
                <option value="">Select a class</option>
                {inchargeClasses.map(c => (
                  <option key={c._id} value={c._id}>{c.class} - {c.section}</option>
                ))}
              </select>
              {errors.class_id && <p className="text-red-500 text-xs mt-1">{errors.class_id.message}</p>}
            </div>

            <div className="md:col-span-2 border-b border-slate-200/60 pb-2 mb-1 mt-3">
              <h4 className="font-bold text-slate-800 text-sm">Student Details</h4>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Student Name</label>
              <input 
                {...register('student_name', { required: 'Required' })} 
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. Alex Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
              <input 
                type="date" 
                {...register('dob')} 
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Age</label>
              <input 
                type="number" 
                {...register('age')} 
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. 15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Blood Group</label>
              <input 
                {...register('blood_group')} 
                placeholder="e.g. O+" 
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
              <input 
                {...register('address')} 
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. 789 Pine Rd"
              />
            </div>

            <div className="md:col-span-2 border-b border-slate-200/60 pb-2 mb-1 mt-4">
              <h4 className="font-bold text-slate-800 text-sm">Parent Details</h4>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent Name</label>
              <input 
                {...register('parent_name', { required: 'Required' })} 
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. Robert Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent Phone</label>
              <input 
                {...register('parent_phone', { required: 'Required' })} 
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. +1 555-0199"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent Email</label>
              <input 
                type="email" 
                {...register('parent_email')} 
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="e.g. robert@gmail.com"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)} 
              className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={inchargeClasses.length === 0} 
              className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
            >
              Save Student
            </button>
          </div>
        </form>
      )}

      <div className="space-y-8">
        {Object.keys(displayGroups).length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 font-semibold shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            No classes or students found.
          </div>
        )}
        
        {Object.entries(displayGroups).map(([classId, group]) => {
          if (!group) return null;
          return (
            <div key={classId} className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
              <div className="bg-slate-50/40 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">
                  {group.classInfo?.class} - {group.classInfo?.section}
                </h3>
                <span className="bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {group.students.length} Students
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Age / DOB</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Parent Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {group.students.map((student) => (
                      <tr key={student._id} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-800">{student.student_name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Blood: {student.blood_group || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-700">{student.age} yrs</div>
                          <div className="text-xs text-slate-400 mt-0.5">{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-700">{student.parent_name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{student.parent_phone}</div>
                        </td>
                      </tr>
                    ))}
                    {group.students.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-slate-450 font-semibold">No students found for this class.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherStudents;
