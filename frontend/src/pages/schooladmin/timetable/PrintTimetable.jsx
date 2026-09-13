import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { Printer, Download, FileSpreadsheet, RefreshCw, Calendar, UserCheck, BookOpen, Layers } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { getSubjectColor } from '../../../utils/timetableColors';

const PrintTimetable = () => {
    const { user } = useAuthStore();
    const [searchParams] = useSearchParams();
    const printRef = useRef();

    const [mode, setMode] = useState('class'); // 'class' | 'teacher'
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);

    const [selectedClassId, setSelectedClassId] = useState(searchParams.get('class_id') || '');
    const [selectedTeacherId, setSelectedTeacherId] = useState(searchParams.get('teacher_id') || '');
    const [academicYear, setAcademicYear] = useState('2026-2027');

    const [classData, setClassData] = useState(null);
    const [teacherData, setTeacherData] = useState(null);
    const [loading, setLoading] = useState(true);

    const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        const fetchDropdowns = async () => {
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

                const tRes = await axios.get('/api/schooladmin/teachers', config);

                setClasses(classesData);
                setTeachers(tRes.data || []);

                if (!selectedClassId && classesData.length > 0) {
                    setSelectedClassId(classesData[0]._id);
                }
                if (!selectedTeacherId && tRes.data.length > 0) {
                    setSelectedTeacherId(tRes.data[0]._id);
                }
            } catch (err) {
                toast.error('Failed to load initial print parameters');
            }
        };

        if (user?.token) fetchDropdowns();
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.token) return;
            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };

                if (mode === 'class' && selectedClassId) {
                    const clsObj = classes.find(c => c._id === selectedClassId);
                    const sec = clsObj?.section || 'A';
                    const res = await axios.get(`/api/timetable/class/${selectedClassId}/${sec}?academic_year=${academicYear}`, config);
                    setClassData(res.data);
                } else if (mode === 'teacher' && selectedTeacherId) {
                    const res = await axios.get(`/api/timetable/teacher/${selectedTeacherId}?academic_year=${academicYear}`, config);
                    setTeacherData(res.data);
                }
            } catch (err) {
                toast.error('Failed to fetch timetable print data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [mode, selectedClassId, selectedTeacherId, academicYear, user, classes]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        try {
            let csvContent = 'data:text/csv;charset=utf-8,';
            
            if (mode === 'class' && classData) {
                const periods = classData.periods || [];
                const header = ['Day', ...periods.map(p => `${p.period_name} (${p.start_time}-${p.end_time})`)].join(',');
                csvContent += header + '\n';

                workingDays.forEach(day => {
                    const row = [day];
                    periods.forEach(p => {
                        const entry = (classData.entries || []).find(e => e.day === day && e.period_name === p.period_name);
                        if (p.type === 'Break' || p.type === 'Lunch') {
                            row.push(`"${p.type}"`);
                        } else if (entry) {
                            const subj = entry.subject_id?.name || 'Subject';
                            const tchr = entry.teacher_id?.name || 'Teacher';
                            row.push(`"${subj} (${tchr})"`);
                        } else {
                            row.push('""');
                        }
                    });
                    csvContent += row.join(',') + '\n';
                });
            } else if (mode === 'teacher' && teacherData) {
                const periods = teacherData.periods || [];
                const header = ['Day', ...periods.map(p => `${p.period_name} (${p.start_time}-${p.end_time})`)].join(',');
                csvContent += header + '\n';

                workingDays.forEach(day => {
                    const row = [day];
                    periods.forEach(p => {
                        const entry = (teacherData.entries || []).find(e => e.day === day && e.period_name === p.period_name);
                        if (p.type === 'Break' || p.type === 'Lunch') {
                            row.push(`"${p.type}"`);
                        } else if (entry) {
                            row.push(`"${entry.subject_name} (${entry.class_name})"`);
                        } else {
                            row.push('""');
                        }
                    });
                    csvContent += row.join(',') + '\n';
                });
            }

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `Timetable_${mode}_${academicYear}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Excel/CSV Export downloaded successfully');
        } catch (err) {
            toast.error('Failed to export CSV');
        }
    };

    const currentClassObj = classes.find(c => c._id === selectedClassId);
    const currentTeacherObj = teachers.find(t => t._id === selectedTeacherId);

    return (
        <div className="space-y-6">
            {/* Screen Header & Controls (Hidden when printing) */}
            <div className="print:hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <Printer className="w-7 h-7 text-blue-600" />
                            Print & Export Timetables
                        </h1>
                        <p className="text-xs font-bold text-slate-400 mt-1">
                            Generate high-resolution printable PDFs or Excel files for classes and teachers
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Export Excel / CSV
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                        >
                            <Printer className="w-4 h-4" />
                            Print / PDF Export
                        </button>
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Filter Selector Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            View Type
                        </label>
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="class">Class Timetable</option>
                            <option value="teacher">Teacher Timetable</option>
                        </select>
                    </div>

                    {mode === 'class' ? (
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Select Class & Section
                            </label>
                            <select
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {classes.map(c => (
                                    <option key={c._id} value={c._id}>Class {c.class} - {c.section}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Select Teacher
                            </label>
                            <select
                                value={selectedTeacherId}
                                onChange={(e) => setSelectedTeacherId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {teachers.map(t => (
                                    <option key={t._id} value={t._id}>{t.name} ({t.qualification || 'Teacher'})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Academic Year
                        </label>
                        <select
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="2026-2027">2026-2027</option>
                            <option value="2025-2026">2025-2026</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Printable Container */}
            <div ref={printRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 print:p-0 print:border-none print:shadow-none">
                {/* School Header */}
                <div className="text-center border-b border-slate-200 pb-6 mb-6">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
                        {user?.school_name || 'SCHOOL MANAGEMENT SYSTEM'}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                        ACADEMIC TIMETABLE SCHEDULER • ACADEMIC YEAR {academicYear}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700">
                        {mode === 'class' ? (
                            <>
                                <span>Class: <strong>{currentClassObj ? `${currentClassObj.class}-${currentClassObj.section}` : 'N/A'}</strong></span>
                                <span>•</span>
                                <span>Incharge Teacher: <strong>{currentClassObj?.class_incharge_id?.name || 'Unassigned'}</strong></span>
                            </>
                        ) : (
                            <>
                                <span>Teacher: <strong>{currentTeacherObj?.name || 'N/A'}</strong></span>
                                <span>•</span>
                                <span>Specialization: <strong>{currentTeacherObj?.qualification || 'Teaching Staff'}</strong></span>
                            </>
                        )}
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="p-12 text-center text-xs font-bold text-slate-400">Loading timetable grid...</div>
                ) : mode === 'class' ? (
                    <div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-300 text-center text-xs">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                                        <th className="p-3 border border-slate-300 w-28 bg-slate-200">Day / Period</th>
                                        {(classData?.periods || []).map(p => (
                                            <th key={p._id || p.period_name} className={`p-2 border border-slate-300 ${p.type === 'Break' || p.type === 'Lunch' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100'}`}>
                                                <div className="font-bold">{p.period_name}</div>
                                                <div className="text-[10px] font-normal text-slate-600">{p.start_time} - {p.end_time}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {workingDays.map(day => (
                                        <tr key={day} className="border-b border-slate-300">
                                            <td className="p-3 border border-slate-300 font-bold bg-slate-50 text-slate-800">
                                                {day}
                                            </td>
                                            {(classData?.periods || []).map(p => {
                                                if (p.type === 'Break' || p.type === 'Lunch') {
                                                    return (
                                                        <td key={p._id || p.period_name} className="p-2 border border-slate-300 bg-amber-50/60 font-bold text-amber-800 text-[11px]">
                                                            {p.type}
                                                        </td>
                                                    );
                                                }

                                                const entry = (classData?.entries || []).find(e => e.day === day && e.period_name === p.period_name);

                                                return (
                                                    <td key={p._id || p.period_name} className="p-2 border border-slate-300 align-top h-16">
                                                        {entry ? (
                                                            <div className="h-full flex flex-col justify-center">
                                                                <div className="font-black text-slate-900 text-xs">
                                                                    {entry.subject_id?.name || 'Subject'}
                                                                </div>
                                                                <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
                                                                    {entry.teacher_id?.name || 'Teacher'}
                                                                </div>
                                                                {entry.room_no && (
                                                                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                                        Room: {entry.room_no}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 font-medium italic text-[10px]">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Signatures */}
                        <div className="mt-16 grid grid-cols-3 text-center text-xs font-bold text-slate-700">
                            <div>
                                <div className="border-t border-slate-400 pt-2 w-40 mx-auto">Class Teacher Signature</div>
                            </div>
                            <div>
                                <div className="border-t border-slate-400 pt-2 w-40 mx-auto">Academic Coordinator</div>
                            </div>
                            <div>
                                <div className="border-t border-slate-400 pt-2 w-40 mx-auto">Principal Signature</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-300 text-center text-xs">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                                        <th className="p-3 border border-slate-300 w-28 bg-slate-200">Day / Period</th>
                                        {(teacherData?.periods || []).map(p => (
                                            <th key={p._id || p.period_name} className={`p-2 border border-slate-300 ${p.type === 'Break' || p.type === 'Lunch' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100'}`}>
                                                <div className="font-bold">{p.period_name}</div>
                                                <div className="text-[10px] font-normal text-slate-600">{p.start_time} - {p.end_time}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {workingDays.map(day => (
                                        <tr key={day} className="border-b border-slate-300">
                                            <td className="p-3 border border-slate-300 font-bold bg-slate-50 text-slate-800">
                                                {day}
                                            </td>
                                            {(teacherData?.periods || []).map(p => {
                                                if (p.type === 'Break' || p.type === 'Lunch') {
                                                    return (
                                                        <td key={p._id || p.period_name} className="p-2 border border-slate-300 bg-amber-50/60 font-bold text-amber-800 text-[11px]">
                                                            {p.type}
                                                        </td>
                                                    );
                                                }

                                                const entry = (teacherData?.entries || []).find(e => e.day === day && e.period_name === p.period_name);

                                                return (
                                                    <td key={p._id || p.period_name} className="p-2 border border-slate-300 align-top h-16">
                                                        {entry ? (
                                                            <div className="h-full flex flex-col justify-center">
                                                                <div className="font-black text-blue-700 text-xs">
                                                                    {entry.subject_name}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-800 mt-0.5">
                                                                    {entry.class_name}
                                                                </div>
                                                                {entry.room_no && (
                                                                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5">
                                                                        Room: {entry.room_no}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 font-medium italic text-[10px]">Free</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Signatures */}
                        <div className="mt-16 grid grid-cols-3 text-center text-xs font-bold text-slate-700">
                            <div>
                                <div className="border-t border-slate-400 pt-2 w-40 mx-auto">Teacher Signature</div>
                            </div>
                            <div>
                                <div className="border-t border-slate-400 pt-2 w-40 mx-auto">Academic Coordinator</div>
                            </div>
                            <div>
                                <div className="border-t border-slate-400 pt-2 w-40 mx-auto">Principal Signature</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Print CSS rules */}
            <style>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:p-0 {
                        padding: 0 !important;
                    }
                    .print\\:border-none {
                        border: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                }
            `}</style>
        </div>
    );
};

export default PrintTimetable;
