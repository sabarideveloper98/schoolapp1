import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import {
  Plus, Search, Edit2, Trash2, TrendingUp, DollarSign, Download,
  Filter, CheckCircle, RefreshCw, X
} from 'lucide-react';

export default function IncomeManagement() {
  const { user } = useAuthStore();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncomeType, setSelectedIncomeType] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    income_date: new Date().toISOString().split('T')[0],
    income_type: 'Donation',
    amount: '',
    payment_method: 'Bank Transfer',
    reference_number: '',
    description: ''
  });

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/schooladmin/finance/income', config);
      setIncomes(res.data);
    } catch (error) {
      toast.error('Failed to load income entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchIncomes();
  }, [user]);

  const resetForm = () => {
    setFormData({
      income_date: new Date().toISOString().split('T')[0],
      income_type: 'Donation',
      amount: '',
      payment_method: 'Bank Transfer',
      reference_number: '',
      description: ''
    });
    setEditMode(false);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inc) => {
    setFormData({
      income_date: inc.income_date ? new Date(inc.income_date).toISOString().split('T')[0] : '',
      income_type: inc.income_type,
      amount: inc.amount,
      payment_method: inc.payment_method,
      reference_number: inc.reference_number || '',
      description: inc.description || ''
    });
    setEditMode(true);
    setEditingId(inc._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.income_type || !formData.amount) {
      toast.error('Income Type and Amount are required');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`/api/schooladmin/finance/income/${editingId}`, formData, config);
        toast.success('Income record updated');
      } else {
        await axios.post('/api/schooladmin/finance/income', formData, config);
        toast.success('Income entry created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchIncomes();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income entry?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/schooladmin/finance/income/${id}`, config);
      toast.success('Income entry deleted');
      fetchIncomes();
    } catch (error) {
      toast.error('Failed to delete income entry');
    }
  };

  const filteredIncomes = incomes.filter(inc => {
    const matchesSearch =
      inc.income_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.reference_number && inc.reference_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.description && inc.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedIncomeType ? inc.income_type === selectedIncomeType : true;
    const matchesMethod = selectedPaymentMethod ? inc.payment_method === selectedPaymentMethod : true;

    return matchesSearch && matchesType && matchesMethod;
  });

  const exportCSV = () => {
    if (filteredIncomes.length === 0) {
      toast.error('No income records available to export');
      return;
    }

    const headers = ['Income ID', 'Date', 'Type', 'Amount', 'Payment Method', 'Ref No', 'Description'];
    const rows = filteredIncomes.map(i => [
      i.income_id,
      new Date(i.income_date).toLocaleDateString('en-IN'),
      `"${i.income_type}"`,
      i.amount,
      i.payment_method,
      `"${i.reference_number || '-'}"`,
      `"${i.description || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Income_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Income CSV downloaded successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">School Income Management</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Record non-fee revenue streams such as donations, sponsorships, hostel fees, and admission grants</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center text-xs font-black transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Record Income
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search Income ID, Ref No, or Description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
            />
          </div>

          <div>
            <select
              value={selectedIncomeType}
              onChange={(e) => setSelectedIncomeType(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="">-- All Income Types --</option>
              <option value="Admission Fee">Admission Fee</option>
              <option value="Student Fee Collection">Student Fee Collection</option>
              <option value="Transport Fee">Transport Fee</option>
              <option value="Hostel Fee">Hostel Fee</option>
              <option value="Donation">Donation</option>
              <option value="Sponsorship">Sponsorship</option>
              <option value="Other Income">Other Income</option>
            </select>
          </div>

          <div>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="">-- All Payment Methods --</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Online Payment">Online Payment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Income List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Income ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Income Type</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method & Ref</th>
                <th className="p-4">Description</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" /> Loading income records...
                  </td>
                </tr>
              ) : filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    No income records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredIncomes.map((inc) => (
                  <tr key={inc._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 font-mono">
                        {inc.income_id}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-bold">
                      {new Date(inc.income_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 font-black text-slate-800">{inc.income_type}</td>
                    <td className="p-4 font-black text-emerald-600 text-sm">
                      +₹{inc.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{inc.payment_method}</div>
                      <div className="text-[11px] font-mono text-slate-400">{inc.reference_number || '—'}</div>
                    </td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{inc.description || '—'}</td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(inc)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(inc._id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Record"
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

      {/* Income Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">
                {editMode ? 'Edit Income Entry' : 'Record Manual Income'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Income Date *</label>
                <input
                  type="date"
                  required
                  value={formData.income_date}
                  onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
                  className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Income Type *</label>
                <select
                  required
                  value={formData.income_type}
                  onChange={(e) => setFormData({ ...formData, income_type: e.target.value })}
                  className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
                >
                  <option value="Admission Fee">Admission Fee</option>
                  <option value="Student Fee Collection">Student Fee Collection</option>
                  <option value="Transport Fee">Transport Fee</option>
                  <option value="Hostel Fee">Hostel Fee</option>
                  <option value="Donation">Donation</option>
                  <option value="Sponsorship">Sponsorship</option>
                  <option value="Other Income">Other Income</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 50000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online Payment">Online Payment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Reference Number / Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. TRN-8819201"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description / Donor Details</label>
                <textarea
                  rows="3"
                  placeholder="Optional details regarding income source or donor details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  {editMode ? 'Update Entry' : 'Save Income Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
