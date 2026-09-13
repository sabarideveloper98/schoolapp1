import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Settings, Save, Clock, Calendar, UserX, Plus, Trash2, Sparkles, BookOpen, Layers, CheckCircle2, AlertCircle, Edit3, RefreshCw, Wand2 } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';

// Helper to compute default period schedule from parameters
const calculateLivePeriods = (config) => {
    const {
        school_start_time = '08:45 AM',
        period_duration = 40,
        lunch_duration = 20,
        lunch_after_period = 4,
        periods_per_day = 8
    } = config;

    const parseTime = (timeStr) => {
        if (!timeStr) return 8 * 60 + 45;
        const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!match) return 8 * 60 + 45;
        let hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const ampm = match[3] ? match[3].toUpperCase() : 'AM';
        if (ampm === 'PM' && hrs < 12) hrs += 12;
        if (ampm === 'AM' && hrs === 12) hrs = 0;
        return hrs * 60 + mins;
    };

    const formatTime = (totalMins) => {
        let hrs = Math.floor(totalMins / 60) % 24;
        const mins = totalMins % 60;
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        let displayHrs = hrs % 12;
        if (displayHrs === 0) displayHrs = 12;
        const displayMins = mins < 10 ? `0${mins}` : `${mins}`;
        const displayHrsStr = displayHrs < 10 ? `0${displayHrs}` : `${displayHrs}`;
        return `${displayHrsStr}:${displayMins} ${ampm}`;
    };

    let currentMins = parseTime(school_start_time);
    const periods = [];

    for (let i = 1; i <= periods_per_day; i++) {
        const pStart = currentMins;
        const pEnd = pStart + period_duration;
        periods.push({
            period_name: `P${i}`,
            start_time: formatTime(pStart),
            end_time: formatTime(pEnd),
            type: 'Teaching Period',
            is_lunch: false,
            is_break: false
        });
        currentMins = pEnd;

        if (i === lunch_after_period) {
            const lStart = currentMins;
            const lEnd = lStart + lunch_duration;
            periods.push({
                period_name: 'Lunch Break',
                start_time: formatTime(lStart),
                end_time: formatTime(lEnd),
                type: 'Lunch',
                is_lunch: true,
                is_break: false
            });
            currentMins = lEnd;
        }
    }

    return { periods, calculatedEndTime: formatTime(currentMins) };
};

const TimetableSettingsPage = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'availability'
    const [loading, setLoading] = useState(true);

    // General Settings Form
    const [formData, setFormData] = useState({
        academic_year: '2026-2027',
        school_start_time: '08:45 AM',
        school_end_time: '02:25 PM',
        period_duration: 40,
        lunch_duration: 20,
        lunch_after_period: 4,
        periods_per_day: 8,
        working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        saturday_half_day: true,
        saturday_periods: 4,
        max_teacher_weekly_periods: 36
    });

    // Custom Editable Periods Array
    const [customPeriods, setCustomPeriods] = useState([]);
    const [isCustomEdited, setIsCustomEdited] = useState(false);

    // Modal State
    const [editingPeriodIndex, setEditingPeriodIndex] = useState(null); // null = closed, idx = index, -1 = new
    const [periodForm, setPeriodForm] = useState({
        period_name: '',
        start_time: '',
        end_time: '',
        type: 'Teaching Period',
        is_lunch: false,
        is_break: false
    });

    // Teacher Availability state
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [unavailabilities, setUnavailabilities] = useState([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const [setRes, teachRes] = await Promise.all([
                    axios.get('/api/timetable/settings', config),
                    axios.get('/api/schooladmin/teachers', config)
                ]);

                if (setRes.data) {
                    const loadedForm = {
                        academic_year: setRes.data.academic_year || '2026-2027',
                        school_start_time: setRes.data.school_start_time || '08:45 AM',
                        school_end_time: setRes.data.school_end_time || '02:25 PM',
                        period_duration: setRes.data.period_duration || 40,
                        lunch_duration: setRes.data.lunch_duration || 20,
                        lunch_after_period: setRes.data.lunch_after_period || 4,
                        periods_per_day: setRes.data.periods_per_day || 8,
                        working_days: setRes.data.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                        saturday_half_day: setRes.data.saturday_half_day !== false,
                        saturday_periods: setRes.data.saturday_periods || 4,
                        max_teacher_weekly_periods: setRes.data.max_teacher_weekly_periods || 36
                    };
                    setFormData(loadedForm);

                    if (setRes.data.generated_periods && setRes.data.generated_periods.length > 0) {
                        const sanitizedPeriods = setRes.data.generated_periods.map(p => {
                            const derivedType = (p.is_lunch || p.type === 'Lunch') ? 'Lunch' : (p.is_break || p.type === 'Break') ? 'Break' : (p.type || 'Teaching Period');
                            return {
                                period_name: p.period_name || 'Period',
                                start_time: p.start_time || '09:00 AM',
                                end_time: p.end_time || '09:40 AM',
                                type: derivedType,
                                is_lunch: derivedType === 'Lunch',
                                is_break: derivedType === 'Break'
                            };
                        });
                        setCustomPeriods(sanitizedPeriods);
                        setIsCustomEdited(true);
                    } else {
                        const { periods } = calculateLivePeriods(loadedForm);
                        setCustomPeriods(periods);
                    }
                } else {
                    const { periods } = calculateLivePeriods(formData);
                    setCustomPeriods(periods);
                }

                setTeachers(teachRes.data || []);
                if (teachRes.data.length > 0) {
                    setSelectedTeacherId(teachRes.data[0]._id);
                }
            } catch (err) {
                toast.error('Failed to fetch settings');
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) fetchSettings();
    }, [user]);

    // Recalculate default periods if parameters change and custom edit mode is not locked
    const handleParameterChange = (newFormData) => {
        setFormData(newFormData);
        if (!isCustomEdited) {
            const { periods } = calculateLivePeriods(newFormData);
            setCustomPeriods(periods);
        }
    };

    const handleResetAutoPeriods = () => {
        const { periods } = calculateLivePeriods(formData);
        setCustomPeriods(periods);
        setIsCustomEdited(false);
        toast.info('Periods schedule reset to global parameter defaults!');
    };

    // Directly update custom period field on card
    const handleDirectPeriodUpdate = (index, field, value) => {
        setCustomPeriods(prev => {
            const copy = [...prev];
            const item = { ...copy[index], [field]: value };
            if (field === 'type') {
                item.is_lunch = value === 'Lunch';
                item.is_break = value === 'Break';
            }
            copy[index] = item;
            return copy;
        });
        setIsCustomEdited(true);
    };

    // Auto-align next period start times
    const handleAutoAlignNextTimes = () => {
        if (customPeriods.length === 0) return;

        const parseTime = (timeStr) => {
            if (!timeStr) return 8 * 60 + 45;
            const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
            if (!match) return 8 * 60 + 45;
            let hrs = parseInt(match[1], 10);
            const mins = parseInt(match[2], 10);
            const ampm = match[3] ? match[3].toUpperCase() : 'AM';
            if (ampm === 'PM' && hrs < 12) hrs += 12;
            if (ampm === 'AM' && hrs === 12) hrs = 0;
            return hrs * 60 + mins;
        };

        const formatTime = (totalMins) => {
            let hrs = Math.floor(totalMins / 60) % 24;
            const mins = totalMins % 60;
            const ampm = hrs >= 12 ? 'PM' : 'AM';
            let displayHrs = hrs % 12;
            if (displayHrs === 0) displayHrs = 12;
            const displayMins = mins < 10 ? `0${mins}` : `${mins}`;
            const displayHrsStr = displayHrs < 10 ? `0${displayHrs}` : `${displayHrs}`;
            return `${displayHrsStr}:${displayMins} ${ampm}`;
        };

        const aligned = [];
        let currentMins = parseTime(customPeriods[0].start_time || formData.school_start_time);

        customPeriods.forEach(p => {
            const duration = Math.max(10, parseTime(p.end_time) - parseTime(p.start_time) || (p.type === 'Lunch' ? formData.lunch_duration : formData.period_duration));
            const pStart = currentMins;
            const pEnd = pStart + duration;

            aligned.push({
                ...p,
                start_time: formatTime(pStart),
                end_time: formatTime(pEnd)
            });

            currentMins = pEnd;
        });

        setCustomPeriods(aligned);
        setIsCustomEdited(true);
        toast.success('All subsequent period start & end times auto-aligned!');
    };

    // Open Edit Period Modal
    const handleOpenEditModal = (idx) => {
        if (idx === -1) {
            const lastPeriod = customPeriods[customPeriods.length - 1];
            const nextStart = lastPeriod ? lastPeriod.end_time : formData.school_start_time;
            setPeriodForm({
                period_name: `P${customPeriods.length + 1}`,
                start_time: nextStart,
                end_time: nextStart,
                type: 'Teaching Period',
                is_lunch: false,
                is_break: false
            });
            setEditingPeriodIndex(-1);
        } else {
            const target = customPeriods[idx];
            const derivedType = (target.is_lunch || target.type === 'Lunch') ? 'Lunch' : (target.is_break || target.type === 'Break') ? 'Break' : (target.type || 'Teaching Period');
            setPeriodForm({
                period_name: target.period_name || '',
                start_time: target.start_time || '',
                end_time: target.end_time || '',
                type: derivedType,
                is_lunch: derivedType === 'Lunch',
                is_break: derivedType === 'Break'
            });
            setEditingPeriodIndex(idx);
        }
    };

    // Save edited period item from modal
    const handleSavePeriodItem = () => {
        if (!periodForm.period_name || !periodForm.start_time || !periodForm.end_time) {
            toast.error('Please fill in Period Name, Start Time, and End Time');
            return;
        }

        const isLunch = periodForm.type === 'Lunch';
        const isBreak = periodForm.type === 'Break';
        const updatedItem = {
            ...periodForm,
            type: periodForm.type,
            is_lunch: isLunch,
            is_break: isBreak
        };

        if (editingPeriodIndex === -1) {
            setCustomPeriods(prev => [...prev, updatedItem]);
        } else {
            setCustomPeriods(prev => {
                const copy = [...prev];
                copy[editingPeriodIndex] = updatedItem;
                return copy;
            });
        }

        setIsCustomEdited(true);
        setEditingPeriodIndex(null);
        toast.success(`Period "${periodForm.period_name}" updated!`);
    };

    // Delete single period
    const handleDeletePeriodItem = (idx) => {
        setCustomPeriods(prev => prev.filter((_, i) => i !== idx));
        setIsCustomEdited(true);
        toast.success('Period removed from schedule');
    };

    // Fetch availability when selected teacher changes
    useEffect(() => {
        if (!selectedTeacherId) return;

        const fetchAvailability = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get(`/api/timetable/availability?teacher_id=${selectedTeacherId}`, config);
                if (res.data.length > 0) {
                    setUnavailabilities(res.data[0].unavailabilities || []);
                } else {
                    setUnavailabilities([]);
                }
            } catch (err) {
                toast.error('Failed to fetch teacher availability');
            }
        };

        fetchAvailability();
    }, [selectedTeacherId, user]);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const payload = {
                ...formData,
                generated_periods: customPeriods
            };
            const res = await axios.post('/api/timetable/settings', payload, config);
            toast.success('Timetable settings & period schedule saved successfully!');
        } catch (err) {
            toast.error('Failed to save settings');
        }
    };

    const toggleWorkingDay = (day) => {
        if (formData.working_days.includes(day)) {
            setFormData({ ...formData, working_days: formData.working_days.filter(d => d !== day) });
        } else {
            setFormData({ ...formData, working_days: [...formData.working_days, day] });
        }
    };

    // Teacher Availability handlers
    const addUnavailability = (day, period_name) => {
        const exists = unavailabilities.some(u => u.day === day && u.period_name === period_name);
        if (exists) {
            setUnavailabilities(unavailabilities.filter(u => !(u.day === day && u.period_name === period_name)));
        } else {
            setUnavailabilities([...unavailabilities, { day, period_name, reason: 'Unavailable' }]);
        }
    };

    const handleSaveAvailability = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/timetable/availability', {
                teacher_id: selectedTeacherId,
                unavailabilities
            }, config);
            toast.success('Teacher availability saved successfully!');
        } catch (err) {
            toast.error('Failed to save teacher availability');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold">Loading Timetable Settings...</div>;
    }

    const firstPeriodTime = customPeriods[0]?.start_time || formData.school_start_time;
    const lastPeriodTime = customPeriods[customPeriods.length - 1]?.end_time || formData.school_end_time;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Settings className="w-6 h-6 text-blue-600" />
                        Timetable Settings & Period Format
                    </h2>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                        Configure school timing rules and edit individual period, break, and lunch times
                    </p>
                </div>

                {/* Sub-tab navigation */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                            activeTab === 'general' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        General Settings & Periods
                    </button>
                    <button
                        onClick={() => setActiveTab('availability')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                            activeTab === 'availability' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Teacher Availability
                    </button>
                </div>
            </div>

            {/* General Settings Tab */}
            {activeTab === 'general' && (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                    {/* School Hours Parameters */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-600" /> Global Timing Parameters
                            </h3>
                            <button
                                type="button"
                                onClick={handleResetAutoPeriods}
                                className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Auto-Calculate Defaults
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Academic Year</label>
                                <input
                                    type="text"
                                    value={formData.academic_year}
                                    onChange={(e) => handleParameterChange({ ...formData, academic_year: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">School Start Time</label>
                                <input
                                    type="text"
                                    value={formData.school_start_time}
                                    onChange={(e) => handleParameterChange({ ...formData, school_start_time: e.target.value })}
                                    placeholder="08:45 AM"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Estimated End Time</label>
                                <input
                                    type="text"
                                    value={lastPeriodTime}
                                    disabled
                                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-extrabold text-blue-700"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Period Duration (mins)</label>
                                <input
                                    type="number"
                                    value={formData.period_duration}
                                    onChange={(e) => handleParameterChange({ ...formData, period_duration: parseInt(e.target.value) || 40 })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Lunch Duration (mins)</label>
                                <input
                                    type="number"
                                    value={formData.lunch_duration}
                                    onChange={(e) => handleParameterChange({ ...formData, lunch_duration: parseInt(e.target.value) || 20 })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Lunch After Period #</label>
                                <input
                                    type="number"
                                    value={formData.lunch_after_period}
                                    onChange={(e) => handleParameterChange({ ...formData, lunch_after_period: parseInt(e.target.value) || 4 })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                                />
                            </div>
                        </div>

                        {/* Working Days & Saturday Options */}
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Working Days & Saturday Options</h4>

                            <div className="flex flex-wrap gap-2">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleWorkingDay(day)}
                                        className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                                            formData.working_days.includes(day)
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.saturday_half_day}
                                        onChange={(e) => setFormData({ ...formData, saturday_half_day: e.target.checked })}
                                        className="w-4 h-4 rounded text-blue-600"
                                    />
                                    Saturday Half-Day Enabled
                                </label>

                                {formData.saturday_half_day && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-600">Saturday Periods:</span>
                                        <input
                                            type="number"
                                            value={formData.saturday_periods}
                                            onChange={(e) => setFormData({ ...formData, saturday_periods: parseInt(e.target.value) || 4 })}
                                            className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-center"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* EDITABLE PERIOD, BREAK & LUNCH CARDS */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    Period, Break & Lunch Schedule Editor
                                </h3>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">
                                    Edit period names, start times, end times, and break types directly on cards or click Edit
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleAutoAlignNextTimes}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                                    title="Automatically align all subsequent period start times"
                                >
                                    <Wand2 className="w-3.5 h-3.5 text-indigo-600" /> Auto-Align Times
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(-1)}
                                    className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Add Period / Break
                                </button>
                            </div>
                        </div>

                        {/* Interactive Editable Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {customPeriods.map((p, idx) => {
                                const type = p.type || (p.is_lunch ? 'Lunch' : p.is_break ? 'Break' : 'Teaching Period');
                                const isLunch = type === 'Lunch' || p.is_lunch;
                                const isBreak = type === 'Break' || p.is_break;

                                return (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-2xl border space-y-3 transition-all ${
                                            isLunch 
                                                ? 'bg-amber-50/90 border-amber-300 shadow-xs' 
                                                : isBreak 
                                                ? 'bg-purple-50/90 border-purple-200 shadow-xs' 
                                                : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                                        }`}
                                    >
                                        {/* Card Header: Name Input & Type Select */}
                                        <div className="flex items-center justify-between gap-2">
                                            <input
                                                type="text"
                                                value={p.period_name}
                                                onChange={(e) => handleDirectPeriodUpdate(idx, 'period_name', e.target.value)}
                                                className="font-black text-sm bg-white/80 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-900 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <select
                                                value={type}
                                                onChange={(e) => handleDirectPeriodUpdate(idx, 'type', e.target.value)}
                                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                                                    isLunch ? 'bg-amber-200 text-amber-950 border-amber-300' :
                                                    isBreak ? 'bg-purple-200 text-purple-950 border-purple-300' :
                                                    'bg-blue-100 text-blue-900 border-blue-200'
                                                }`}
                                            >
                                                <option value="Teaching Period">Period</option>
                                                <option value="Break">Break</option>
                                                <option value="Lunch">Lunch</option>
                                            </select>
                                        </div>

                                        {/* Direct Time Inputs */}
                                        <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-1.5">
                                            <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-600">
                                                <span>Start:</span>
                                                <input
                                                    type="text"
                                                    value={p.start_time}
                                                    onChange={(e) => handleDirectPeriodUpdate(idx, 'start_time', e.target.value)}
                                                    className="w-24 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-center font-extrabold text-slate-800 text-xs"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-600">
                                                <span>End:</span>
                                                <input
                                                    type="text"
                                                    value={p.end_time}
                                                    onChange={(e) => handleDirectPeriodUpdate(idx, 'end_time', e.target.value)}
                                                    className="w-24 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-center font-extrabold text-slate-800 text-xs"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-1">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditModal(idx)}
                                                className="px-2.5 py-1 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                                            >
                                                <Edit3 className="w-3 h-3" /> Edit Modal
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeletePeriodItem(idx)}
                                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                                                title="Delete Period"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Updated Live Timetable Format Matrix */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                                Class Timetable Grid Format Preview (Reflecting Custom Period Timings)
                            </h4>
                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-center border-collapse text-xs min-w-[750px]">
                                    <thead>
                                        <tr className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                                            <th className="p-3 border-r border-slate-800 w-28">Day / Period</th>
                                            {customPeriods.map((p, pIdx) => {
                                                const isLunch = p.type === 'Lunch' || p.is_lunch;
                                                const isBreak = p.type === 'Break' || p.is_break;
                                                return (
                                                    <th key={pIdx} className={`p-2.5 border-r border-slate-800 ${
                                                        isLunch ? 'bg-amber-800 text-amber-100' : isBreak ? 'bg-purple-900 text-purple-100' : ''
                                                    }`}>
                                                        <div>{p.period_name}</div>
                                                        <div className="text-[9px] font-normal opacity-80">{p.start_time} - {p.end_time}</div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {formData.working_days.map(day => {
                                            const isSaturdayHalf = day === 'Saturday' && formData.saturday_half_day;
                                            return (
                                                <tr key={day} className="hover:bg-slate-50">
                                                    <td className="p-3 border-r border-slate-200 font-bold bg-slate-100 text-slate-800">
                                                        {day} {isSaturdayHalf && <span className="block text-[9px] font-normal text-amber-700">(Half-Day)</span>}
                                                    </td>
                                                    {customPeriods.map((p, pIdx) => {
                                                        const isLunch = p.type === 'Lunch' || p.is_lunch;
                                                        const isBreak = p.type === 'Break' || p.is_break;

                                                        if (isLunch) {
                                                            return (
                                                                <td key={pIdx} className="p-2 border-r border-slate-200 bg-amber-100/70 font-bold text-amber-950 text-[11px]">
                                                                    Lunch Break
                                                                </td>
                                                            );
                                                        }

                                                        if (isBreak) {
                                                            return (
                                                                <td key={pIdx} className="p-2 border-r border-slate-200 bg-purple-100/70 font-bold text-purple-950 text-[11px]">
                                                                    {p.period_name}
                                                                </td>
                                                            );
                                                        }

                                                        if (isSaturdayHalf && pIdx >= formData.saturday_periods) {
                                                            return (
                                                                <td key={pIdx} className="p-2 border-r border-slate-200 bg-slate-100/70 text-slate-400 font-medium italic text-[10px]">
                                                                    Half-Day Off
                                                                </td>
                                                            );
                                                        }

                                                        return (
                                                            <td key={pIdx} className="p-2 border-r border-slate-200 text-slate-600 font-medium text-[11px]">
                                                                Subject Slot
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

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all"
                        >
                            <Save className="w-4 h-4" /> Save Settings & Apply Period Format
                        </button>
                    </div>
                </form>
            )}

            {/* Teacher Availability Matrix Tab */}
            {activeTab === 'availability' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                                <UserX className="w-5 h-5 text-rose-600" /> Teacher Availability Matrix
                            </h3>
                            <p className="text-xs text-slate-400 font-bold mt-0.5">Click slots to mark periods where a teacher is unavailable</p>
                        </div>

                        <div className="w-full sm:w-64">
                            <select
                                value={selectedTeacherId}
                                onChange={(e) => setSelectedTeacherId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                            >
                                {teachers.map(t => (
                                    <option key={t._id} value={t._id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Matrix Grid */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                                    <th className="p-3 text-center border-r border-slate-800 w-28">Period</th>
                                    {formData.working_days.map(day => (
                                        <th key={day} className="p-3 text-center border-r border-slate-800">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs">
                                {customPeriods.map(p => (
                                    <tr key={p.period_name} className="hover:bg-slate-50">
                                        <td className="p-3 border-r border-slate-200 font-black text-slate-700 text-center bg-slate-50">
                                            {p.period_name}
                                            <span className="block text-[9px] font-normal text-slate-400">{p.start_time}</span>
                                        </td>
                                        {formData.working_days.map(day => {
                                            if (p.is_lunch || p.type === 'Lunch') {
                                                return <td key={day} className="p-2 border-r border-slate-200 text-center text-slate-400 font-semibold bg-amber-50/50">Lunch</td>;
                                            }

                                            const isUnavail = unavailabilities.some(u => u.day === day && u.period_name === p.period_name);

                                            return (
                                                <td
                                                    key={day}
                                                    onClick={() => addUnavailability(day, p.period_name)}
                                                    className="p-2 border-r border-slate-200 text-center align-middle cursor-pointer"
                                                >
                                                    <div className={`p-2 rounded-xl border font-bold text-[11px] transition-all ${
                                                        isUnavail ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    }`}>
                                                        {isUnavail ? '❌ Unavailable' : '✔ Available'}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-3">
                        <button
                            onClick={handleSaveAvailability}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all"
                        >
                            <Save className="w-4 h-4" /> Save Availability
                        </button>
                    </div>
                </div>
            )}

            {/* EDIT PERIOD / BREAK MODAL */}
            {editingPeriodIndex !== null && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-blue-600" />
                                {editingPeriodIndex === -1 ? 'Add Period / Break' : `Edit Period: ${periodForm.period_name}`}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingPeriodIndex(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Period / Break Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. P1, Morning Assembly, Short Break, Lunch Break"
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
                                        placeholder="e.g. 09:20 AM"
                                        value={periodForm.start_time}
                                        onChange={(e) => setPeriodForm({ ...periodForm, start_time: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">End Time *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 10:00 AM"
                                        value={periodForm.end_time}
                                        onChange={(e) => setPeriodForm({ ...periodForm, end_time: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Period Type</label>
                                <select
                                    value={periodForm.type}
                                    onChange={(e) => setPeriodForm({ ...periodForm, type: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                >
                                    <option value="Teaching Period">Teaching Period</option>
                                    <option value="Break">Break / Short Break</option>
                                    <option value="Lunch">Lunch Break</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setEditingPeriodIndex(null)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSavePeriodItem}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                            >
                                Done & Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimetableSettingsPage;
