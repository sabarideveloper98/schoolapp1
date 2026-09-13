import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CalendarRange } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { getSubjectColor } from '../../utils/timetableColors';

const StudentTimetable = () => {
    const { user } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentTimetable = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get('/api/timetable/student', config);
                setData(res.data);
            } catch (err) {
                toast.error('Failed to fetch student timetable');
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) fetchStudentTimetable();
    }, [user]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold">Loading Timetable...</div>;
    }

    const workingDays = data?.settings?.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periodsList = data?.settings?.generated_periods && data?.settings?.generated_periods.length > 0
        ? data.settings.generated_periods
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

    const scheduleMap = {};
    (data?.timetable?.schedule || []).forEach(slot => {
        scheduleMap[`${slot.day}-${slot.period_name}`] = slot;
    });

    return (
        <div className="space-y-6">
            {/* Class Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">📅 My Class Timetable</h2>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                        Class {data?.classObj?.class}-{data?.classObj?.section} • Class Teacher: {data?.classObj?.class_incharge_id?.name || 'Assigned Teacher'}
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                        <thead>
                            <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                                <th className="p-3.5 text-center border-r border-slate-800 w-32">Period</th>
                                {workingDays.map(day => (
                                    <th key={day} className="p-3.5 text-center border-r border-slate-800">{day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                            {periodsList.map(pObj => {
                                if (pObj.is_lunch || pObj.period_name === 'Lunch') {
                                    return (
                                        <tr key="Lunch" className="bg-amber-50/80 font-bold text-amber-800">
                                            <td className="p-3 border-r border-slate-200 text-center text-[11px]">🍽️ LUNCH</td>
                                            <td colSpan={workingDays.length} className="p-3 text-center text-amber-700 tracking-widest font-black uppercase text-xs">
                                                — LUNCH BREAK —
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={pObj.period_name} className="hover:bg-slate-50/50">
                                        <td className="p-3 border-r border-slate-200 font-bold text-slate-600 text-center bg-slate-50">
                                            <div>{pObj.period_name}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{pObj.start_time} - {pObj.end_time}</div>
                                        </td>

                                        {workingDays.map(day => {
                                            const slot = scheduleMap[`${day}-${pObj.period_name}`];

                                            if (slot && slot.subject_id) {
                                                const subjName = slot.subject_id?.name || 'Subject';
                                                const teachName = slot.teacher_id?.name || 'Teacher';
                                                const colorClass = getSubjectColor(subjName);

                                                return (
                                                    <td key={day} className="p-2 border-r border-slate-200 align-middle">
                                                        <div className={`p-2.5 rounded-xl border flex flex-col justify-between shadow-2xs ${colorClass}`}>
                                                            <div className="font-black text-xs">{subjName}</div>
                                                            <div className="text-[10px] opacity-80 font-semibold mt-0.5">{teachName}</div>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={day} className="p-2 border-r border-slate-200 text-center text-slate-300 font-semibold bg-slate-50/20">
                                                    —
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

export default StudentTimetable;
