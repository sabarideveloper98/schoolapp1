import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';

const FeeCategoryManagement = () => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchCategories = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/schooladmin/fees/categories', config);
      setCategories(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch fee categories');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchCategories();
  }, [user]);

  const onSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`/api/schooladmin/fees/categories/${editingId}`, data, config);
        toast.success('Category updated!');
      } else {
        await axios.post('/api/schooladmin/fees/categories', data, config);
        toast.success('Category created!');
      }
      closeForm();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save fee category');
    }
  };

  const handleEdit = (cat) => {
    setEditMode(true);
    setEditingId(cat._id);
    setIsFormOpen(true);
    setValue('name', cat.name);
    setValue('code', cat.code);
    setValue('description', cat.description);
    setValue('academic_year', cat.academic_year);
    setValue('status', cat.status);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee category?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`/api/schooladmin/fees/categories/${id}`, config);
        toast.success('Category deleted');
        fetchCategories();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditMode(false);
    setEditingId(null);
    reset({
      name: '',
      code: '',
      description: '',
      academic_year: '2025-2026',
      status: 'Active'
    });
  };

  if (loading) return <div className="flex justify-center py-12 text-slate-550 font-semibold">Loading categories...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Fee Categories</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Configure and manage fee categories for mapping school fee structures</p>
        </div>

        <button
          onClick={() => { reset(); setEditMode(false); setEditingId(null); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </button>
      </div>

      {/* Grid listing & configuration form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Table List Column */}
        <div className="lg:col-span-2 overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Academic Year</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{cat.name}</span>
                        <span className="text-xs font-semibold text-slate-400">{cat.description || 'No description'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                      {cat.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600">
                      {cat.academic_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        cat.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="text-blue-600 hover:text-blue-500 cursor-pointer"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          className="text-red-500 hover:text-red-600 cursor-pointer ml-2"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold">
                      No categories configured. Click Add Category to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Input Form Column */}
        {isFormOpen && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
            <h3 className="text-sm font-black text-slate-800">{editMode ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tuition Fee"
                  {...register('name', { required: true })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Category Code *</label>
                <input
                  type="text"
                  placeholder="e.g. TUITION101"
                  {...register('code', { required: true })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Academic Year *</label>
                <select
                  {...register('academic_year', { required: true })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                <select
                  {...register('status')}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                <textarea
                  placeholder="Details of what this category applies to..."
                  {...register('description')}
                  rows="3"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black shadow-md cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default FeeCategoryManagement;
