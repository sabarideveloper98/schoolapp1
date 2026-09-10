import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import {
  Plus, Search, Edit2, Trash2, Printer, Download, Eye, FileText,
  Paperclip, Filter, CheckCircle, Clock, RefreshCw, X, ExternalLink
} from 'lucide-react';

export default function ExpenseManagement() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewExpense, setViewExpense] = useState(null);
  const [printVoucher, setPrintVoucher] = useState(null);

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category_id: '',
    title: '',
    amount: '',
    payment_method: 'Cash',
    reference_number: '',
    description: '',
    attachment_url: '',
    status: 'Paid'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [resExp, resCat] = await Promise.all([
        axios.get('/api/schooladmin/finance/expenses', config),
        axios.get('/api/schooladmin/finance/categories', config)
      ]);
      setExpenses(resExp.data);
      setCategories(resCat.data.filter(c => c.status === 'Active'));
      if (resCat.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: resCat.data[0]._id }));
      }
    } catch (error) {
      toast.error('Failed to load expense registers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user]);

  const resetForm = () => {
    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
      category_id: categories[0]?._id || '',
      title: '',
      amount: '',
      payment_method: 'Cash',
      reference_number: '',
      description: '',
      attachment_url: '',
      status: 'Paid'
    });
    setEditMode(false);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setFormData({
      expense_date: exp.expense_date ? new Date(exp.expense_date).toISOString().split('T')[0] : '',
      category_id: exp.category_id?._id || exp.category_id,
      title: exp.title,
      amount: exp.amount,
      payment_method: exp.payment_method,
      reference_number: exp.reference_number || '',
      description: exp.description || '',
      attachment_url: exp.attachment_url || '',
      status: exp.status
    });
    setEditMode(true);
    setEditingId(exp._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_id || !formData.title || !formData.amount) {
      toast.error('Category, Title, and Amount are required');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`/api/schooladmin/finance/expenses/${editingId}`, formData, config);
        toast.success('Expense record updated');
      } else {
        await axios.post('/api/schooladmin/finance/expenses', formData, config);
        toast.success('Expense record created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/schooladmin/finance/expenses/${id}`, config);
      toast.success('Expense record deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete expense record');
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch =
      exp.expense_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.reference_number && exp.reference_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory ? (exp.category_id?._id || exp.category_id) === selectedCategory : true;
    const matchesMethod = selectedPaymentMethod ? exp.payment_method === selectedPaymentMethod : true;
    const matchesStatus = selectedStatus ? exp.status === selectedStatus : true;

    return matchesSearch && matchesCategory && matchesMethod && matchesStatus;
  });

  const exportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.error('No expenses available to export');
      return;
    }

    const headers = ['Expense ID', 'Date', 'Category', 'Title', 'Amount', 'Method', 'Ref No', 'Status'];
    const rows = filteredExpenses.map(e => [
      e.expense_id,
      new Date(e.expense_date).toLocaleDateString('en-IN'),
      e.category_id?.name || 'N/A',
      `"${e.title}"`,
      e.amount,
      e.payment_method,
      `"${e.reference_number || '-'}"`,
      e.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expense_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report downloaded successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Expense Entry Register</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Record, track, and attach receipts for all school operating expenses</p>
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
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Record Expense
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search Expense ID, Title, or Ref No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="">-- All Categories --</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
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

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="">-- All Statuses --</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Expense ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Title & Category</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method & Ref</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" /> Loading expense records...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    No expense records match your filter parameters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 font-mono">
                        {exp.expense_id}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-bold">
                      {new Date(exp.expense_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-800">{exp.title}</div>
                      <div className="text-[11px] font-bold text-slate-400">{exp.category_id?.name || 'Uncategorized'}</div>
                    </td>
                    <td className="p-4 font-black text-slate-900 text-sm">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{exp.payment_method}</div>
                      <div className="text-[11px] font-mono text-slate-400">{exp.reference_number || '—'}</div>
                    </td>
                    <td className="p-4">
                      {exp.status === 'Paid' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3 mr-1" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-1.5">
                      <button
                        onClick={() => setViewExpense(exp)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPrintVoucher(exp)}
                        className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        title="Print Voucher"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(exp)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp._id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Expense"
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

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">
                {editMode ? 'Edit Expense Record' : 'Record New Expense'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Expense Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name} ({cat.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Expense Title / Payee *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broadband August Bill Payment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 4500"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Reference Number / Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. CHQ-990182 or UPI-88192"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Expense Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Bill / Invoice Attachment Link</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/receipts/bill.pdf"
                    value={formData.attachment_url}
                    onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                    className="flex-1 h-10 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Notes / Description</label>
                <textarea
                  rows="2"
                  placeholder="Optional details regarding vendor or transaction note..."
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  {editMode ? 'Update Expense' : 'Save Expense Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Expense Details Modal */}
      {viewExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-700 font-mono">
                  {viewExpense.expense_id}
                </span>
                <h3 className="text-base font-black text-slate-800 mt-1">{viewExpense.title}</h3>
              </div>
              <button onClick={() => setViewExpense(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-bold text-slate-400">Expense Date:</span>
                <span className="font-black text-slate-800">{new Date(viewExpense.expense_date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-bold text-slate-400">Category:</span>
                <span className="font-black text-slate-800">{viewExpense.category_id?.name || 'Uncategorized'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-bold text-slate-400">Amount Paid:</span>
                <span className="font-black text-emerald-600 text-sm">₹{viewExpense.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-bold text-slate-400">Payment Method:</span>
                <span className="font-bold text-slate-700">{viewExpense.payment_method}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-bold text-slate-400">Reference Number:</span>
                <span className="font-mono font-bold text-slate-700">{viewExpense.reference_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-bold text-slate-400">Status:</span>
                <span className="font-black text-slate-800">{viewExpense.status}</span>
              </div>
              {viewExpense.description && (
                <div className="pt-1">
                  <span className="font-bold text-slate-400 block mb-1">Description:</span>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-600 font-semibold">{viewExpense.description}</p>
                </div>
              )}
              {viewExpense.attachment_url && (
                <div className="pt-2">
                  <a
                    href={viewExpense.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center p-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-black transition-colors"
                  >
                    <Paperclip className="w-4 h-4 mr-2" /> View Attached Bill File <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Expense Voucher Modal */}
      {printVoucher && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 border border-slate-100 shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">EXPENSE PAYMENT VOUCHER</h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">School Operational Finance Register</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-slate-900 text-white font-mono font-black text-xs rounded-lg">
                  {printVoucher.expense_id}
                </span>
                <p className="text-[11px] font-bold text-slate-400 mt-1">Date: {new Date(printVoucher.expense_date).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs font-bold text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Expense Category:</span>
                <span>{printVoucher.category_id?.name || 'General Expense'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Title / Payee:</span>
                <span>{printVoucher.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method:</span>
                <span>{printVoucher.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reference No.:</span>
                <span className="font-mono">{printVoucher.reference_number || 'N/A'}</span>
              </div>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
              <span className="text-xs font-black text-blue-900 uppercase tracking-wider">Total Disbursed Amount</span>
              <span className="text-2xl font-black text-blue-700">₹{printVoucher.amount.toLocaleString('en-IN')}</span>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100 text-center text-xs font-bold text-slate-400">
              <div>
                <div className="h-10 border-b border-dashed border-slate-200 mb-1"></div>
                <span>Prepared By (Accountant)</span>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-200 mb-1"></div>
                <span>Authorized Signatory (Admin)</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setPrintVoucher(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-2" /> Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
