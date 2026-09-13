import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Calendar, Users, BookOpen, UserSquare2, ShieldAlert, Sparkles, Settings, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../../store/useAuthStore';

const StatCard = ({ title, value, icon: Icon, color, subtitle, linkTo }) => {
    const textColorClass = color.replace('bg-', 'text-').replace('-500', '-600');
    return (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 border border-slate-100 flex items-center justify-between transition-all hover:scale-[1.02] duration-300">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800">{value}</h3>
                {subtitle && <p className="text-[11px] font-semibold text-slate-400 mt-1">{subtitle}</p>}
                {linkTo && (
                    <Link to={linkTo} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mt-2">
                        View details <ArrowRight className="w-3 h-3" />
                    </Link>
                )}
            </div>
            <div className={`p-4 rounded-2xl ${color} bg-opacity-10 shrink-0`}>
                <Icon className={`w-7 h-7 ${textColorClass}`} />
            </div>
        </div>
    );
};

const TimetableDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get('/api/timetable/dashboard', config);
                setData(res.data);
            } catch (err) {
                toast.error('Failed to load timetable dashboard');
            } finally {
                setLoading(false);
            }
        };
        if (user?.token) fetchDashboard();
    }, [user]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold">Loading Timetable Dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">📅 Timetable Dashboard</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1">Real-time timetable stats, conflict logs, and teacher workloads</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link to="/school-admin/timetable/auto-generate" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all">
                        <Sparkles className="w-4 h-4" /> Auto Generate
                    </Link>
                    <Link to="/school-admin/timetable/conflicts" className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                        <ShieldAlert className="w-4 h-4" /> Check Conflicts
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Classes" value={data?.totalClasses || 0} icon={BookOpen} color="bg-blue-500" linkTo="/school-admin/timetable/class" />
                <StatCard title="Total Teachers" value={data?.totalTeachers || 0} icon={UserSquare2} color="bg-indigo-500" linkTo="/school-admin/timetable/teacher" />
                <StatCard title="Total Subjects" value={data?.totalSubjects || 0} icon={BookOpen} color="bg-emerald-500" linkTo="/school-admin/timetable/assignments" />
                <StatCard title="Assigned Subjects" value={data?.assignedSubjects || 0} icon={Users} color="bg-amber-500" subtitle={`Out of ${data?.totalSubjects || 0} subjects`} linkTo="/school-admin/timetable/assignments" />
                <StatCard title="Active Timetables" value={data?.activeTimetables || 0} icon={Calendar} color="bg-purple-500" subtitle={`Published timetables`} linkTo="/school-admin/timetable/class" />
                <StatCard title="Conflicts Detected" value={data?.conflictsCount || 0} icon={ShieldAlert} color={data?.conflictsCount > 0 ? "bg-rose-500" : "bg-emerald-500"} subtitle={data?.conflictsCount > 0 ? "Requires resolution" : "System healthy"} linkTo="/school-admin/timetable/conflicts" />
            </div>

            {/* Teacher Workload Breakdown & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Teacher Workload */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-black text-slate-800">Teacher Weekly Workload</h3>
                        <Link to="/school-admin/timetable/teacher" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                        {data?.teacherWorkloads?.slice(0, 8).map(t => (
                            <div key={t.teacher_id} className="py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">{t.name}</p>
                                        <p className="text-[10px] text-slate-400 font-semibold">{t.periods} / {t.max} periods assigned</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${t.status === 'OVERLOADED' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${Math.min(100, (t.periods / t.max) * 100)}%` }}
                                        />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${t.status === 'OVERLOADED' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {t.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Management Links */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 space-y-4">
                    <h3 className="text-base font-black text-slate-800">Quick Operations</h3>
                    <div className="space-y-2.5">
                        <Link to="/school-admin/timetable/class" className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-blue-600" /> Class Timetable Builder</span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                        <Link to="/school-admin/timetable/global" className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-2.5"><BookOpen className="w-4 h-4 text-purple-600" /> Global School Timetable</span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                        <Link to="/school-admin/timetable/assignments" className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-2.5"><UserSquare2 className="w-4 h-4 text-emerald-600" /> Teacher Assignment Matrix</span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                        <Link to="/school-admin/timetable/settings" className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-2.5"><Settings className="w-4 h-4 text-amber-600" /> Timetable Settings</span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetableDashboard;
