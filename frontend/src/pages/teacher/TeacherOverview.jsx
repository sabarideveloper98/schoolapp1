import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import DashboardAnalyticsBar from '../../components/DashboardAnalyticsBar';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckSquare, 
  FileText, 
  Award, 
  MessageSquare, 
  Bell, 
  PlusCircle, 
  ArrowRight, 
  AlertCircle,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherOverview = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [statsRes, annRes] = await Promise.all([
          axios.get('/api/teacher/dashboard-stats', config),
          axios.get('/api/teacher/announcements', config)
        ]);
        setStats(statsRes.data);
        setAnnouncements(annRes.data.slice(0, 5));
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const quickActions = [
    { label: 'Take Attendance', icon: CheckSquare, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100', path: '/teacher/attendance' },
    { label: 'Add Homework', icon: FileText, color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100', path: '/teacher/homework' },
    { label: 'Add Exam Marks', icon: Award, color: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100', path: '/teacher/exams' },
    { label: 'Student Directory', icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100', path: '/teacher/students' },
    { label: 'Send Class Notice', icon: Bell, color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100', path: '/teacher/messages' },
    { label: 'Upload Materials', icon: BookOpen, color: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100', path: '/teacher/materials' }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <GraduationCap className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-100 mb-3 border border-white/10">
            <Clock className="w-3.5 h-3.5" /> Academic Term 2026-2027
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {user?.name || 'Teacher'}! 👋
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Here is your daily teaching overview. You have <span className="font-bold text-white underline decoration-amber-400 decoration-2">{stats?.todayClassesCount || 0} classes</span> scheduled for today and <span className="font-bold text-white underline decoration-rose-400 decoration-2">{stats?.unreadQueriesCount || 0} parent queries</span> pending response.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/teacher/attendance')}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" /> Mark Attendance
            </button>
            <button 
              onClick={() => navigate('/teacher/homework')}
              className="px-5 py-2.5 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 backdrop-blur-md text-white font-bold text-sm border border-white/20 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Assign Homework
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Classes</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{stats?.assignedClassesCount || 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Across active sections
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{stats?.totalStudents || 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Users className="w-3.5 h-3.5 text-blue-500" /> Enrolled in your classes
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Attendance</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{stats?.pendingAttendanceCount || 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <AlertCircle className="w-3.5 h-3.5" /> Requires submission today
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Parent Queries</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{stats?.unreadQueriesCount || 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-600">
            <Bell className="w-3.5 h-3.5" /> Unread messages
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div>
        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-indigo-600" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer ${action.color}`}
              >
                <Icon className="w-7 h-7 mb-2" />
                <span className="text-xs font-extrabold">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Split: Today's Schedule & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Today's Class Schedule
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Periods & subjects assigned for today</p>
            </div>
            <button 
              onClick={() => navigate('/teacher/timetable')}
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              Full Timetable <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats?.todaySchedule && stats.todaySchedule.length > 0 ? (
            <div className="space-y-3">
              {stats.todaySchedule.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black flex flex-col items-center justify-center text-xs">
                      <span>P{item.period_number || index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm">{item.subject_name || item.subject_id?.name || 'Subject'}</h3>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">
                        Class {item.class_name || 'Assigned'} | Room: {item.room_number || 'Main Building'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      {item.start_time} - {item.end_time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No classes scheduled for today</p>
              <p className="text-xs text-slate-400 mt-1">Check your weekly timetable for upcoming sessions</p>
            </div>
          )}
        </div>

        {/* Latest School Announcements (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" /> Announcements
            </h2>
            <button 
              onClick={() => navigate('/teacher/announcements')}
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View All
            </button>
          </div>

          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann._id} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/60 hover:bg-indigo-50 transition-colors">
                  <div className="flex items-center justify-between text-xs text-indigo-600 font-bold mb-1">
                    <span>{ann.category || 'General'}</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{ann.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">No active circulars</p>
            </div>
          )}
        </div>
      </div>

      {/* Visual Analytics Bar & Quick Action Controls */}
      <DashboardAnalyticsBar role="Teacher" />
    </div>
  );
};

export default TeacherOverview;
