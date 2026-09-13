import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Download, Printer, FileText, FileSpreadsheet, Users, BookOpen } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';

const TimetableReports = () => {
    const { user } = useAuthStore();
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const [cRes, tRes] = await Promise.all([
                    axios.get('/api/timetable/classes', config),
                    axios.get('/api/schooladmin/teachers', config)
                ]);
                setClasses(cRes.data || []);
                setTeachers(tRes.data || []);
                if (cRes.data.length > 0) setSelectedClassId(cRes.data[0]._id);
                if (tRes.data.length > 0) setSelectedTeacherId(tRes.data[0]._id);
            } catch (err) {
                toast.error('Failed to load report parameters');
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) fetchMeta();
    }, [user]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = (reportType) => {
        toast.info(`Exporting ${reportType} report to Excel format...`);
    };

    const handleExportPDF = (reportType) => {
        toast.info(`Generating ${reportType} PDF report...`);
        window.print();
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold">Loading Timetable Reports...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">📊 Timetable Reports & Export Hub</h2>
                <p className="text-xs font-bold text-slate-400 mt-0.5">Generate printable PDF, Excel, and CSV reports for class schedules, teacher workloads, and master timetables</p>
            </div>

            {/* Reports Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Class Timetable Report */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800">Class Timetable Report</h3>
                            <p className="text-[11px] text-slate-400 font-semibold">Single class schedule export</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Select Class</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                        >
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>Class {c.class}-{c.section}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => handleExportPDF('Class Timetable')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                            <FileText className="w-4 h-4" /> PDF
                        </button>
                        <button
                            onClick={() => handleExportExcel('Class Timetable')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4" /> Excel
                        </button>
                    </div>
                </div>

                {/* 2. Teacher Timetable Report */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800">Teacher Timetable Report</h3>
                            <p className="text-[11px] text-slate-400 font-semibold">Individual teacher workload PDF</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Select Teacher</label>
                        <select
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                        >
                            {teachers.map(t => (
                                <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => handleExportPDF('Teacher Timetable')}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                            <FileText className="w-4 h-4" /> PDF
                        </button>
                        <button
                            onClick={() => handleExportExcel('Teacher Timetable')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4" /> Excel
                        </button>
                    </div>
                </div>

                {/* 3. Master School Timetable Report */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800">Master School Timetable</h3>
                            <p className="text-[11px] text-slate-400 font-semibold">Full school schedule overview</p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">Export the complete weekly timetable across all classes and teachers in one master grid.</p>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => handleExportPDF('Master Timetable')}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                            <FileText className="w-4 h-4" /> PDF
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetableReports;
