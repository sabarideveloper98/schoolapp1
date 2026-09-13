import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { UserCheck, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { getSubjectColor } from '../../../utils/timetableColors';

const TeacherTimetable = ({ preselectedTeacherId = null }) => {
    const { user } = useAuthStore();
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch teachers
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get('/api/schooladmin/teachers', config);
                const list = res.data || [];
                setTeachers(list);
                if (preselectedTeacherId) {
                    setSelectedTeacherId(preselectedTeacherId);
                } else if (list.length > 0) {
                    setSelectedTeacherId(list[0]._id);
                }
            } catch (err) {
                toast.error('Failed to fetch teachers');
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) fetchTeachers();
    }, [user, preselectedTeacherId]);

    // Fetch teacher timetable data
    useEffect(() => {
        if (!selectedTeacherId) return;

        const fetchTeacherSchedule = async () => {
            try {
                setLoading(true);
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get(`/api/timetable/teacher/${selectedTeacherId}`, config);
                setData(res.data);
            } catch (err) {
                toast.error('Failed to fetch teacher schedule');
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherSchedule();
    }, [selectedTeacherId, user]);

    if (loading && teachers.length === 0) {
        return <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold">Loading Teacher Timetable...</div>;
    }

    const workingDays = data?.settings?.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periodsList = (data?.settings?.generated_periods && data.settings.generated_periods.length > 0)
        ? data.settings.generated_periods
        : (data?.periods && data.periods.length > 0)
        ? data.periods
        : [
            { period_name: 'P1', start_time: '08:45 AM', end_time: '09:25 AM' },
            { period_name: 'P2', start_time: '09:25 AM', end_time: '10:05 AM' },
            { period_name: 'P3', start_time: '10:05 AM', end_time: '10:45 AM' },
            { period_name: 'P4', start_time: '10:45 AM', end_time: '11:25 AM' },
            { period_name: 'Lunch', start_time: '11:25 AM', end_time: '11:45 AM', is_lunch: true },
            { period_name: 'P5', start_time: '11:45 AM', end_time: '12:25 PM' },
            { period_name: 'P6', start_time: '12:25 PM', end_time: '01:05 PM' },
            { period_name: 'P7', start_time: '01:05 PM', end_time: '01:45 PM' },
            { period_name: 'P8', start_time: '01:45 PM', end_time: '02:25 PM' }
        ];

    // Build lookup grid for teacher schedule slots (supports entries or schedule with case-insensitivity)
    const scheduleMap = {};
    const items = data?.schedule || data?.entries || [];
    items.forEach(item => {
        if (!item.day || !item.period_name) return;
        scheduleMap[`${item.day}-${item.period_name}`] = item;
        scheduleMap[`${item.day}-${item.period_name.toUpperCase()}`] = item;
        scheduleMap[`${item.day}-${item.period_name.toLowerCase()}`] = item;
    });

    return (
        <div className="space-y-6">
            {/* Header & Teacher Dropdown */}
            {!preselectedTeacherId && (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">👨‍🏫 Teacher Timetable View</h2>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">Select a teacher to inspect weekly period load and free slots</p>
                    </div>

                    <div className="w-full sm:w-72">
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Select Teacher</label>
                        <select
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {teachers.map(t => (
                                <option key={t._id} value={t._id}>
                                    {t.name} ({t.domains?.join(', ') || 'Teacher'})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Stat Cards Matching Screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Periods / Week */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-xs">
                    <div className="text-3xl font-black text-blue-600 mb-1">{data?.totalPeriods || 0}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Periods / Week</div>
                </div>

                {/* 2. Maximum Allowed (CBSE/State) */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-xs">
                    <div className="text-3xl font-black text-emerald-600 mb-1">{data?.maxAllowed || 36}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Allowed (CBSE/State)</div>
                </div>

                {/* 3. Workload Status */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-xs">
                    <div className={`text-3xl font-black flex items-center justify-center gap-2 mb-1 ${data?.workloadStatus === 'OVERLOADED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {data?.workloadStatus === 'OVERLOADED' ? (
                            <>
                                <AlertTriangle className="w-7 h-7" /> OVERLOADED
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-7 h-7" /> OK
                            </>
                        )}
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workload Status</div>
                </div>
            </div>

            {/* Timetable Grid View */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                                <th className="p-3.5 text-center border-r border-slate-800 w-32">Period</th>
                                {workingDays.map(day => (
                                    <th key={day} className="p-3.5 text-center border-r border-slate-800">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                            {periodsList.map((pObj) => {
                                const isLunch = pObj.is_lunch || pObj.period_name === 'Lunch';

                                if (isLunch) {
                                    return (
                                        <tr key="Lunch" className="bg-amber-50/80 font-bold text-amber-800">
                                            <td className="p-3 border-r border-slate-200 text-center text-[11px]">
                                                🍽️ LUNCH
                                            </td>
                                            <td colSpan={workingDays.length} className="p-3 text-center text-amber-700 tracking-widest font-black uppercase text-xs">
                                                — LUNCH BREAK —
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={pObj.period_name} className="hover:bg-slate-50/50">
                                        <td className="p-3 border-r border-slate-200 font-bold text-slate-600 text-center bg-slate-50/50">
                                            <div>{pObj.period_name}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{pObj.start_time} - {pObj.end_time}</div>
                                        </td>

                                        {workingDays.map(day => {
                                            const key = `${day}-${pObj.period_name}`;
                                            const slot = scheduleMap[key];

                                            if (slot) {
                                                const colorClass = getSubjectColor(slot.subject_name);
                                                return (
                                                    <td key={day} className="p-2 border-r border-slate-200 align-middle">
                                                        <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center shadow-2xs ${colorClass}`}>
                                                            <div className="font-black text-xs">{slot.subject_name}</div>
                                                            <div className="text-[10px] font-bold opacity-80 mt-0.5">Class {slot.className}</div>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            // Free Slot
                                            return (
                                                <td key={day} className="p-2 border-r border-slate-200 align-middle bg-slate-50/30">
                                                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-100/60 text-slate-400 font-bold text-center text-[11px] uppercase tracking-wider">
                                                        Free
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeacherTimetable;
