import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Tag, Percent } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';

const DiscountManagement = () => {
  const { user } = useAuthStore();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchDiscounts = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/schooladmin/fees/discounts', config);
      setDiscounts(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load discounts schemes');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchDiscounts();
  }, [user]);

  const onSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`/api/schooladmin/fees/discounts/${editingId}`, data, config);
        toast.success('Discount scheme updated!');
      } else {
        await axios.post('/api/schooladmin/fees/discounts', data, config);
        toast.success('Discount scheme created!');
      }
      closeForm();
      fetchDiscounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save discount scheme');
    }
  };

  const handleEdit = (scheme) => {
    setEditMode(true);
    setEditingId(scheme._id);
    setIsFormOpen(true);
    setValue('name', scheme.name);
    setValue('type', scheme.type);
    setValue('amount', scheme.amount);
    setValue('reason', scheme.reason);
    setValue('status', scheme.status);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this discount scheme?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`/api/schooladmin/fees/discounts/${id}`, config);
        toast.success('Discount scheme deleted');
        fetchDiscounts();
      } catch (error) {
        toast.error('Failed to delete scheme');
      }
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditMode(false);
    setEditingId(null);
    reset({
      name: '',
      type: 'Fixed',
      amount: '',
      reason: '',
      status: 'Active'
    });
  };

  if (loading) return <div className="flex justify-center py-12 text-slate-550 font-semibold">Loading discount schemes...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Fee Discount Schemes</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Configure percentage-based or fixed-value concessions for scholarships and sibling waivers</p>
        </div>

        <button
          onClick={() => { reset(); setEditMode(false); setEditingId(null); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Configure Discount
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table List */}
        <div className="lg:col-span-2 overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Discount Scheme</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Waiver Value</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason / Criteria</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {discounts.map((scheme) => (
                  <tr key={scheme._id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Tag className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{scheme.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-slate-855">
                      {scheme.type === 'Percentage' ? `${scheme.amount}% Off` : `₹${scheme.amount} Flat`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                      {scheme.reason || 'Concession program'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        scheme.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-550'
                      }`}>
                        {scheme.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(scheme)}
                          className="text-blue-600 hover:text-blue-500 cursor-pointer"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(scheme._id)}
                          className="text-red-500 hover:text-red-650 cursor-pointer ml-2"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {discounts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold">
                      No discount schemes configured. Click Configure Discount to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Input Form */}
        {isFormOpen && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
            <h3 className="text-sm font-black text-slate-800">{editMode ? 'Edit Scheme' : 'Add New Scheme'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Scheme Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sibling Discount"
                  {...register('name', { required: true })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Discount Type *</label>
                <select
                  {...register('type', { required: true })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Fixed">Fixed Amount (₹)</option>
                  <option value="Percentage">Percentage waiver (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Waiver Value *</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  {...register('amount', { required: true, min: 0 })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Applicable to second child..."
                  {...register('reason')}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                />
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
                  Save Scheme
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountManagement;
