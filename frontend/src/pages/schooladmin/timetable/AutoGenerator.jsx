import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Sparkles, CheckCircle2, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../../store/useAuthStore';

const AutoGenerator = () => {
    const { user } = useAuthStore();
    const [classes, setClasses] = useState([]);
    const [selectedClassIds, setSelectedClassIds] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get('/api/timetable/classes', config);
                setClasses(res.data || []);
            } catch (err) {
                toast.error('Failed to fetch classes');
            }
        };
        if (user?.token) fetchClasses();
    }, [user]);

    const toggleClassSelect = (id) => {
        if (selectedClassIds.includes(id)) {
            setSelectedClassIds(selectedClassIds.filter(i => i !== id));
        } else {
            setSelectedClassIds([...selectedClassIds, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedClassIds.length === classes.length) {
            setSelectedClassIds([]);
        } else {
            setSelectedClassIds(classes.map(c => c._id));
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            setLastResult(null);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post('/api/timetable/generate', {
                class_ids: selectedClassIds.length > 0 ? selectedClassIds : null
            }, config);

            setLastResult(res.data);
            toast.success('Automatic Timetable Generation Complete!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Auto generation failed');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">🤖 Auto Timetable Generator Engine</h2>
                        <p className="text-xs text-blue-200 font-semibold mt-0.5">Constraint Satisfaction & Heuristic Optimization Solver</p>
                    </div>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
                    Automatically constructs optimal, zero-conflict schedules for all school classes in seconds. Enforces teacher availability, lab room capacity, Saturday half-days, and teacher workload caps.
                </p>
            </div>

            {/* Enforced Rules Grid */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" /> Active Solver Rules & Constraints
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: 'Zero Teacher Conflicts', desc: 'Prevents double-booking a teacher across multiple classes' },
                        { title: 'Lab Single Booking', desc: 'Computer, Science, and Language labs are booked without overlaps' },
                        { title: 'Teacher Availability', desc: 'Honors teacher unavailable slots and custom off-periods' },
                        { title: 'Subject Period Frequency', desc: 'Fulfills total weekly period count per class subject' },
                        { title: 'Saturday Half-Day Cap', desc: 'Respects 4-period limit on Saturdays' },
                        { title: 'Workload Cap (36 Max)', desc: 'Prevents overloading teachers past weekly max limit' },
                    ].map((rule, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                            <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {rule.title}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">{rule.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Class Selection & Action */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-black text-slate-800">Target Classes</h3>
                        <p className="text-xs text-slate-400 font-bold">Select specific classes or leave empty to generate for all school classes</p>
                    </div>
                    <button
                        onClick={handleSelectAll}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                        {selectedClassIds.length === classes.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {classes.map(c => (
                        <button
                            key={c._id}
                            onClick={() => toggleClassSelect(c._id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                selectedClassIds.includes(c._id)
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            Class {c.class}-{c.section}
                        </button>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                        {selectedClassIds.length === 0 ? 'Selected: All Classes' : `Selected: ${selectedClassIds.length} Classes`}
                    </span>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <Cpu className="w-5 h-5 animate-spin" /> Optimizing Timetable...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" /> 🤖 Auto Generate Timetable
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Results Display */}
            {lastResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                        <div>
                            <h4 className="text-base font-black text-emerald-900">Auto Generation Successfully Completed!</h4>
                            <p className="text-xs text-emerald-700 font-semibold">{lastResult.count} class timetables generated and saved as Published.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <Link to="/school-admin/timetable/class" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                            View Class Timetables <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/school-admin/timetable/conflicts" className="bg-white text-emerald-800 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100">
                            Inspect Conflict Logs
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutoGenerator;
