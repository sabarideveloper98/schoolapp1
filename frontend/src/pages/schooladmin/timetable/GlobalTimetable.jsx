import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldAlert, AlertCircle, Edit3, Clock } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { getSubjectColor } from '../../../utils/timetableColors';
import SearchableSelect from '../../../components/SearchableSelect';
import { parseTime } from './TimetableSettings';

const GlobalTimetable = () => {
    const { user } = useAuthStore();
    const [selectedDay, setSelectedDay] = useState('Monday');
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

    useEffect(() => {
        const fetchGlobalTimetable = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get('/api/timetable/global', config);
                setData(res.data);
            } catch (err) {
                toast.error('Failed to fetch global school timetable');
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) fetchGlobalTimetable();
    }, [user]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold">Loading Global Timetable...</div>;
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

    const classesList = data?.classes || [];
    const timetablesList = data?.timetables || [];

    // Helper map for class timetable for selected day
    // matrix[class_id][period_name] = { subjectName, teacherName, teacher_id, isConflict }
    const matrix = {};
    const teacherOccupancies = {}; // teacherOccupancies[period_name][teacher_id] = [class_id]

    timetablesList.forEach(tt => {
        const cId = tt.class_id?._id?.toString() || tt.class_id?.toString();
        if (!matrix[cId]) matrix[cId] = {};

        (tt.schedule || []).forEach(slot => {
            if (slot.day === selectedDay) {
                const tId = slot.teacher_id ? (slot.teacher_id._id || slot.teacher_id).toString() : null;
                const pName = slot.period_name;

                matrix[cId][pName] = {
                    subjectName: slot.subject_id?.name || '',
                    teacherName: slot.teacher_id?.name || '',
                    teacher_id: tId
                };

                if (tId && pName !== 'Lunch') {
                    if (!teacherOccupancies[pName]) teacherOccupancies[pName] = {};
                    if (!teacherOccupancies[pName][tId]) teacherOccupancies[pName][tId] = [];
                    teacherOccupancies[pName][tId].push(cId);
                }
            }
        });
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

        if (startMins !== null && endMins !== null && endMins <= startMins) {
            toast.error(`Invalid timing: End time (${periodForm.end_time}) must be later than start time (${periodForm.start_time}).`);
            return;
        }

        const isLunch = periodForm.type === 'Lunch';
        const isBreak = periodForm.type === 'Break';
        const updatedPeriodItem = {
            ...(periodForm._id ? { _id: periodForm._id } : {}),
            period_name: periodForm.period_name.trim(),
            start_time: periodForm.start_time.trim(),
            end_time: periodForm.end_time.trim(),
            is_lunch: isLunch,
            is_break: isBreak,
            type: periodForm.type
        };

        const updatedPeriodsList = [...periodsList];
        updatedPeriodsList[editingPeriodIdx] = updatedPeriodItem;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const payload = {
                ...(data?.settings || {}),
                generated_periods: updatedPeriodsList
            };

            const res = await axios.post('/api/timetable/settings', payload, config);
            const savedPeriods = res.data?.generated_periods || updatedPeriodsList;

            setData(prev => ({
                ...prev,
                settings: {
                    ...(prev?.settings || {}),
                    generated_periods: savedPeriods
                }
            }));

            setEditingPeriodIdx(null);
            toast.success(`Period "${periodForm.period_name}" timings updated successfully!`);
        } catch (err) {
            console.error('Error saving period timing:', err);
            toast.error(err.response?.data?.message || 'Failed to update period timing');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">🌐 Global School Timetable View</h2>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">Spot teacher clashes and school-wide slot coverage across all active classes simultaneously</p>
                </div>
                {periodsList.length > 0 && (
                    <button
                        type="button"
                        onClick={() => handleOpenEditPeriodModal(periodsList[0], 0)}
                        className="self-start md:self-auto flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit Period Timings</span>
                    </button>
                )}
            </div>

            {/* Day Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {workingDays.map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            selectedDay === day
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Conflict Banner Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs font-semibold text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                    💡 <strong>Conflict detection:</strong> When two classes are assigned the same teacher in the same period, the cell turns RED. The system blocks saving conflicting timetables.
                </span>
            </div>

            {/* Master Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                                <th className="p-3.5 text-center border-r border-slate-800 w-28">Class</th>
                                {periodsList.map((p, idx) => (
                                    <th key={`${p.period_name}-${idx}`} className="p-3 text-center border-r border-slate-800">
                                        <div className="flex items-center justify-center gap-1">
                                            <span>{p.period_name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditPeriodModal(p, idx)}
                                                title={`Edit timing for ${p.period_name}`}
                                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                            >
                                                <Edit3 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-normal lowercase tracking-normal mt-0.5">
                                            {p.start_time} - {p.end_time}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                            {classesList.map(c => {
                                const className = `Class ${c.class}-${c.section}`;

                                return (
                                    <tr key={c._id} className="hover:bg-slate-50/50">
                                        <td className="p-3.5 font-black text-slate-800 text-center border-r border-slate-200 bg-slate-50">
                                            {className}
                                        </td>

                                        {periodsList.map(p => {
                                            const isLunch = p.is_lunch || p.period_name === 'Lunch';
                                            if (isLunch) {
                                                return (
                                                    <td key="Lunch" className="p-2 border-r border-slate-200 text-center bg-amber-50/60 font-bold text-amber-700 text-[11px]">
                                                        —
                                                    </td>
                                                );
                                            }

                                            const slot = matrix[c._id]?.[p.period_name];
                                            const teacherId = slot?.teacher_id;
                                            const isConflict = teacherId && (teacherOccupancies[p.period_name]?.[teacherId]?.length > 1);

                                            if (!slot || (!slot.subjectName && !slot.teacherName)) {
                                                return (
                                                    <td key={p.period_name} className="p-2 border-r border-slate-200 text-center text-slate-300 font-semibold bg-slate-50/20">
                                                        —
                                                    </td>
                                                );
                                            }

                                            if (isConflict) {
                                                return (
                                                    <td key={p.period_name} className="p-2 border-r border-slate-200 align-middle">
                                                        <div className="p-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 font-bold text-center animate-pulse">
                                                            <div className="font-black text-xs">{slot.subjectName}</div>
                                                            <div className="text-[10px] text-rose-700 mt-0.5 flex items-center justify-center gap-1">
                                                                <ShieldAlert className="w-3 h-3" /> {slot.teacherName} (Clash)
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            const colorClass = getSubjectColor(slot.subjectName);

                                            return (
                                                <td key={p.period_name} className="p-2 border-r border-slate-200 align-middle">
                                                    <div className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center shadow-2xs ${colorClass}`}>
                                                        <div className="font-black text-xs">{slot.subjectName}</div>
                                                        <div className="text-[10px] opacity-80 font-bold mt-0.5">{slot.teacherName}</div>
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

            {/* Edit Period Timing Modal */}
            {editingPeriodIdx !== null && (
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

export default GlobalTimetable;
