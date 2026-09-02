import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, UserCheck, ShieldAlert, CheckCircle, RefreshCcw, Edit2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const StudentFeeAssignment = () => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [structures, setStructures] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  
  const [loading, setLoading] = useState(false);
  const [studentsData, setStudentsData] = useState([]);
  const [filteredStructures, setFilteredStructures] = useState([]);

  // Assignment Modal/Single edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [customItems, setCustomItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchFilters = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [resClasses, resStructures, resCategories] = await Promise.all([
        axios.get('http://localhost:5005/api/schooladmin/classes', config),
        axios.get('http://localhost:5005/api/schooladmin/fees/structures', config),
        axios.get('http://localhost:5005/api/schooladmin/fees/categories', config)
      ]);
      setClasses(resClasses.data);
      setStructures(resStructures.data);
      setCategories(resCategories.data.filter(c => c.status === 'Active'));
    } catch (error) {
      toast.error('Failed to load classes or structures list');
    }
  };

  useEffect(() => {
    if (user?.token) fetchFilters();
  }, [user]);

  useEffect(() => {
    // Filter structures matching class standard
    const filtered = structures.filter(s => {
      const structClassId = (s.class_id?._id || s.class_id || '').toString();
      return structClassId === selectedClassId && s.academic_year === academicYear;
    });
    setFilteredStructures(filtered);
  }, [selectedClassId, academicYear, structures]);

  const handleFetchStudents = async () => {
    if (!selectedClassId) {
      toast.error('Please select a Class standard');
      return;
    }
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5005/api/schooladmin/fees/assignments?class_id=${selectedClassId}&academic_year=${academicYear}`, config);
      setStudentsData(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to retrieve student records list');
      setLoading(false);
    }
  };

  const handleBulkAssign = async (structureId) => {
    if (!structureId) {
      toast.error('Please select a fee structure blueprint');
      return;
    }
    if (window.confirm('Apply this fee structure blueprint to all students in the selected class?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.post('http://localhost:5005/api/schooladmin/fees/assignments/bulk', {
          class_id: selectedClassId,
          academic_year: academicYear,
          structure_id: structureId
        }, config);
        toast.success('Fee structure successfully assigned to all students!');
        handleFetchStudents();
      } catch (error) {
        toast.error('Failed to run bulk assignment');
      }
    }
  };

  const openEditModal = (stuItem) => {
    setSelectedStudent(stuItem.student);
    const assignedItems = stuItem.assigned?.items || [];
    
    // Map items or initialize with an empty list
    const items = assignedItems.map(i => ({
      category_id: i.category_id?._id || i.category_id,
      amount: i.amount,
      due_date: new Date(i.due_date).toISOString().substring(0, 10),
      fine_type: i.fine_type || 'None',
      fine_amount: i.fine_amount || 0
    }));

    setCustomItems(items);
    setIsEditModalOpen(true);
  };

  const handleAddLine = () => {
    setCustomItems([
      ...customItems,
      { category_id: '', amount: '', due_date: '', fine_type: 'None', fine_amount: 0 }
    ]);
  };

  const handleRemoveLine = (idx) => {
    const temp = [...customItems];
    temp.splice(idx, 1);
    setCustomItems(temp);
  };

  const handleItemFieldChange = (idx, field, val) => {
    const temp = [...customItems];
    temp[idx][field] = val;
    setCustomItems(temp);
  };

  const handleSaveIndividualFee = async () => {
    // Validate
    for (let i = 0; i < customItems.length; i++) {
      const it = customItems[i];
      if (!it.category_id || !it.amount || !it.due_date) {
        toast.error(`Please complete item row #${i + 1}`);
        return;
      }
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5005/api/schooladmin/fees/assignments', {
        student_id: selectedStudent._id,
        class_id: selectedClassId,
        academic_year: academicYear,
        items: customItems
      }, config);

      toast.success(`Fee structure assigned to ${selectedStudent.student_name}!`);
      setIsEditModalOpen(false);
      handleFetchStudents();
    } catch (error) {
      toast.error('Failed to assign fee items');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Student Fee Assignment</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Map structure blueprints to students in bulk, or customize billing categories per pupil</p>
        </div>
      </div>

      {/* Class/Year Filter Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Class & Section</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="">-- Select Grade --</option>
              {classes.map(cl => (
                <option key={cl._id} value={cl._id}>{cl.class} - {cl.section}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          <button
            onClick={handleFetchStudents}
            className="h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all hover:scale-[1.02]"
          >
            Load Students List
          </button>
        </div>
      </div>

      {/* Bulk Assignment Area (Show only if class is loaded) */}
      {studentsData.length > 0 && (
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">Bulk Apply Blueprints</h4>
              <p className="text-[11px] font-bold text-blue-700/80 mt-0.5">Apply a matching fee structure mapping to all class students in one action</p>
            </div>
          </div>

          <div className="flex flex-col gap-1 max-w-sm w-full">
            <div className="flex items-center gap-2">
              <select
                id="bulk-structure-select"
                className="flex-1 h-10 px-3 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="">
                  {filteredStructures.length === 0 
                    ? "-- No Blueprints Found for Selected Class --" 
                    : "-- Choose Structure Blueprint --"}
                </option>
                {filteredStructures.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.items.length} items (₹{s.items.reduce((sum, item) => sum + item.amount, 0)} total)
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const el = document.getElementById('bulk-structure-select');
                  handleBulkAssign(el?.value);
                }}
                disabled={filteredStructures.length === 0}
                className="bg-blue-600 hover:bg-blue-500 text-white h-10 px-4 rounded-xl text-xs font-black shadow-md transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Blueprint
              </button>
            </div>
            {filteredStructures.length === 0 && (
              <p className="text-[10px] text-amber-600 font-bold mt-1 text-right">
                * Create a structure for this class in "Fee Structures" first.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Students List Table */}
      {studentsData.length > 0 && (
        <div className="overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Admission No</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Waiver / Discount Scheme</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Billing Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Assign Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {studentsData.map(({ student, assigned }) => (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{student.admission_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{student.student_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assigned?.items?.some(i => i.discount_amount > 0) ? (
                        <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                          Waiver Active
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assigned ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                          <CheckCircle className="w-4 h-4 mr-1 inline" /> Configured (₹{assigned.items.reduce((s, i) => s + i.amount, 0)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-amber-500">
                          <ShieldAlert className="w-4 h-4 mr-1 inline" /> Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <button
                        onClick={() => openEditModal({ student, assigned })}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold inline-flex items-center transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Customize
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Customization Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-slate-100 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800">Customize Assigned Fees</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Student: {selectedStudent?.student_name} ({selectedStudent?.admission_number})</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Fee Lines</h4>
                <button
                  onClick={handleAddLine}
                  className="text-[10px] font-black text-blue-600 hover:underline flex items-center cursor-pointer"
                >
                  + Add Line
                </button>
              </div>

              {customItems.map((item, idx) => (
                <div key={idx} className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-3 relative">
                  <button
                    onClick={() => handleRemoveLine(idx)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-650 text-[10px] font-bold"
                  >
                    Remove
                  </button>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Fee Category</label>
                    <select
                      value={item.category_id}
                      onChange={(e) => handleItemFieldChange(idx, 'category_id', e.target.value)}
                      className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700"
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Billing Amount</label>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleItemFieldChange(idx, 'amount', Number(e.target.value))}
                        className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Due Date</label>
                      <input
                        type="date"
                        value={item.due_date}
                        onChange={(e) => handleItemFieldChange(idx, 'due_date', e.target.value)}
                        className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-650"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Fine Waiver/Daily penalty</label>
                      <select
                        value={item.fine_type}
                        onChange={(e) => handleItemFieldChange(idx, 'fine_type', e.target.value)}
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
                        value={item.fine_amount}
                        onChange={(e) => handleItemFieldChange(idx, 'fine_amount', Number(e.target.value))}
                        disabled={item.fine_type === 'None'}
                        className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {customItems.length === 0 && (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs font-semibold">
                  No billing lines configured. Add a line to structure individual fees.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 rounded-lg bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveIndividualFee}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black cursor-pointer shadow-md"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentFeeAssignment;
