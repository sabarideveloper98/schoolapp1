import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import {
  Plus, Search, Edit2, Trash2, Tag, CheckCircle, XCircle,
  FileText, ShieldCheck, RefreshCw
} from 'lucide-react';

export default function ExpenseCategoryManagement() {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active'
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/schooladmin/finance/categories', config);
      setCategories(res.data);
    } catch (error) {
      toast.error('Failed to load expense categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchCategories();
  }, [user]);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 'Active'
    });
    setEditMode(false);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setFormData({
      name: cat.name,
      code: cat.code,
      description: cat.description || '',
      status: cat.status
    });
    setEditMode(true);
    setEditingId(cat._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error('Category Name and Code are required');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`/api/schooladmin/finance/categories/${editingId}`, formData, config);
        toast.success('Category updated successfully');
      } else {
        await axios.post('/api/schooladmin/finance/categories', formData, config);
        toast.success('Expense Category created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense category?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/schooladmin/finance/categories/${id}`, config);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Expense Category Management</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Classify and organize school expenditure streams with standard codes and status rules</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-md shadow-blue-500/10 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search categories by name, code, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
            Clear
          </button>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Code</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" /> Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 font-bold">
                    No expense categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 font-mono">
                        {cat.code}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-800">{cat.name}</td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{cat.description || '—'}</td>
                    <td className="p-4">
                      {cat.status === 'Active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                          <XCircle className="w-3 h-3 mr-1" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">
                {editMode ? 'Edit Category' : 'Add Expense Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity Bill"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Category Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ELEC"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Optional details regarding category allocation..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  {editMode ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
