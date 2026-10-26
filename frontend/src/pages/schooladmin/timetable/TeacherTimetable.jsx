import { useState, useEffect } from 'react';
import SearchableSelect from '../../../components/SearchableSelect';
import axios from 'axios';
import { toast } from 'react-toastify';
import { UserCheck, CheckCircle, AlertTriangle, Calendar, Clock, MapPin, Printer, RefreshCw, Edit3 } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { getSubjectColor } from '../../../utils/timetableColors';
import { parseTime } from './TimetableSettings';

const TeacherTimetable = ({ preselectedTeacherId = null }) => {
    const { user } = useAuthStore();
    const isTeacher = user?.role === 'Teacher';
    const effectiveTeacherId = preselectedTeacherId || (isTeacher ? (user?.reference_id || user?._id) : null);

    const [teachers, setTeachers] = useState([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState(effectiveTeacherId || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Period Timing Edit Modal State
    const [editingPeriodIdx, setEditingPeriodIdx] = useState(null);
    const [periodForm, setPeriodForm] = useState({
        _id: null,
        period_name: '',
        start_time: '',
        end_time: '',
        type: 'Teaching Period'
    });

    // Fetch teachers list only for Admin roles
    useEffect(() => {
        if (effectiveTeacherId) {
            setSelectedTeacherId(effectiveTeacherId);
            if (isTeacher) {
                setLoading(false);
                return;
            }
        }

        if (isTeacher) {
            setSelectedTeacherId('me');
            setLoading(false);
            return;
        }

        const fetchTeachers = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get('/api/schooladmin/teachers', config);
                const list = res.data || [];
                setTeachers(list);
                if (preselectedTeacherId) {
                    setSelectedTeacherId(preselectedTeacherId);
                } else if (list.length > 0 && !selectedTeacherId) {
                    setSelectedTeacherId(list[0]._id);
                }
            } catch (err) {
                console.error('Fetch teachers error:', err);
                toast.error('Failed to fetch teachers');
            } finally {
                setLoading(false);
            }
        };

        if (user?.token && !isTeacher) {
            fetchTeachers();
        }
    }, [user, preselectedTeacherId, effectiveTeacherId, isTeacher]);

    // Fetch teacher timetable data
    const fetchTeacherSchedule = async () => {
        const idToFetch = selectedTeacherId || (isTeacher ? (user?.reference_id || user?._id || 'me') : '');
        if (!idToFetch) return;

        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user?.token}` } };
            const res = await axios.get(`/api/timetable/teacher/${idToFetch}`, config);
            setData(res.data);
        } catch (err) {
            console.error('Fetch teacher schedule error:', err);
            toast.error(err.response?.data?.message || 'Failed to fetch teacher schedule');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token && (selectedTeacherId || isTeacher)) {
            fetchTeacherSchedule();
        }
    }, [selectedTeacherId, user, isTeacher]);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[380px] bg-white rounded-2xl border border-slate-100 p-8 shadow-xs">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-base font-bold text-slate-700">Loading Timetable Details...</div>
                <div className="text-xs text-slate-400 mt-1">Fetching weekly schedule and periods</div>
            </div>
        );
    }

    const workingDays = data?.settings?.working_days && data.settings.working_days.length > 0
        ? data.settings.working_days
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const periodsList = (data?.periods && data.periods.length > 0)
        ? data.periods
        : (data?.settings?.generated_periods && data.settings.generated_periods.length > 0)
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

    // Build lookup grid for teacher schedule slots (case-insensitive period matching)
    const scheduleMap = {};
    const items = data?.schedule || data?.entries || [];
    items.forEach(item => {
        if (!item.day || !item.period_name) return;
        scheduleMap[`${item.day}-${item.period_name}`] = item;
        scheduleMap[`${item.day}-${item.period_name.toUpperCase()}`] = item;
        scheduleMap[`${item.day}-${item.period_name.toLowerCase()}`] = item;
    });

    const formatClassName = (name) => {
        if (!name) return 'Class';
        return name.startsWith('Class') ? name : `Class ${name}`;
    };

    // Calculate daily period load
    const dailyCounts = {};
    workingDays.forEach(day => {
        dailyCounts[day] = items.filter(s => s.day === day).length;
    });

    // Period timing modal handlers
    const handleOpenEditPeriodModal = (periodObj, idx) => {
        if (!periodObj) return;
        const pNameLower = (periodObj.period_name || '').toLowerCase();
        const derivedType = (periodObj.is_lunch || periodObj.type === 'Lunch' || pNameLower.includes('lunch'))
            ? 'Lunch'
            : (periodObj.is_break || periodObj.type === 'Break' || pNameLower.includes('break'))
                ? 'Break'
                : (periodObj.type || 'Teaching Period');
        setPeriodForm({
            _id: periodObj._id || null,
            period_name: periodObj.period_name || '',
            start_time: periodObj.start_time || '',
            end_time: periodObj.end_time || '',
            type: derivedType
        });
        setEditingPeriodIdx(idx);
    };

    const handleSavePeriodTiming = async () => {
        if (!periodForm.period_name?.trim() || !periodForm.start_time?.trim() || !periodForm.end_time?.trim()) {
            toast.error('Please fill in Period Name, Start Time, and End Time');
            return;
        }

        const startMins = parseTime(periodForm.start_time);
        const endMins = parseTime(periodForm.end_time);

        if (startMins === null || endMins === null) {
            toast.error('Invalid time format. Please use format like "09:00 AM".');
            return;
        }

        if (endMins <= startMins) {
            toast.error(`Invalid timing: End time (${periodForm.end_time}) must be later than start time (${periodForm.start_time}).`);
            return;
        }

        const isLunch = periodForm.type === 'Lunch';
        const isBreak = periodForm.type === 'Break';
        const updatedItem = {
            ...(periodForm._id ? { _id: periodForm._id } : {}),
            period_name: periodForm.period_name.trim(),
            start_time: periodForm.start_time.trim(),
            end_time: periodForm.end_time.trim(),
            type: periodForm.type,
            is_lunch: isLunch,
            is_break: isBreak
        };

        const updatedPeriods = periodsList.map((p, idx) => (idx === editingPeriodIdx ? updatedItem : p));

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const payload = {
                ...(data?.settings || {}),
                academic_year: data?.settings?.academic_year || '2026-2027',
                generated_periods: updatedPeriods
            };
            await axios.post('/api/timetable/settings', payload, config);
            setData(prev => {
                if (!prev) return prev;
                const newSettings = prev.settings ? { ...prev.settings, generated_periods: updatedPeriods } : { generated_periods: updatedPeriods };
                return {
                    ...prev,
                    periods: updatedPeriods,
                    settings: newSettings
                };
            });
            setEditingPeriodIdx(null);
            toast.success(`Period "${updatedItem.period_name}" timing updated successfully!`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update period timing';
            toast.error(msg);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header: Personalized for Teacher or Dropdown for Admin */}
            {isTeacher || preselectedTeacherId ? (
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold mb-2">
                            <Calendar className="w-3.5 h-3.5" /> Weekly Timetable
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">
                            {data?.teacher?.name ? `${data.teacher.name}'s Schedule` : 'My Weekly Timetable'}
                        </h2>
                        <p className="text-xs text-blue-100 mt-1 flex flex-wrap items-center gap-2">
                            <span>{data?.teacher?.email || user?.email}</span>
                            {data?.teacher?.domains && data.teacher.domains.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span>Domains: {data.teacher.domains.join(', ')}</span>
                                </>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchTeacherSchedule}
                            title="Refresh Schedule"
                            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors shadow-sm"
                        >
                            <Printer className="w-4 h-4" /> Print Timetable
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">👨‍🏫 Teacher Timetable View</h2>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">Select a teacher to inspect weekly period load and free slots</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {periodsList.length > 0 && (
                            <button
                                type="button"
                                onClick={() => handleOpenEditPeriodModal(periodsList[0], 0)}
                                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                                title="Edit period start and end times"
                            >
                                <Clock className="w-4 h-4 text-blue-600" />
                                Edit Period Timings
                            </button>
                        )}
                        <div className="w-full sm:w-72">
                            <SearchableSelect
                                options={teachers.map(t => ({
                                    value: t._id,
                                    label: `${t.name} (${t.domains?.join(', ') || 'Teacher'})`
                                }))}
                                value={selectedTeacherId}
                                onChange={(val) => setSelectedTeacherId(val)}
                                placeholder="Select Teacher"
                                searchPlaceholder="Search teacher name..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

            {/* Daily Breakdown Chips */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-500">Daily Period Distribution:</span>
                <div className="flex flex-wrap items-center gap-2">
                    {workingDays.map(day => (
                        <div key={day} className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs">
                            <span className="text-slate-400">{day.slice(0, 3)}:</span>
                            <span className="font-black text-blue-600">{dailyCounts[day] || 0}</span>
                            <span className="text-[10px] text-slate-400">periods</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timetable Grid View */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                            <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                                <th className="p-3.5 text-center border-r border-slate-800 w-36">Period & Time</th>
                                {workingDays.map(day => (
                                    <th key={day} className="p-3.5 text-center border-r border-slate-800">
                                        <div>{day}</div>
                                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">{dailyCounts[day] || 0} periods</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                            {periodsList.map((pObj, idx) => {
                                const pNameLower = (pObj.period_name || '').toLowerCase();
                                const isLunch = pObj.is_lunch || pObj.type === 'Lunch' || pNameLower.includes('lunch');
                                const isBreak = pObj.is_break || pObj.type === 'Break' || pNameLower.includes('break');

                                // Check if any day actually has a scheduled period during this slot
                                const hasAnyScheduled = workingDays.some(day => {
                                    const key = `${day}-${pObj.period_name}`;
                                    return !!(scheduleMap[key] || scheduleMap[`${day}-${pObj.period_name.toUpperCase()}`] || scheduleMap[`${day}-${pObj.period_name.toLowerCase()}`]);
                                });

                                // If it is Lunch and has no scheduled classes, display unified Lunch bar
                                if (isLunch && !hasAnyScheduled) {
                                    return (
                                        <tr key={`lunch-${idx}`} className="bg-amber-50/80 font-bold text-amber-800">
                                            <td className="p-3 border-r border-slate-200 text-center text-[11px] bg-amber-100/60">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span>🍽️ LUNCH</span>
                                                    {!isTeacher && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditPeriodModal(pObj, idx)}
                                                            title="Edit Lunch timing"
                                                            className="p-1 rounded-md text-amber-700 hover:text-amber-950 hover:bg-amber-200 transition-colors cursor-pointer"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-amber-700/80 font-medium mt-0.5">{pObj.start_time} - {pObj.end_time}</div>
                                            </td>
                                            <td colSpan={workingDays.length} className="p-3 text-center text-amber-700 tracking-widest font-black uppercase text-xs">
                                                — LUNCH BREAK ({pObj.start_time} - {pObj.end_time}) —
                                            </td>
                                        </tr>
                                    );
                                }

                                // If it is Break and has no scheduled classes, display unified Break bar
                                if (isBreak && !hasAnyScheduled) {
                                    return (
                                        <tr key={`break-${idx}`} className="bg-slate-100/70 font-semibold text-slate-600">
                                            <td className="p-2.5 border-r border-slate-200 text-center text-[11px] bg-slate-200/50">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span>☕ BREAK</span>
                                                    {!isTeacher && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditPeriodModal(pObj, idx)}
                                                            title="Edit Break timing"
                                                            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">{pObj.start_time} - {pObj.end_time}</div>
                                            </td>
                                            <td colSpan={workingDays.length} className="p-2.5 text-center text-slate-500 tracking-wider font-bold uppercase text-[11px]">
                                                — SHORT BREAK ({pObj.start_time} - {pObj.end_time}) —
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={`${pObj.period_name}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3 border-r border-slate-200 font-bold text-slate-700 text-center bg-slate-50/70">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="text-xs uppercase">{pObj.period_name}</span>
                                                {!isTeacher && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditPeriodModal(pObj, idx)}
                                                        title={`Edit timing for ${pObj.period_name}`}
                                                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                {pObj.start_time} - {pObj.end_time}
                                            </div>
                                        </td>

                                        {workingDays.map(day => {
                                            const key = `${day}-${pObj.period_name}`;
                                            const slot = scheduleMap[key] 
                                                || scheduleMap[`${day}-${pObj.period_name.toUpperCase()}`] 
                                                || scheduleMap[`${day}-${pObj.period_name.toLowerCase()}`];

                                            if (slot) {
                                                const colorClass = getSubjectColor(slot.subject_name);
                                                return (
                                                    <td key={day} className="p-2 border-r border-slate-200 align-middle">
                                                        <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center shadow-xs transition-all hover:scale-[1.02] ${colorClass}`}>
                                                            <div className="font-black text-xs">{slot.subject_name}</div>
                                                            <div className="text-[10px] font-bold opacity-90 mt-0.5">
                                                                {formatClassName(slot.className)}
                                                            </div>
                                                            {slot.room_no && (
                                                                <div className="text-[9px] opacity-75 mt-0.5 flex items-center gap-0.5">
                                                                    <MapPin className="w-2.5 h-2.5 inline" /> {slot.room_no}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            // Free Slot
                                            return (
                                                <td key={day} className="p-2 border-r border-slate-200 align-middle bg-slate-50/20">
                                                    <div className="p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 font-semibold text-center text-[11px] uppercase tracking-wider">
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

            {/* Timetable Details Summary Table */}
            {items.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h3 className="text-base font-black text-slate-800 mb-3 flex items-center gap-2">
                        <span>📋</span> Assigned Classes & Subjects Breakdown ({items.length} periods)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                                    <th className="py-2.5 px-3">Day</th>
                                    <th className="py-2.5 px-3">Period</th>
                                    <th className="py-2.5 px-3">Subject</th>
                                    <th className="py-2.5 px-3">Class</th>
                                    <th className="py-2.5 px-3">Room</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {items.map((slot, i) => (
                                    <tr key={slot._id || i} className="hover:bg-slate-50/60">
                                        <td className="py-2.5 px-3 font-bold text-slate-800">{slot.day}</td>
                                        <td className="py-2.5 px-3">
                                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px]">
                                                {slot.period_name}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-semibold">{slot.subject_name}</td>
                                        <td className="py-2.5 px-3">{formatClassName(slot.className)}</td>
                                        <td className="py-2.5 px-3 text-slate-500">{slot.room_no || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Period Timing Modal */}
            {!isTeacher && editingPeriodIdx !== null && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-blue-600" />
                                Edit Period Timing: {periodForm.period_name}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingPeriodIdx(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {periodsList.length > 1 && (
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Select Period to Edit</label>
                                    <SearchableSelect
                                        options={periodsList.map((p, idx) => ({
                                            value: String(idx),
                                            label: `${p.period_name} (${p.start_time} - ${p.end_time})`
                                        }))}
                                        value={String(editingPeriodIdx)}
                                        onChange={(val) => {
                                            const idx = parseInt(val, 10);
                                            handleOpenEditPeriodModal(periodsList[idx], idx);
                                        }}
                                        placeholder="Select Period"
                                        buttonClassName="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Period / Break Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. P1, Lunch, Break"
                                    value={periodForm.period_name}
                                    onChange={(e) => setPeriodForm({ ...periodForm, period_name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Start Time *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 08:45 AM"
                                        value={periodForm.start_time}
                                        onChange={(e) => setPeriodForm({ ...periodForm, start_time: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">End Time *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 09:25 AM"
                                        value={periodForm.end_time}
                                        onChange={(e) => setPeriodForm({ ...periodForm, end_time: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Period Type</label>
                                <SearchableSelect
                                    options={[
                                        { value: 'Teaching Period', label: 'Teaching Period' },
                                        { value: 'Break', label: 'Break / Short Break' },
                                        { value: 'Lunch', label: 'Lunch Break' }
                                    ]}
                                    value={periodForm.type}
                                    onChange={(val) => setPeriodForm({ ...periodForm, type: val })}
                                    placeholder="Select Period Type..."
                                    buttonClassName="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setEditingPeriodIdx(null)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSavePeriodTiming}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherTimetable;
