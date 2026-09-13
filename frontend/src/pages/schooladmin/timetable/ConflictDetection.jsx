import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';

const ConflictDetection = () => {
    const { user } = useAuthStore();
    const [conflicts, setConflicts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('All'); // 'All', 'Error', 'Warning'
    const [hasScanned, setHasScanned] = useState(false);

    const runConflictCheck = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post('/api/timetable/conflicts', {}, config);
            setConflicts(res.data.conflicts || []);
            setHasScanned(true);
            toast.info(`Conflict check complete. Found ${res.data.count} issue(s).`);
        } catch (err) {
            toast.error('Failed to run conflict detection');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) runConflictCheck();
    }, [user]);

    const filteredConflicts = conflicts.filter(c => {
        if (filter === 'Error') return c.severity === 'Error';
        if (filter === 'Warning') return c.severity === 'Warning';
        return true;
    });

    const errorCount = conflicts.filter(c => c.severity === 'Error').length;
    const warningCount = conflicts.filter(c => c.severity === 'Warning').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">⚠️ Conflict Detection Engine</h2>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">Real-time schedule validation across teacher double-booking, room clashes, and workload limits</p>
                </div>
                <button
                    onClick={runConflictCheck}
                    disabled={loading}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-500/20 cursor-pointer transition-all disabled:opacity-50 self-start sm:self-auto"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> ⚠ Check Conflicts
                </button>
            </div>

            {/* Status Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Issues</p>
                        <h3 className="text-3xl font-black text-slate-800">{conflicts.length}</h3>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-600">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Critical Clashes (Errors)</p>
                        <h3 className="text-3xl font-black text-rose-600">{errorCount}</h3>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600">
                        <ShieldAlert className="w-7 h-7" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Frequency / Load Warnings</p>
                        <h3 className="text-3xl font-black text-amber-600">{warningCount}</h3>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-600">
                        <AlertTriangle className="w-7 h-7" />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
                {['All', 'Error', 'Warning'].map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                            filter === t
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {t} {t === 'Error' ? `(${errorCount})` : t === 'Warning' ? `(${warningCount})` : `(${conflicts.length})`}
                    </button>
                ))}
            </div>

            {/* Conflicts List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {filteredConflicts.map((c, idx) => (
                        <div key={idx} className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${c.severity === 'Error' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                {c.severity === 'Error' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-800">{c.conflict_type}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${c.severity === 'Error' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {c.severity}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium">{c.description}</p>
                                {(c.day || c.period_name) && (
                                    <div className="text-[11px] text-slate-400 font-bold flex items-center gap-2 pt-0.5">
                                        {c.day && <span>Day: {c.day}</span>}
                                        {c.period_name && <span>Period: {c.period_name}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {hasScanned && conflicts.length === 0 && (
                        <div className="p-12 text-center space-y-3">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                            <h4 className="text-base font-black text-slate-800">Zero Conflicts Found!</h4>
                            <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
                                All class timetables, teacher assignments, lab bookings, and workload limits are clean and healthy.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConflictDetection;
