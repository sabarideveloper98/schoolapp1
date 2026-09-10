import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

const TeacherClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/teacher/classes', config);
        setClasses(data);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch assigned classes');
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchClasses();
    }
  }, [user]);

  if (loading) return <div className="flex justify-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Assigned Classes</h2>
          <p className="text-slate-400 text-xs font-bold mt-1">Review your teaching assignments and role status.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class & Section</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subjects Teaching</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((cls) => (
                <tr key={cls._id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-800">{cls.class}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Section {cls.section}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-800">{cls.no_student} students</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cls.isIncharge ? (
                      <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">
                        Class In-charge
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                        Subject Teacher
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {cls.subjects && cls.subjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {cls.subjects.map(s => (
                          <span key={s._id} className="px-2.5 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-bold">
                            {s.name} ({s.code})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-semibold text-xs">None assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold">
                    <button
                      onClick={() => navigate('/teacher/students', { state: { classId: cls._id } })}
                      className="text-blue-600 hover:text-blue-500 bg-blue-50 hover:bg-blue-100/75 border border-blue-100 px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center mx-auto cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      View Students
                    </button>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-semibold">No classes assigned yet.</td>
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
