import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Calendar, Settings, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const FeeStructureManagement = () => {
  const { user } = useAuthStore();
  const [structures, setStructures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [selectedClassId, setSelectedClassId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [structureItems, setStructureItems] = useState([]);

  // Copy structures state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [fromYear, setFromYear] = useState('2024-2025');
  const [toYear, setToYear] = useState('2025-2026');

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [resStructures, resCategories, resClasses] = await Promise.all([
        axios.get('http://localhost:5005/api/schooladmin/fees/structures', config),
        axios.get('http://localhost:5005/api/schooladmin/fees/categories', config),
        axios.get('http://localhost:5005/api/schooladmin/classes', config)
      ]);

      setStructures(resStructures.data);
      setCategories(resCategories.data.filter(c => c.status === 'Active'));
      setClasses(resClasses.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load page parameters');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user]);

  const addStructureItem = () => {
    setStructureItems([
      ...structureItems,
      { category_id: '', amount: '', due_date: '', fine_type: 'None', fine_amount: 0 }
    ]);
  };

  const removeStructureItem = (index) => {
    const temp = [...structureItems];
    temp.splice(index, 1);
    setStructureItems(temp);
  };

  const handleItemChange = (index, field, value) => {
    const temp = [...structureItems];
    temp[index][field] = value;
    setStructureItems(temp);
  };

  const handleEdit = (struct) => {
    setEditMode(true);
    setEditingId(struct._id);
    setSelectedClassId(struct.class_id?._id || '');
    setAcademicYear(struct.academic_year);
    
    // Map items
    const items = struct.items.map(item => ({
      category_id: item.category_id?._id || item.category_id,
      amount: item.amount,
      due_date: new Date(item.due_date).toISOString().substring(0, 10),
      fine_type: item.fine_type || 'None',
      fine_amount: item.fine_amount || 0
    }));
    setStructureItems(items);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this class fee structure configuration?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`http://localhost:5005/api/schooladmin/fees/structures/${id}`, config);
        toast.success('Fee structure removed!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete structure');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error('Please select a class');
      return;
    }
    if (structureItems.length === 0) {
      toast.error('Please add at least one fee category item');
      return;
    }

    // Validate items
    for (let i = 0; i < structureItems.length; i++) {
      const item = structureItems[i];
      if (!item.category_id || !item.amount || !item.due_date) {
        toast.error(`Please complete item #${i + 1}`);
        return;
      }
    }

    const payload = {
      class_id: selectedClassId,
      academic_year: academicYear,
      items: structureItems,
      status: 'Active'
    };

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editMode) {
        await axios.put(`http://localhost:5005/api/schooladmin/fees/structures/${editingId}`, payload, config);
        toast.success('Structure updated successfully!');
      } else {
        await axios.post('http://localhost:5005/api/schooladmin/fees/structures', payload, config);
        toast.success('Structure created successfully!');
      }
      closeForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save fee structure');
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditMode(false);
    setEditingId(null);
    setSelectedClassId('');
    setAcademicYear('2025-2026');
    setStructureItems([]);
  };

  const handleCopyPrevYear = async () => {
    // Copy logic
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const recordsToCopy = structures.filter(s => s.academic_year === fromYear);
      if (recordsToCopy.length === 0) {
        toast.error(`No structures found for academic year ${fromYear} to copy`);
        return;
      }

      let copiedCount = 0;
      for (const struct of recordsToCopy) {
        const payload = {
          class_id: struct.class_id?._id || struct.class_id,
          academic_year: toYear,
          items: struct.items.map(i => ({
            category_id: i.category_id?._id || i.category_id,
            amount: i.amount,
            due_date: new Date(new Date(i.due_date).setFullYear(new Date(i.due_date).getFullYear() + 1)).toISOString().substring(0,10),
            fine_type: i.fine_type,
            fine_amount: i.fine_amount
          })),
          status: 'Active'
        };

        try {
          await axios.post('http://localhost:5005/api/schooladmin/fees/structures', payload, config);
          copiedCount++;
        } catch (err) {
          // ignore duplicate conflicts
        }
      }

      toast.success(`Successfully copied ${copiedCount} structures to ${toYear}!`);
      setShowCopyModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to copy structures');
    }
  };

  if (loading) return <div className="flex justify-center py-12 text-slate-550 font-semibold">Loading structures...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Fee Structures</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Establish grade-specific fee targets, payment schedule due dates, and default fines</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCopyModal(true)}
            className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all cursor-pointer"
          >
            <Copy className="w-4 h-4 mr-2" /> Copy Last Year
          </button>
          <button
            onClick={() => { closeForm(); setIsFormOpen(true); }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Configure Structure
          </button>
        </div>
      </div>

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-800">Copy Structures</h3>
            <p className="text-xs font-semibold text-slate-400">Replicate fee mappings from a previous academic year with auto-incremented date years.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Source Year</label>
                <select
                  value={fromYear}
                  onChange={(e) => setFromYear(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Target Year</label>
                <select
                  value={toYear}
                  onChange={(e) => setToYear(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 rounded-lg bg-white"
              >
                Close
              </button>
              <button
                onClick={handleCopyPrevYear}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black cursor-pointer"
              >
                Copy Structures
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor & List grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Structures Listings */}
        <div className="xl:col-span-2 space-y-4">
          {structures.map((struct) => (
            <div key={struct._id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-md font-black text-slate-800">
                    {struct.class_id?.class} - {struct.class_id?.section}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Academic Year: {struct.academic_year}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(struct)}
                    className="p-2 border border-slate-100 hover:bg-slate-50 rounded-lg text-blue-600 transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(struct._id)}
                    className="p-2 border border-slate-100 hover:bg-slate-50 rounded-lg text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items listing table */}
              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase">Category</th>
                      <th className="px-4 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase">Amount</th>
                      <th className="px-4 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase">Due Date</th>
                      <th className="px-4 py-2.5 text-left text-[9px] font-black text-slate-400 uppercase">Late Fee Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {struct.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30">
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-slate-800">
                          {item.category_id?.name || 'Fee Category'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-black text-slate-800">
                          ₹{item.amount}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-semibold text-slate-500">
                          {new Date(item.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-semibold text-slate-500">
                          {item.fine_type !== 'None' ? `${item.fine_type} Fine (₹${item.fine_amount})` : 'No fine'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {structures.length === 0 && (
            <div className="bg-white p-12 text-center text-slate-400 font-bold rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              No fee structures configured.
            </div>
          )}
        </div>

        {/* Input Card Form */}
        {isFormOpen && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
            <h3 className="text-sm font-black text-slate-800">
              {editMode ? 'Edit Fee Structure' : 'New Fee Structure'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Select Class *</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  disabled={editMode}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Grade --</option>
                  {classes.map(cl => (
                    <option key={cl._id} value={cl._id}>{cl.class} - {cl.section}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Academic Year *</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  disabled={editMode}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-500">Structure Items</h4>
                  <button
                    type="button"
                    onClick={addStructureItem}
                    className="text-[10px] font-black text-blue-600 flex items-center hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Category Line
                  </button>
                </div>

                {structureItems.map((item, idx) => (
                  <div key={idx} className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => removeStructureItem(idx)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-600 text-xs font-bold"
                    >
                      Remove
                    </button>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Category *</label>
                      <select
                        value={item.category_id}
                        onChange={(e) => handleItemChange(idx, 'category_id', e.target.value)}
                        className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700"
                      >
                        <option value="">-- Choose --</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Amount *</label>
                        <input
                          type="number"
                          placeholder="₹"
                          value={item.amount}
                          onChange={(e) => handleItemChange(idx, 'amount', Number(e.target.value))}
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Due Date *</label>
                        <input
                          type="date"
                          value={item.due_date}
                          onChange={(e) => handleItemChange(idx, 'due_date', e.target.value)}
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-650"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Late Fine Type</label>
                        <select
                          value={item.fine_type}
                          onChange={(e) => handleItemChange(idx, 'fine_type', e.target.value)}
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700"
                        >
                          <option value="None">None</option>
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Fixed">Fixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Fine Amount</label>
                        <input
                          type="number"
                          placeholder="₹"
                          value={item.fine_amount}
                          onChange={(e) => handleItemChange(idx, 'fine_amount', Number(e.target.value))}
                          disabled={item.fine_type === 'None'}
                          className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default FeeStructureManagement;
