import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Power, 
  Users, 
  AlertCircle, 
  X, 
  FileText,
  RefreshCw,
  Sparkles,
  Filter
} from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const SUGGESTED_ROLES = [
  'Driver', 'Peon', 'Accountant', 'Librarian', 'Security', 
  'Office Assistant', 'Cleaner', 'Clerk', 'Lab Assistant', 'Bus Attendant'
];

const StaffRoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});

  const { user } = useAuthStore();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/schooladmin/staff-roles', config);
      setRoles(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch staff roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchRoles();
    }
  }, [user]);

  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      status: 'Active'
    });
    setFormErrors({});
    setIsEditing(false);
    setCurrentId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setFormData({
      name: role.name || '',
      description: role.description || '',
      status: role.status || 'Active'
    });
    setFormErrors({});
    setIsEditing(true);
    setCurrentId(role._id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentId(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Role name must be at least 2 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status
      };

      if (isEditing) {
        await axios.put(`/api/schooladmin/staff-roles/${currentId}`, payload, config);
        toast.success(`Staff role "${payload.name}" updated successfully!`);
      } else {
        await axios.post('/api/schooladmin/staff-roles', payload, config);
        toast.success(`Staff role "${payload.name}" created successfully!`);
      }

      closeModal();
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} staff role`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Are you sure you want to delete the staff role "${role.name}"?`)) {
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.delete(`/api/schooladmin/staff-roles/${role._id}`, config);
      toast.success(res.data?.message || `Role "${role.name}" deleted successfully`);
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete staff role');
    }
  };

  const handleToggleStatus = async (role) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.patch(`/api/schooladmin/staff-roles/${role._id}/toggle-status`, {}, config);
      const newStatus = res.data?.role?.status || (role.status === 'Active' ? 'Inactive' : 'Active');
      toast.success(`Staff role "${role.name}" is now ${newStatus}`);
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  // Filtered roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch = 
        role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'All' ? true : role.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [roles, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = roles.length;
    const active = roles.filter(r => r.status === 'Active').length;
    const inactive = roles.filter(r => r.status === 'Inactive').length;
    const totalStaff = roles.reduce((sum, r) => sum + (r.staffCount || 0), 0);
    return { total, active, inactive, totalStaff };
  }, [roles]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Staff Role Management</h2>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Configure custom designations, driver, accountant, librarian and security positions for non-teaching staff
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_12px_rgba(37,99,235,0.15)] cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Staff Role
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Roles</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Roles</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Inactive Roles</span>
            <h3 className="text-2xl font-black text-slate-400 mt-1">{stats.inactive}</h3>
          </div>
          <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Staff Assigned</span>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{stats.totalStaff}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
        {/* Search & Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {['All', 'Active', 'Inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
            <button
              onClick={fetchRoles}
              className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs transition cursor-pointer ml-1"
              title="Refresh roles"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Roles Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Role Name
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Staff Members
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold">
                    Loading staff roles...
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center space-y-2">
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No staff roles found</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {searchTerm || statusFilter !== 'All' 
                        ? 'Try adjusting your search criteria or filter options.' 
                        : 'Create your first staff role to begin assigning positions to staff.'}
                    </p>
                    {!searchTerm && statusFilter === 'All' && (
                      <button
                        onClick={openCreateModal}
                        className="mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                      >
                        + Create Role
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const isActive = role.status === 'Active';
                  return (
                    <tr key={role._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span className="font-black text-slate-800 text-sm">{role.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium max-w-md">
                        {role.description ? (
                          <span className="line-clamp-2">{role.description}</span>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">No description added</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          <Users className="w-3 h-3 text-blue-500" />
                          {role.staffCount || 0} {role.staffCount === 1 ? 'Staff' : 'Staffs'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleStatus(role)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                          title={`Click to set ${isActive ? 'Inactive' : 'Active'}`}
                        >
                          <Power className={`w-3 h-3 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(role)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Role"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(role)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">
                    {isEditing ? 'Edit Staff Role' : 'Add New Staff Role'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {isEditing ? 'Update designation and role specifications' : 'Define a new non-teaching job role'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Name */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Accountant, Librarian, Security, Peon"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                  className={`w-full h-11 px-3.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 outline-none transition ${
                    formErrors.name
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] font-bold text-red-500 mt-1">{formErrors.name}</p>
                )}

                {/* Suggestions pill box */}
                {!isEditing && (
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Quick Suggestions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_ROLES.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setFormData({ ...formData, name: sug })}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                            formData.name === sug
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Role Description */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Role Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Responsibilities, department, duties, or notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400 transition"
                />
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Role Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={formData.status === 'Active'}
                      onChange={() => setFormData({ ...formData, status: 'Active' })}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Inactive"
                      checked={formData.status === 'Inactive'}
                      onChange={() => setFormData({ ...formData, status: 'Inactive' })}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-500">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                >
                  {submitting 
                    ? 'Saving...' 
                    : isEditing 
                      ? 'Update Role' 
                      : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffRoleManagement;
