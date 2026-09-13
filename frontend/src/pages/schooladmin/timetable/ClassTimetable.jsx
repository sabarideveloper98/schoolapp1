import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldAlert, Save, Send, Sparkles, RotateCcw, RotateCw, Download, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { getSubjectColor } from '../../../utils/timetableColors';

const ClassTimetable = () => {
    const { user } = useAuthStore();
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [classDetails, setClassDetails] = useState(null);
    const [settings, setSettings] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [scheduleGrid, setScheduleGrid] = useState({}); // { 'Monday-P1': { subject_id, teacher_id, subjectName, teacherName } }
    const [timetableStatus, setTimetableStatus] = useState('Not Created');
    const [loading, setLoading] = useState(true);

    // Drag and Drop state
    const [draggedSubject, setDraggedSubject] = useState(null);

    // Undo / Redo stacks
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Selected cell for modal assignment
    const [activeCell, setActiveCell] = useState(null); // { day, period }

    // Fetch classes list
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get('/api/timetable/classes', config);
                setClasses(res.data);
                if (res.data.length > 0) {
                    setSelectedClassId(res.data[0]._id);
                }
            } catch (err) {
                toast.error('Failed to fetch classes');
            } finally {
                setLoading(false);
            }
        };
        if (user?.token) fetchClasses();
    }, [user]);

    // Fetch timetable for selected class
    useEffect(() => {
        if (!selectedClassId) return;

        const fetchClassData = async () => {
            try {
                setLoading(true);
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get(`/api/timetable/class/${selectedClassId}`, config);

                setClassDetails(res.data.classObj);
                setSettings(res.data.settings);
                setAssignments(res.data.assignments || []);
                setTimetableStatus(res.data.timetable?.status || 'Not Created');

                // Build schedule grid map
                const gridMap = {};
                (res.data.timetable?.schedule || []).forEach(slot => {
                    const key = `${slot.day}-${slot.period_name}`;
                    gridMap[key] = {
                        subject_id: slot.subject_id?._id || slot.subject_id,
                        teacher_id: slot.teacher_id?._id || slot.teacher_id,
                        subjectName: slot.subject_id?.name || '',
                        teacherName: slot.teacher_id?.name || '',
                        room: slot.room || 'Main Classroom',
                        is_lab: slot.is_lab || false,
                        lab_type: slot.lab_type || 'None',
                        is_fixed: slot.is_fixed || false
                    };
                });
                setScheduleGrid(gridMap);

                // Reset undo history
                setHistory([gridMap]);
                setHistoryIndex(0);
            } catch (err) {
                toast.error('Failed to fetch class timetable');
            } finally {
                setLoading(false);
            }
        };

        fetchClassData();
    }, [selectedClassId, user]);

    // Save state to undo stack
    const updateGridWithHistory = (newGrid) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newGrid);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setScheduleGrid(newGrid);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setScheduleGrid(history[historyIndex - 1]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setScheduleGrid(history[historyIndex + 1]);
        }
    };

    // Assign subject to cell
    const assignSubjectToCell = (day, period_name, assignmentObj) => {
        if (period_name === 'Lunch') return; // Fixed lunch

        const key = `${day}-${period_name}`;
        const newGrid = { ...scheduleGrid };

        if (!assignmentObj) {
            delete newGrid[key];
        } else {
            newGrid[key] = {
                subject_id: assignmentObj.subject_id?._id || assignmentObj.subject_id,
                teacher_id: assignmentObj.teacher_id?._id || assignmentObj.teacher_id,
                subjectName: assignmentObj.subject_id?.name || assignmentObj.subjectName,
                teacherName: assignmentObj.teacher_id?.name || assignmentObj.teacherName,
                room: assignmentObj.is_lab_required ? `${assignmentObj.lab_type} Lab` : 'Main Classroom',
                is_lab: assignmentObj.is_lab_required || false,
                lab_type: assignmentObj.lab_type || 'None',
                is_fixed: false
            };
        }

        updateGridWithHistory(newGrid);
        setActiveCell(null);
    };

    // Handle Drag & Drop
    const handleDragStart = (asgn) => {
        setDraggedSubject(asgn);
    };

    const handleDrop = (day, period_name) => {
        if (!draggedSubject || period_name === 'Lunch') return;
        assignSubjectToCell(day, period_name, draggedSubject);
        setDraggedSubject(null);
    };

    // Save Draft or Publish
    const handleSave = async (status = 'Draft') => {
        try {
            const schedule = [];
            const days = settings?.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const periods = settings?.generated_periods || [];

            days.forEach(day => {
                periods.forEach(p => {
                    const key = `${day}-${p.period_name}`;
                    const slot = scheduleGrid[key];
                    if (p.is_lunch || p.period_name === 'Lunch') {
                        schedule.push({
                            day,
                            period_name: 'Lunch',
                            is_fixed: true,
                            room: 'Cafeteria'
                        });
                    } else if (slot) {
                        schedule.push({
                            day,
                            period_name: p.period_name,
                            subject_id: slot.subject_id,
                            teacher_id: slot.teacher_id,
                            room: slot.room,
                            is_lab: slot.is_lab,
                            lab_type: slot.lab_type,
                            is_fixed: false
                        });
                    } else {
                        schedule.push({
                            day,
                            period_name: p.period_name,
                            room: 'Main Classroom',
                            is_fixed: false
                        });
                    }
                });
            });

            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/timetable/save', {
                class_id: selectedClassId,
                academic_year: settings?.academic_year || '2026-2027',
                schedule,
                status
            }, config);

            setTimetableStatus(status);
            toast.success(`Class timetable ${status === 'Published' ? 'published' : 'draft saved'} successfully!`);
        } catch (err) {
            toast.error('Failed to save timetable');
        }
    };

    // Auto-Generate
    const handleAutoGenerate = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post('/api/timetable/generate', {
                class_ids: [selectedClassId]
            }, config);

            toast.success('Timetable generated automatically!');
            // Refresh
            const refreshed = await axios.get(`/api/timetable/class/${selectedClassId}`, config);
            const gridMap = {};
            (refreshed.data.timetable?.schedule || []).forEach(slot => {
                const key = `${slot.day}-${slot.period_name}`;
                gridMap[key] = {
                    subject_id: slot.subject_id?._id || slot.subject_id,
                    teacher_id: slot.teacher_id?._id || slot.teacher_id,
                    subjectName: slot.subject_id?.name || '',
                    teacherName: slot.teacher_id?.name || '',
                    room: slot.room || 'Main Classroom',
                    is_lab: slot.is_lab || false,
                    lab_type: slot.lab_type || 'None',
                    is_fixed: slot.is_fixed || false
                };
            });
            updateGridWithHistory(gridMap);
            setTimetableStatus('Published');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Auto generation failed');
        }
    };

    if (loading && classes.length === 0) {
        return <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold">Loading Timetable...</div>;
    }

    const workingDays = settings?.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periodsList = settings?.generated_periods && settings?.generated_periods.length > 0
        ? settings.generated_periods
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

    return (
        <div className="space-y-6">
            {/* Header Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                {/* Class selector buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
                    {classes.map(c => (
                        <button
                            key={c._id}
                            onClick={() => setSelectedClassId(c._id)}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${selectedClassId === c._id
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Class {c.class}-{c.section}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-40 hover:bg-slate-200 cursor-pointer"
                        title="Undo"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-40 hover:bg-slate-200 cursor-pointer"
                        title="Redo"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleAutoGenerate}
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                        <Sparkles className="w-4 h-4" /> Auto Generate
                    </button>

                    <button
                        onClick={() => handleSave('Draft')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                        <Save className="w-4 h-4" /> Save Draft
                    </button>

                    <button
                        onClick={() => handleSave('Published')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                    >
                        <Send className="w-4 h-4" /> Publish
                    </button>
                </div>
            </div>

            {/* Class Details Banner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-3">
                    <span className="bg-slate-200 text-slate-800 font-extrabold px-3 py-1 rounded-lg">
                        🏫 Class {classDetails?.class}-{classDetails?.section}
                    </span>
                    <span>Class Teacher: <strong className="text-slate-900">{classDetails?.class_incharge_id?.name || 'Ms. Priya S'}</strong></span>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                    <span>{periodsList.filter(p => !p.is_lunch).length} periods/day</span>
                    <span>•</span>
                    <span>Mon–Sat (Sat half-day)</span>
                    <span>•</span>
                    <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-md text-[11px]">
                        Total subjects: {assignments.length || 9}
                    </span>
                    <span className={`font-black px-2.5 py-0.5 rounded-md text-[11px] ${timetableStatus === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {timetableStatus}
                    </span>
                </div>
            </div>



            {/* Timetable Grid Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                                <th className="p-3.5 text-center border-r border-slate-800 w-32">Period / Time</th>
                                {workingDays.map(day => (
                                    <th key={day} className="p-3.5 text-center border-r border-slate-800">
                                        {day} {day === 'Saturday' && <span className="text-[10px] font-normal text-amber-300">(Half)</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                            {periodsList.map((periodObj, pIdx) => {
                                const isLunch = periodObj.is_lunch || periodObj.period_name === 'Lunch';

                                if (isLunch) {
                                    return (
                                        <tr key="Lunch" className="bg-amber-50/80 font-bold text-amber-800">
                                            <td className="p-3 border-r border-slate-200 text-center text-[11px]">
                                                🍽️ LUNCH BREAK
                                                <div className="text-[10px] text-amber-600 font-normal">{periodObj.start_time} - {periodObj.end_time}</div>
                                            </td>
                                            <td colSpan={workingDays.length} className="p-3 text-center text-amber-700 tracking-widest font-black uppercase text-sm">
                                                — LUNCH BREAK —
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <tr key={periodObj.period_name} className="hover:bg-slate-50/50">
                                        {/* Period time header */}
                                        <td className="p-3 border-r border-slate-200 font-bold text-slate-600 text-center bg-slate-50/50">
                                            <div>{periodObj.period_name}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                {periodObj.start_time} - {periodObj.end_time}
                                            </div>
                                        </td>

                                        {/* Day slots */}
                                        {workingDays.map(day => {
                                            const key = `${day}-${periodObj.period_name}`;
                                            const slot = scheduleGrid[key];
                                            const colorClass = slot ? getSubjectColor(slot.subjectName) : 'bg-slate-50/30 text-slate-400 border-dashed border-slate-200';

                                            return (
                                                <td
                                                    key={day}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={() => handleDrop(day, periodObj.period_name)}
                                                    onClick={() => setActiveCell({ day, period: periodObj.period_name })}
                                                    className="p-2 border-r border-slate-200 align-top h-20 transition-all hover:bg-blue-50/30 cursor-pointer"
                                                >
                                                    {slot ? (
                                                        <div className={`h-full p-2 rounded-xl border flex flex-col justify-between shadow-2xs ${colorClass}`}>
                                                            <div>
                                                                <div className="font-black text-xs leading-tight">{slot.subjectName}</div>
                                                                <div className="text-[10px] opacity-80 font-semibold mt-0.5">{slot.teacherName}</div>
                                                            </div>
                                                            {slot.is_lab && (
                                                                <div className="mt-1 text-[9px] font-black uppercase tracking-wider bg-white/60 px-1.5 py-0.5 rounded self-start">
                                                                    🧪 {slot.lab_type} Lab
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 font-semibold hover:border-slate-400 hover:text-slate-500 text-[11px]">
                                                            + Assign
                                                        </div>
                                                    )}
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

            {/* Subject Color Legend */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
                <span className="text-slate-400 uppercase text-[10px]">Subject Color Legend:</span>
                {[
                    { name: 'Mathematics', color: 'bg-blue-500' },
                    { name: 'English', color: 'bg-purple-500' },
                    { name: 'Tamil', color: 'bg-pink-500' },
                    { name: 'Science', color: 'bg-emerald-500' },
                    { name: 'Social Studies', color: 'bg-amber-500' },
                    { name: 'Hindi', color: 'bg-red-500' },
                    { name: 'Computer', color: 'bg-cyan-500' },
                    { name: 'PT/Games', color: 'bg-lime-500' },
                    { name: 'Art/Craft', color: 'bg-orange-500' },
                    { name: 'Moral Science', color: 'bg-violet-500' },
                ].map(item => (
                    <div key={item.name} className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span>{item.name}</span>
                    </div>
                ))}
            </div>

            {/* Modal to Assign/Edit cell slot */}
            {activeCell && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-800">
                                Assign Slot: {activeCell.day} ({activeCell.period})
                            </h3>
                            <button onClick={() => setActiveCell(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <p className="text-xs text-slate-500 font-medium">Select a subject-teacher pair assigned to Class {classDetails?.class}-{classDetails?.section}:</p>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {assignments.map(asgn => {
                                const colorClass = getSubjectColor(asgn.subject_id?.name || '');
                                return (
                                    <button
                                        key={asgn._id}
                                        onClick={() => assignSubjectToCell(activeCell.day, activeCell.period, asgn)}
                                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between hover:scale-[1.01] transition-all cursor-pointer ${colorClass}`}
                                    >
                                        <div>
                                            <div className="font-bold text-xs">{asgn.subject_id?.name}</div>
                                            <div className="text-[10px] opacity-80">{asgn.teacher_id?.name}</div>
                                        </div>
                                        {asgn.is_lab_required && (
                                            <span className="text-[10px] font-black uppercase bg-white/70 px-2 py-0.5 rounded">
                                                🧪 {asgn.lab_type}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            {assignments.length === 0 && (
                                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                                    No teacher assignments created for this class yet. Please add teacher assignments first.
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <button
                                onClick={() => assignSubjectToCell(activeCell.day, activeCell.period, null)}
                                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear Cell
                            </button>
                            <button
                                onClick={() => setActiveCell(null)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassTimetable;
