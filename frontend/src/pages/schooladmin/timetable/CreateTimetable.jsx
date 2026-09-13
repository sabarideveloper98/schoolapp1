import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSearchParams, Link } from 'react-router-dom';
import { 
    Plus, Save, Send, Sparkles, AlertCircle, Clock, Trash2, 
    CheckCircle2, ShieldAlert, BookOpen, Layers, Check, Edit3 
} from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { getSubjectColor } from '../../../utils/timetableColors';

const CreateTimetable = () => {
    const { user } = useAuthStore();
    const [searchParams] = useSearchParams();

    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [masterTimetables, setMasterTimetables] = useState([]);

    // Filters & Config
    const [academicYear, setAcademicYear] = useState('2026-2027');
    const [selectedClassId, setSelectedClassId] = useState(searchParams.get('class_id') || '');
    const [section, setSection] = useState('A');
    const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

    // Configured Periods
    const [periods, setPeriods] = useState([
        { period_name: 'P1', start_time: '09:00 AM', end_time: '09:45 AM', type: 'Teaching Period' },
        { period_name: 'P2', start_time: '09:45 AM', end_time: '10:30 AM', type: 'Teaching Period' },
        { period_name: 'Break', start_time: '10:30 AM', end_time: '10:45 AM', type: 'Break' },
        { period_name: 'P3', start_time: '10:45 AM', end_time: '11:30 AM', type: 'Teaching Period' },
        { period_name: 'P4', start_time: '11:30 AM', end_time: '12:15 PM', type: 'Teaching Period' },
        { period_name: 'Lunch', start_time: '12:15 PM', end_time: '01:00 PM', type: 'Lunch' },
        { period_name: 'P5', start_time: '01:00 PM', end_time: '01:45 PM', type: 'Teaching Period' },
        { period_name: 'P6', start_time: '01:45 PM', end_time: '02:30 PM', type: 'Teaching Period' },
        { period_name: 'P7', start_time: '02:30 PM', end_time: '03:15 PM', type: 'Teaching Period' },
        { period_name: 'P8', start_time: '03:15 PM', end_time: '04:00 PM', type: 'Teaching Period' }
    ]);

    // Timetable entries grid map: { 'Monday-P1': { subject_id, teacher_id, room_no, remarks, subjectName, teacherName } }
    const [gridMap, setGridMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Assignment Modal state
    const [activeCell, setActiveCell] = useState(null); // { day, period_name, type }
    const [cellForm, setCellForm] = useState({
        subject_id: '',
        teacher_id: '',
        room_no: '',
        remarks: ''
    });

    const fetchMasterTimetables = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`/api/timetable?academic_year=${academicYear}`, config);
            setMasterTimetables(data.timetables || []);
        } catch (e) {}
    };

    useEffect(() => {
        if (user?.token) {
            fetchMasterTimetables();
        }
    }, [user, academicYear]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                
                let classesData = [];
                try {
                    const cRes = await axios.get('/api/schooladmin/classes', config);
                    classesData = cRes.data || [];
                } catch (e) {
                    const cRes = await axios.get('/api/timetable/classes', config);
                    classesData = cRes.data || [];
                }

                if (classesData.length === 0) {
                    try {
                        const cRes = await axios.get('/api/timetable/classes', config);
                        classesData = cRes.data || [];
                    } catch (e) {}
                }

                const [sRes, tRes, aRes, setRes] = await Promise.all([
                    axios.get('/api/schooladmin/subjects', config),
                    axios.get('/api/schooladmin/teachers', config),
                    axios.get('/api/timetable/assignments', config),
                    axios.get('/api/timetable/settings', config).catch(() => null)
                ]);

                setClasses(classesData);
                setSubjects(sRes.data || []);
                setTeachers(tRes.data || []);
                setAssignments(aRes.data || []);

                if (setRes?.data?.generated_periods && setRes.data.generated_periods.length > 0) {
                    setPeriods(setRes.data.generated_periods);
                }
                if (setRes?.data?.working_days && setRes.data.working_days.length > 0) {
                    setWorkingDays(setRes.data.working_days);
                }

                const targetId = searchParams.get('class_id') || (classesData.length > 0 ? classesData[0]._id : '');
                if (targetId) {
                    setSelectedClassId(targetId);
                    const targetCls = classesData.find(c => c._id === targetId);
                    setSection(targetCls?.section || 'A');
                }
            } catch (err) {
                toast.error('Failed to load timetable options');
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) fetchInitialData();
    }, [user]);

    // Fetch existing entries if class changes
    useEffect(() => {
        if (!selectedClassId) return;

        const fetchClassData = async () => {
            try {
                const selectedCls = classes.find(c => c._id === selectedClassId);
                const sec = selectedCls?.section || section;
                setSection(sec);

                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get(`/api/timetable/class/${selectedClassId}/${sec}`, config);

                const newGrid = {};
                (res.data.entries || []).forEach(e => {
                    const key = `${e.day}-${e.period_name}`;
                    newGrid[key] = {
                        subject_id: e.subject_id?._id || e.subject_id,
                        teacher_id: e.teacher_id?._id || e.teacher_id,
                        room_no: e.room_no || '',
                        remarks: e.remarks || '',
                        subjectName: e.subject_id?.name || '',
                        teacherName: e.teacher_id?.name || ''
                    };
                });
                setGridMap(newGrid);
            } catch (err) {
                // Empty grid if not found
            }
        };

        fetchClassData();
    }, [selectedClassId, user, classes]);

    // Auto mapping teacher when subject is selected in modal
    const handleSubjectChange = (subjectId) => {
        const matchingAsgn = assignments.find(a =>
            (a.subject_id?._id || a.subject_id) === subjectId &&
            (a.class_id?._id || a.class_id) === selectedClassId
        );

        const suggestedTeacherId = matchingAsgn
            ? (matchingAsgn.teacher_id?._id || matchingAsgn.teacher_id)
            : (teachers[0]?._id || '');

        setCellForm(prev => ({
            ...prev,
            subject_id: subjectId,
            teacher_id: suggestedTeacherId
        }));
    };

    // Open assignment modal for slot
    const handleCellClick = (day, p) => {
        if (p.type === 'Break' || p.type === 'Lunch') return;

        const key = `${day}-${p.period_name}`;
        const existing = gridMap[key];

        const firstSubjId = subjects[0]?._id || '';
        const matchingAsgn = assignments.find(a =>
            (a.subject_id?._id || a.subject_id) === firstSubjId &&
            (a.class_id?._id || a.class_id) === selectedClassId
        );

        setCellForm({
            subject_id: existing?.subject_id || firstSubjId,
            teacher_id: existing?.teacher_id || (matchingAsgn ? (matchingAsgn.teacher_id?._id || matchingAsgn.teacher_id) : (teachers[0]?._id || '')),
            room_no: existing?.room_no || '',
            remarks: existing?.remarks || ''
        });

        setActiveCell({ day, period_name: p.period_name, type: p.type });
    };

    // Save cell assignment
    const handleSaveCell = () => {
        if (!activeCell) return;
        const key = `${activeCell.day}-${activeCell.period_name}`;

        const subjObj = subjects.find(s => s._id === cellForm.subject_id);
        const teacherObj = teachers.find(t => t._id === cellForm.teacher_id);

        setGridMap(prev => ({
            ...prev,
            [key]: {
                ...cellForm,
                subjectName: subjObj?.name || '',
                teacherName: teacherObj?.name || ''
            }
        }));

        setActiveCell(null);
    };

    // Clear single cell
    const handleClearCell = () => {
        if (!activeCell) return;
        const key = `${activeCell.day}-${activeCell.period_name}`;
        setGridMap(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        setActiveCell(null);
    };

    // Submit full Timetable Creation to Backend
    const handleSaveTimetable = async (status = 'Draft') => {
        try {
            setSaving(true);
            const entriesList = [];

            workingDays.forEach(day => {
                periods.forEach(p => {
                    const key = `${day}-${p.period_name}`;
                    const slot = gridMap[key];
                    if (slot && slot.subject_id) {
                        entriesList.push({
                            day,
                            period_name: p.period_name,
                            subject_id: slot.subject_id,
                            teacher_id: slot.teacher_id,
                            room_no: slot.room_no,
                            remarks: slot.remarks
                        });
                    }
                });
            });

            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/timetable/create', {
                academic_year_id: academicYear,
                class_id: selectedClassId,
                section_id: section,
                entries: entriesList,
                status
            }, config);

            toast.success(`Timetable ${status === 'Published' ? 'published' : 'saved'} successfully!`);
            fetchMasterTimetables();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save timetable');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold">Loading Create Timetable...</div>;
    }

    const availableTeachersForSelectedSubject = teachers.filter(t => {
        if (!cellForm.subject_id) return true;
        return assignments.some(a =>
            (a.subject_id?._id || a.subject_id) === cellForm.subject_id &&
            (a.teacher_id?._id || a.teacher_id) === t._id
        ) || true;
    });

    const scheduledMasterCount = masterTimetables.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Plus className="w-6 h-6 text-blue-600" />
                        Create Class Timetable
                    </h2>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                        Configure period timings, subject daily limits, and auto-mapped teachers
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleSaveTimetable('Draft')}
                        disabled={saving}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                        <Save className="w-4 h-4" /> Save Draft
                    </button>
                    <button
                        onClick={() => handleSaveTimetable('Published')}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                    >
                        <Send className="w-4 h-4" /> Publish Timetable
                    </button>
                </div>
            </div>

            {/* Target Selection Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Target Selection Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Academic Year</label>
                        <input
                            type="text"
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Class / Standard *</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                        >
                            {classes.length === 0 ? (
                                <option value="">No classes found</option>
                            ) : (
                                classes.map(c => (
                                    <option key={c._id} value={c._id}>
                                        Class {c.class} - Section {c.section} {c.class_incharge_id?.name ? `(${c.class_incharge_id.name})` : ''}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Section</label>
                        <input
                            type="text"
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                        />
                    </div>
                </div>
            </div>

            {/* Added Classes & Timetable Status Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            Added School Classes List & Status
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            Click any class card to switch and edit its timetable grid instantly
                        </p>
                    </div>
                    <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 self-start sm:self-auto">
                        <span>Timetables Configured:</span>
                        <span className="text-blue-600 font-black">{scheduledMasterCount} / {classes.length}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classes.map(c => {
                        const master = masterTimetables.find(m => (m.class_id?._id || m.class_id) === c._id);
                        const isSelected = selectedClassId === c._id;
                        const status = master ? master.status : 'Not Created';

                        return (
                            <div
                                key={c._id}
                                onClick={() => {
                                    setSelectedClassId(c._id);
                                    setSection(c.section || 'A');
                                }}
                                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                    isSelected 
                                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm' 
                                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/60 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                                        isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {c.class}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800">
                                            Class {c.class} - Section {c.section}
                                        </h4>
                                        <p className="text-[10px] font-medium text-slate-400">
                                            Incharge: {c.class_incharge_id?.name || 'Unassigned'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        status === 'Published' 
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                            : status === 'Draft' 
                                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                            : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {status}
                                    </span>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-xs">
                                <th className="p-3 w-32 bg-slate-200/70 border-r border-slate-200">Day / Period</th>
                                {periods.map(p => (
                                    <th
                                        key={p.period_name}
                                        className={`p-2.5 text-center border-r border-slate-200 min-w-[110px] ${
                                            p.type === 'Break' ? 'bg-amber-100/70 text-amber-900' :
                                            p.type === 'Lunch' ? 'bg-amber-200/70 text-amber-950' : 'bg-slate-100'
                                        }`}
                                    >
                                        <div className="font-extrabold text-xs">{p.period_name}</div>
                                        <div className="text-[10px] font-normal text-slate-500">{p.start_time} - {p.end_time}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {workingDays.map(day => (
                                <tr key={day} className="hover:bg-slate-50/50 transition-all">
                                    <td className="p-3 font-bold bg-slate-50 border-r border-slate-200 text-xs text-slate-800">
                                        {day}
                                    </td>

                                    {periods.map(p => {
                                        if (p.type === 'Break' || p.type === 'Lunch') {
                                            return (
                                                <td
                                                    key={p.period_name}
                                                    className="p-2 border-r border-slate-200 bg-amber-50/50 text-center font-bold text-amber-800 text-[11px]"
                                                >
                                                    {p.type}
                                                </td>
                                            );
                                        }

                                        const key = `${day}-${p.period_name}`;
                                        const slot = gridMap[key];
                                        const colorClass = slot ? getSubjectColor(slot.subjectName) : 'bg-slate-50/30 text-slate-400 border-dashed border-slate-200';

                                        return (
                                            <td
                                                key={p.period_name}
                                                onClick={() => handleCellClick(day, p)}
                                                className="p-1.5 border-r border-slate-200 align-top h-20 cursor-pointer hover:opacity-90 transition-all"
                                            >
                                                <div className={`h-full rounded-xl p-2 border flex flex-col justify-between ${colorClass}`}>
                                                    {slot ? (
                                                        <>
                                                            <div>
                                                                <div className="font-black text-xs leading-tight">{slot.subjectName}</div>
                                                                <div className="text-[10px] font-semibold opacity-90 mt-0.5">{slot.teacherName}</div>
                                                            </div>
                                                            {slot.room_no && (
                                                                <div className="text-[9px] font-bold opacity-75">Room: {slot.room_no}</div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-[10px] font-semibold text-slate-300">
                                                            + Add Slot
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cell Configurator Modal */}
            {activeCell && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-800">
                                Assign Period: <span className="text-blue-600">{activeCell.day} {activeCell.period_name}</span>
                            </h3>
                            <button
                                onClick={() => setActiveCell(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Subject *</label>
                                <select
                                    value={cellForm.subject_id}
                                    onChange={(e) => handleSubjectChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                >
                                    {subjects.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.code || 'SUB'})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Teacher * (Auto-Mapped)</label>
                                <select
                                    value={cellForm.teacher_id}
                                    onChange={(e) => setCellForm({ ...cellForm, teacher_id: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                >
                                    {teachers.map(t => (
                                        <option key={t._id} value={t._id}>{t.name} ({t.qualification || 'Teacher'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Room No</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 101"
                                        value={cellForm.room_no}
                                        onChange={(e) => setCellForm({ ...cellForm, room_no: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Remarks</label>
                                    <input
                                        type="text"
                                        placeholder="Optional"
                                        value={cellForm.remarks}
                                        onChange={(e) => setCellForm({ ...cellForm, remarks: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                onClick={handleClearCell}
                                className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                                Clear Slot
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveCell(null)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCell}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTimetable;
