import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Award, BookOpen, Search, ArrowRight, UserCheck } from 'lucide-react';

const TeacherClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'INCHARGE' | 'SUBJECT'
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user?.token}` } };
        const { data } = await axios.get('/api/teacher/classes', config);
        setClasses(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (error) {
        console.error('Fetch classes error:', error);
        toast.error('Failed to fetch assigned classes');
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchClasses();
    }
  }, [user]);

  // Calculate summary metrics
  const { totalStudents, inchargeCount, subjectOnlyCount } = useMemo(() => {
    let studentsTotal = 0;
    let incharge = 0;
    let subjectOnly = 0;

    classes.forEach(c => {
      const count = c.studentCount ?? c.no_student ?? 0;
      studentsTotal += count;
      if (c.isIncharge) {
        incharge++;
      } else {
        subjectOnly++;
      }
    });

    return {
      totalStudents: studentsTotal,
      inchargeCount: incharge,
      subjectOnlyCount: subjectOnly
    };
  }, [classes]);

  // Filter classes based on role & search query
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // Role filter
      if (roleFilter === 'INCHARGE' && !cls.isIncharge) return false;
      if (roleFilter === 'SUBJECT' && cls.isIncharge) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const className = (cls.class || '').toLowerCase();
        const section = (cls.section || '').toLowerCase();
        const subjects = (cls.subjects || []).map(s => `${s.name} ${s.code}`).join(' ').toLowerCase();
        return className.includes(term) || section.includes(term) || subjects.includes(term);
      }

      return true;
    });
  }, [classes, roleFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] bg-white rounded-2xl border border-slate-100 p-8 shadow-xs">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-base font-bold text-slate-700">Loading Classes...</div>
        <div className="text-xs text-slate-400 mt-1">Fetching teaching assignments and student counts</div>
      </div>
    );
  }

  const formatClassName = (name) => {
    if (!name) return 'Class';
    return name.startsWith('Class') ? name : `Class ${name}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold mb-2">
            <GraduationCap className="w-3.5 h-3.5" /> Class Management
          </div>
          <h2 className="text-2xl font-black tracking-tight">Assigned Classes</h2>
          <p className="text-xs text-blue-100 mt-1">
            Review your classes, student strength, and teaching responsibilities
          </p>
        </div>

        <button
          onClick={() => navigate('/teacher/students')}
          className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <Users className="w-4 h-4 mr-1.5" /> All Students Directory
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assigned Classes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Classes</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{classes.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Assigned to you</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Total Students Enrolled */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{totalStudents}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Active enrollments</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Class In-Charge */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-Charge Roles</div>
            <div className="text-2xl font-black text-purple-600 mt-1">{inchargeCount}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Primary class mentor</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Subject Teacher Roles */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Teacher</div>
            <div className="text-2xl font-black text-sky-600 mt-1">{subjectOnlyCount}</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Subject assignments</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by class, section, or subject name..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-bold">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              roleFilter === 'ALL'
                ? 'bg-white text-blue-700 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Classes ({classes.length})
          </button>
          <button
            onClick={() => setRoleFilter('INCHARGE')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              roleFilter === 'INCHARGE'
                ? 'bg-white text-purple-700 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In-charge ({inchargeCount})
          </button>
          <button
            onClick={() => setRoleFilter('SUBJECT')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              roleFilter === 'SUBJECT'
                ? 'bg-white text-sky-700 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subject Teacher ({subjectOnlyCount})
          </button>
        </div>
      </div>

      {/* Classes Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Class & Section</th>
                <th className="px-6 py-4 text-center">Student Count</th>
                <th className="px-6 py-4">Your Role</th>
                <th className="px-6 py-4">Subjects Teaching</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredClasses.map((cls) => {
                const count = cls.studentCount ?? cls.no_student ?? 0;

                return (
                  <tr key={cls._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Class & Section */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0">
                          {cls.class ? cls.class.replace('Class ', '') : 'C'}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm">
                            {formatClassName(cls.class)}
                          </div>
                          <div className="text-slate-400 font-semibold text-xs mt-0.5">
                            Section {cls.section || 'A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Student Count in Table View */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-2xs font-black text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{count} {count === 1 ? 'Student' : 'Students'}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cls.isIncharge ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-black">
                          ⭐ Class In-charge
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                          📖 Subject Teacher
                        </span>
                      )}
                    </td>

                    {/* Subjects Teaching */}
                    <td className="px-6 py-4 text-xs">
                      {cls.subjects && cls.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cls.subjects.map(s => (
                            <span 
                              key={s._id} 
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/70 font-semibold text-[11px]"
                            >
                              {s.name} {s.code ? `(${s.code})` : ''}
                            </span>
                          ))}
                        </div>
                      ) : cls.isIncharge ? (
                        <span className="text-slate-400 italic text-[11px]">Class In-charge Supervision</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None assigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => navigate('/teacher/students', { state: { classId: cls._id } })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 font-bold transition-all text-xs cursor-pointer shadow-2xs"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>View Students</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700 text-sm">No classes found</div>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or role filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherClasses;
