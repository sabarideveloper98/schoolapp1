import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2, Edit3, UserSquare2, BookOpen, Users } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';

const TeacherAssignment = () => {
    const { user } = useAuthStore();
    const [assignments, setAssignments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        teacher_id: '',
        subject_id: '',
        class_id: '',
        weekly_periods_required: 6,
        is_class_teacher: false,
        is_subject_teacher: true,
        is_lab_required: false,
        lab_type: 'None'
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            const [asgnRes, teachRes, subjRes, classRes] = await Promise.all([
                axios.get('/api/timetable/assignments', config),
                axios.get('/api/schooladmin/teachers', config),
                axios.get('/api/schooladmin/subjects', config),
                axios.get('/api/schooladmin/classes', config)
            ]);

            setAssignments(asgnRes.data || []);
            setTeachers(teachRes.data || []);
            setSubjects(subjRes.data || []);
            setClasses(classRes.data || []);

            if (teachRes.data.length > 0 && !formData.teacher_id) {
                setFormData(prev => ({
                    ...prev,
                    teacher_id: teachRes.data[0]._id,
                    subject_id: subjRes.data[0]?._id || '',
                    class_id: classRes.data[0]?._id || ''
                }));
            }
        } catch (err) {
            toast.error('Failed to load assignment data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchData();
    }, [user]);

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({
            teacher_id: teachers[0]?._id || '',
            subject_id: subjects[0]?._id || '',
            class_id: classes[0]?._id || '',
            weekly_periods_required: 6,
            is_class_teacher: false,
            is_subject_teacher: true,
            is_lab_required: false,
            lab_type: 'None'
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (asgn) => {
        setEditingId(asgn._id);
        setFormData({
            teacher_id: asgn.teacher_id?._id || asgn.teacher_id,
            subject_id: asgn.subject_id?._id || asgn.subject_id,
            class_id: asgn.class_id?._id || asgn.class_id,
            weekly_periods_required: asgn.weekly_periods_required || 6,
            is_class_teacher: asgn.is_class_teacher || false,
            is_subject_teacher: asgn.is_subject_teacher !== false,
            is_lab_required: asgn.is_lab_required || false,
            lab_type: asgn.lab_type || 'None'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('/api/timetable/assignments', {
                ...formData,
                _id: editingId
            }, config);

            toast.success(`Teacher assignment ${editingId ? 'updated' : 'created'} successfully!`);
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save assignment');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this teacher assignment?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/timetable/assignments/${id}`, config);
            toast.success('Assignment removed successfully');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete assignment');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-bold">Loading Teacher Assignments...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">👩‍🏫 Teacher Assignment Matrix</h2>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">Assign teachers, subjects, classes, sections, and weekly periods requirement</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" /> Add Assignment
                </button>
            </div>

            {/* Assignments Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                                <th className="p-4">Teacher</th>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Class & Section</th>
                                <th className="p-4 text-center">Weekly Periods</th>
                                <th className="p-4">Toggles / Lab</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                            {assignments.map(asgn => (
                                <tr key={asgn._id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-bold text-slate-800">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                                                {asgn.teacher_id?.name?.[0] || 'T'}
                                            </div>
                                            <div>
                                                <div>{asgn.teacher_id?.name || 'Unknown Teacher'}</div>
                                                <div className="text-[10px] text-slate-400 font-semibold">{asgn.teacher_id?.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-black text-slate-700">
                                        {asgn.subject_id?.name} ({asgn.subject_id?.code})
                                    </td>
                                    <td className="p-4 font-bold text-slate-800">
                                        Class {asgn.class_id?.class}-{asgn.class_id?.section}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-blue-50 text-blue-700 font-black px-3 py-1 rounded-full text-xs">
                                            {asgn.weekly_periods_required || 6} / wk
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {asgn.is_class_teacher && (
                                                <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[10px]">
                                                    ⭐ Class Teacher
                                                </span>
                                            )}
                                            {asgn.is_lab_required && (
                                                <span className="bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded text-[10px]">
                                                    🧪 {asgn.lab_type} Lab
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(asgn)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(asgn._id)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {assignments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                                        No teacher assignments found. Click "+ Add Assignment" to link teachers with subjects and classes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Create/Edit Assignment */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-800">
                                {editingId ? 'Edit Teacher Assignment' : 'Add Teacher Assignment'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Teacher */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Select Teacher *</label>
                                <select
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                                >
                                    {teachers.map(t => (
                                        <option key={t._id} value={t._id}>{t.name} ({t.qualification})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Select Subject *</label>
                                <select
                                    value={formData.subject_id}
                                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                                >
                                    {subjects.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Class */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Select Class & Section *</label>
                                <select
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                                >
                                    {classes.map(c => (
                                        <option key={c._id} value={c._id}>Class {c.class}-{c.section}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Weekly Periods Required */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Weekly Periods Required</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.weekly_periods_required}
                                    onChange={(e) => setFormData({ ...formData, weekly_periods_required: parseInt(e.target.value) || 6 })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                                />
                            </div>

                            {/* Toggles */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_class_teacher}
                                        onChange={(e) => setFormData({ ...formData, is_class_teacher: e.target.checked })}
                                        className="w-4 h-4 rounded text-blue-600"
                                    />
                                    Class Teacher Toggle (Mark as primary Class Teacher)
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_lab_required}
                                        onChange={(e) => setFormData({ ...formData, is_lab_required: e.target.checked })}
                                        className="w-4 h-4 rounded text-purple-600"
                                    />
                                    Lab Required Toggle
                                </label>

                                {formData.is_lab_required && (
                                    <div className="pl-6 pt-1">
                                        <label className="text-xs font-bold text-slate-600 block mb-1">Lab Type</label>
                                        <select
                                            value={formData.lab_type}
                                            onChange={(e) => setFormData({ ...formData, lab_type: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-800"
                                        >
                                            <option value="Computer">Computer Lab</option>
                                            <option value="Science">Science Lab</option>
                                            <option value="Language">Language Lab</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                                >
                                    Save Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherAssignment;
