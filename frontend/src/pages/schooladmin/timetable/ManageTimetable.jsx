import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Calendar, Plus, Search, Filter, Edit3, Trash2, Eye, Printer, 
    CheckCircle2, AlertCircle, RefreshCw, Layers, Users, BookOpen, Clock, FileText 
} from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';

const StatWidget = ({ title, value, icon: Icon, color, subtitle }) => {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{value}</h3>
                {subtitle && <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 text-slate-700 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
    );
};

const ManageTimetable = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [timetables, setTimetables] = useState([]);
    const [stats, setStats] = useState({
        totalTimetables: 0,
        classesScheduled: 0,
        totalClasses: 0,
        teachersAssigned: 0,
        unassignedPeriods: 0
    });
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [academicYear, setAcademicYear] = useState('2026-2027');

    const fetchTimetables = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`/api/timetable?academic_year=${academicYear}`, config);
            setTimetables(data.timetables || []);
            setStats({
                totalTimetables: data.totalTimetables || 0,
                classesScheduled: data.classesScheduled || 0,
                totalClasses: data.totalClasses || 0,
                teachersAssigned: data.teachersAssigned || 0,
                unassignedPeriods: data.unassignedPeriods || 0
            });
        } catch (error) {
            toast.error('Failed to fetch timetable list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) {
            fetchTimetables();
        }
    }, [user, academicYear]);

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const newStatus = currentStatus === 'Published' ? 'Draft' : 'Published';
            await axios.put(`/api/timetable/update/${id}`, { status: newStatus }, config);
            toast.success(`Timetable marked as ${newStatus}`);
            fetchTimetables();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update timetable status');
        }
    };

    const handleDelete = async (id, className) => {
        if (!window.confirm(`Are you sure you want to delete the timetable for ${className}?`)) return;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/timetable/delete/${id}`, config);
            toast.success(`Timetable for ${className} deleted successfully`);
            fetchTimetables();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete timetable');
        }
    };

    // Filtered list
    const filteredTimetables = timetables.filter(item => {
        const className = item.class_id ? `${item.class_id.class}-${item.class_id.section}` : '';
        const incharge = item.class_id?.class_incharge_id?.name || '';
        const matchesSearch = className.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              incharge.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Calendar className="w-7 h-7 text-blue-600" />
                        Manage Timetables
                    </h1>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                        View, edit, publish, or remove class master timetables
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchTimetables}
                        className="p-2.5 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                        title="Refresh List"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <Link
                        to="/school-admin/academics/timetable/create"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Timetable
                    </Link>
                </div>
            </div>

            {/* Stat Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatWidget 
                    title="Total Timetables" 
                    value={stats.totalTimetables} 
                    icon={FileText} 
                    color="bg-blue-500 text-blue-600" 
                    subtitle={`Scheduled ${stats.classesScheduled} of ${stats.totalClasses} classes`} 
                />
                <StatWidget 
                    title="Classes Scheduled" 
                    value={`${stats.classesScheduled} / ${stats.totalClasses}`} 
                    icon={BookOpen} 
                    color="bg-emerald-500 text-emerald-600" 
                    subtitle="Class master coverage" 
                />
                <StatWidget 
                    title="Teachers Assigned" 
                    value={stats.teachersAssigned} 
                    icon={Users} 
                    color="bg-indigo-500 text-indigo-600" 
                    subtitle="Active teaching staff" 
                />
                <StatWidget 
                    title="Unassigned Slots" 
                    value={stats.unassignedPeriods} 
                    icon={Clock} 
                    color="bg-amber-500 text-amber-600" 
                    subtitle="Free periods requiring subjects" 
                />
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                        type="text"
                        placeholder="Search class, section, teacher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Academic Year:</span>
                        <select
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="2026-2027">2026-2027</option>
                            <option value="2025-2026">2025-2026</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Timetables Master Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-xs font-bold text-slate-400">Loading master timetables...</div>
                ) : filteredTimetables.length === 0 ? (
                    <div className="p-12 text-center">
                        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-slate-700">No Timetables Found</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1 max-w-sm mx-auto">
                            No master timetables have been created yet or match your search criteria.
                        </p>
                        <Link
                            to="/school-admin/academics/timetable/create"
                            className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-blue-600 hover:underline"
                        >
                            <Plus className="w-4 h-4" /> Create Timetable Now
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Class & Section</th>
                                    <th className="py-4 px-6">Class Incharge</th>
                                    <th className="py-4 px-6">Academic Year</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6">Created / Updated</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredTimetables.map((item) => {
                                    const className = item.class_id ? `${item.class_id.class}-${item.class_id.section}` : 'N/A';
                                    const inchargeName = item.class_id?.class_incharge_id?.name || 'Unassigned';

                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50/50 transition-all">
                                            <td className="py-4 px-6 font-bold text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                                                        {item.class_id?.class || 'C'}
                                                    </div>
                                                    <div>
                                                        <span>{className}</span>
                                                        <p className="text-[10px] font-semibold text-slate-400">Class Master</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-medium text-slate-600">
                                                {inchargeName}
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-slate-600">
                                                {item.academic_year_id}
                                            </td>
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => handleToggleStatus(item._id, item.status)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                                        item.status === 'Published'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    {item.status}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-slate-400 font-medium text-[11px]">
                                                {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                <Link
                                                    to={`/school-admin/academics/timetable/class?class_id=${item.class_id?._id}`}
                                                    className="p-2 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-all"
                                                    title="View Timetable"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Link>

                                                <Link
                                                    to={`/school-admin/academics/timetable/create?class_id=${item.class_id?._id}`}
                                                    className="p-2 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-all"
                                                    title="Edit Timetable"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </Link>

                                                <Link
                                                    to={`/school-admin/academics/timetable/print?class_id=${item.class_id?._id}`}
                                                    className="p-2 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 transition-all"
                                                    title="Print / Export"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                </Link>

                                                <button
                                                    onClick={() => handleDelete(item._id, className)}
                                                    className="p-2 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-all"
                                                    title="Delete Timetable"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageTimetable;
