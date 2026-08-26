import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, Image as ImageIcon, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

const TeacherManagement = () => {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Editing forms
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Table search & limit
  const [pageSize, setPageSize] = useState(50);
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Dropdown states
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  // Mock status
  const [disabledTeacherIds, setDisabledTeacherIds] = useState(new Set());

  const { user } = useAuthStore();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5005/api/schooladmin/teachers', config);
      setTeachers(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch teachers');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchTeachers();
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const onSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`http://localhost:5005/api/schooladmin/teachers/${editingId}`, data, config);
        toast.success('Teacher updated successfully!');
      }
      closeForm();
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    }
  };

  const handleEdit = (teacher) => {
    setEditMode(true);
    setEditingId(teacher._id);
    setIsFormOpen(true);
    setValue('name', teacher.name);
    setValue('email', teacher.email);
    setValue('phone', teacher.phone);
    setValue('address', teacher.address);
    setValue('qualification', teacher.qualification);
    setValue('experience', teacher.experience);
    setValue('domains', teacher.domains?.join(', ') || '');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this teacher?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`http://localhost:5005/api/schooladmin/teachers/${id}`, config);
        toast.success('Teacher deleted');
        fetchTeachers();
      } catch (error) {
        toast.error('Failed to delete teacher');
      }
    }
  };

  const toggleStatus = (id) => {
    setDisabledTeacherIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    toast.success('Status updated successfully');
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditMode(false);
    setEditingId(null);
    reset();
  };

  // Filter teachers based on search criteria
  const filteredTeachers = teachers.filter(teacher => {
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      return (
        teacher.name?.toLowerCase().includes(searchLower) ||
        teacher.email?.toLowerCase().includes(searchLower) ||
        teacher.phone?.includes(searchLower) ||
        teacher.qualification?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-12 text-slate-550 font-medium">Loading Teacher List...</div>;

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumb */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Teacher List</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="text-blue-600">Teachers</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/school-admin/teachers/create')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(59,130,246,0.15)] flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add New Teacher
        </button>
      </div>

      {/* Main Teacher List Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 overflow-hidden">
        
        {/* Entries page size and Search input */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-10 px-3 border border-slate-200 rounded-lg outline-none bg-white text-slate-700 cursor-pointer focus:border-blue-500 text-xs font-semibold"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>Entries</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 w-full sm:w-auto">
            <span>Search</span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full sm:w-48 h-10 px-3 text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs font-semibold"
              placeholder="Search teacher..."
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-left w-12">
                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">IMAGE</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">NAME</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">PHONE NO</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">EMAIL</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">QUALIFICATION</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">EXPERIENCE</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTeachers.slice(0, pageSize).map((teacher) => {
                const isEnabled = !disabledTeacherIds.has(teacher._id);
                
                return (
                  <tr key={teacher._id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    {/* Checkbox */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                    </td>

                    {/* Image */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {teacher.photo ? (
                        <img src={teacher.photo} alt={teacher.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-150 flex flex-col items-center justify-center p-1">
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-[6px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">No Image</span>
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                      {teacher.name}
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">
                      {teacher.phone || '-'}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                      {teacher.email}
                    </td>

                    {/* Qualification */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                      {teacher.qualification || '-'}
                    </td>

                    {/* Experience */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                      {teacher.experience !== undefined ? `${teacher.experience} yrs` : '-'}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(teacher._id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-rose-500 text-white hover:bg-rose-600'
                        }`}
                      >
                        {isEnabled ? 'Enable' : 'Disable'}
                      </button>
                    </td>

                    {/* Action dropdown */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold relative">
                      <div className="inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === teacher._id ? null : teacher._id)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Actions
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {activeDropdownId === teacher._id && (
                          <div className="absolute right-6 mt-1 w-28 bg-white border border-slate-150 rounded-xl shadow-lg py-1.5 z-20">
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleEdit(teacher);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-slate-750 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleDelete(teacher._id);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400 font-bold">
                    No teachers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog Modal (if inline edits triggered) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800">Edit Teacher</h3>
              <button onClick={closeForm} className="text-slate-450 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Teacher Name</label>
                <input
                  {...register('name', { required: 'Required' })}
                  className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Phone Number</label>
                <input
                  {...register('phone', { required: 'Required' })}
                  className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Qualification</label>
                <input
                  {...register('qualification', { required: 'Required' })}
                  className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Experience (Years)</label>
                <input
                  type="number"
                  {...register('experience', { required: 'Required' })}
                  className="block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Address</label>
                <textarea
                  {...register('address', { required: 'Required' })}
                  rows="3"
                  className="block w-full p-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
