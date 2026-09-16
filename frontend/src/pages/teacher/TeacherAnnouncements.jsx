import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { Bell, Calendar, Tag, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherAnnouncements = () => {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/teacher/announcements', config);
      setAnnouncements(data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load announcements');
      setLoading(false);
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
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Bell className="w-6 h-6 text-indigo-600" /> School Circulars & Announcements
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">Official notices and broad alerts issued by school management.</p>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {announcements.map((item) => (
          <div key={item._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-100 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> {item.category || 'General'}
              </span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h2 className="text-lg font-black text-slate-800 mb-2">{item.title}</h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">{item.content}</p>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No active circulars at this time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAnnouncements;
