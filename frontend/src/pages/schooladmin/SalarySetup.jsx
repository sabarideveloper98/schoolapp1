import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Search, History, CheckCircle, XCircle, ArrowLeft, Landmark, DollarSign, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';

const SalarySetup = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const { user } = useAuthStore();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      monthly_salary: 0,
      allowances: { hra: 0, transport: 0, medical: 0, other: 0 },
      deductions: { pf: 0, esi: 0, professional_tax: 0, other: 0 },
      bank_details: { account_number: '', bank_name: '', ifsc_code: '', upi_id: '' },
      status: 'Active'
    }
  });

  const watchMonthlySalary = watch('monthly_salary');

  const fetchEmployees = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/schooladmin/payroll/setup', config);
      setEmployees(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch employees salary setups');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchEmployees();
  }, [user]);

  const handleConfigure = (emp) => {
    setActiveEmployee(emp);
    setIsModalOpen(true);
    if (emp.setup) {
      setValue('monthly_salary', emp.setup.monthly_salary);
      setValue('designation', emp.setup.designation);
      setValue('department', emp.setup.department);
      setValue('allowances.hra', emp.setup.allowances?.hra || 0);
      setValue('allowances.transport', emp.setup.allowances?.transport || 0);
      setValue('allowances.medical', emp.setup.allowances?.medical || 0);
      setValue('allowances.other', emp.setup.allowances?.other || 0);
      setValue('deductions.pf', emp.setup.deductions?.pf || 0);
      setValue('deductions.esi', emp.setup.deductions?.esi || 0);
      setValue('deductions.professional_tax', emp.setup.deductions?.professional_tax || 0);
      setValue('deductions.other', emp.setup.deductions?.other || 0);
      setValue('bank_details.account_number', emp.setup.bank_details?.account_number || '');
      setValue('bank_details.bank_name', emp.setup.bank_details?.bank_name || '');
      setValue('bank_details.ifsc_code', emp.setup.bank_details?.ifsc_code || '');
      setValue('bank_details.upi_id', emp.setup.bank_details?.upi_id || '');
      setValue('status', emp.setup.status || 'Active');
    } else {
      reset({
        monthly_salary: 0,
        designation: emp.designation,
        department: emp.department,
        allowances: { hra: 0, transport: 0, medical: 0, other: 0 },
        deductions: { pf: 0, esi: 0, professional_tax: 0, other: 0 },
        bank_details: { account_number: '', bank_name: '', ifsc_code: '', upi_id: '' },
        status: 'Active'
      });
    }
  };

  const handleViewHistory = async (emp) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`/api/schooladmin/payroll/setup/history/${emp.user_id}`, config);
      setHistoryList(res.data);
      setActiveEmployee(emp);
      setIsHistoryOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No adjustment history found for this employee');
    }
  };

  const onSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        ...data,
        user_id: activeEmployee.user_id,
        employee_name: activeEmployee.name,
        employee_role: activeEmployee.role
      };
      await axios.post('/api/schooladmin/payroll/setup', payload, config);
      toast.success('Salary structure configured successfully!');
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to configure salary structure');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter ? emp.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  if (loading) return <div className="flex justify-center py-12 text-slate-500 font-semibold">Loading salary structures...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Salary Setup</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Configure and manage salary components for all school staff</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 px-4 text-xs font-bold bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer focus:border-blue-500 focus:bg-white"
          >
            <option value="">All Employee Types</option>
            <option value="Teacher">Teachers</option>
            <option value="Staff">Office Staff / Others</option>
          </select>
        </div>
      </div>

      {/* Employees Grid List */}
      <div className="overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Employee Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Designation / Dept</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Monthly Salary</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Allowances</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Deductions</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEmployees.map((emp) => {
                const isConfigured = !!emp.setup;
                const hra = emp.setup?.allowances?.hra || 0;
                const transport = emp.setup?.allowances?.transport || 0;
                const medical = emp.setup?.allowances?.medical || 0;
                const otherAllowances = emp.setup?.allowances?.other || 0;
                const allowancesTotal = hra + transport + medical + otherAllowances;

                const pf = emp.setup?.deductions?.pf || 0;
                const esi = emp.setup?.deductions?.esi || 0;
                const profTax = emp.setup?.deductions?.professional_tax || 0;
                const otherDeductions = emp.setup?.deductions?.other || 0;
                const deductionsTotal = pf + esi + profTax + otherDeductions;

                return (
                  <tr key={emp.user_id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{emp.name}</span>
                        <span className="text-xs font-semibold text-slate-450">{emp.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        emp.role === 'Teacher' ? 'bg-blue-550/10 text-blue-600' : 'bg-indigo-500/10 text-indigo-600'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{emp.designation}</span>
                        <span className="text-[10px] font-semibold text-slate-450 uppercase">{emp.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                      {isConfigured ? `₹${emp.setup.monthly_salary}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-emerald-600">
                      {isConfigured ? `+₹${allowancesTotal}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-red-600">
                      {isConfigured ? `-₹${deductionsTotal}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                        isConfigured && emp.setup.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {isConfigured && emp.setup.status === 'Active' ? (
                          <>
                            <CheckCircle className="w-4 h-4" /> Active
                          </>
                        ) : isConfigured ? (
                          <>
                            <XCircle className="w-4 h-4" /> Inactive
                          </>
                        ) : (
                          <span className="italic text-[10px]">Not Configured</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleConfigure(emp)}
                          className="bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-100 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Edit className="w-3.5 h-3.5" /> Configure
                        </button>
                        {isConfigured && (
                          <button
                            onClick={() => handleViewHistory(emp)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-550 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Salary Structure History"
                          >
                            <History className="w-3.5 h-3.5" /> History
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-bold">
                    No employees matching the search filters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">Salary Configuration</h3>
                <p className="text-xs font-bold text-slate-400">Employee: {activeEmployee?.name} ({activeEmployee?.role})</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-450 hover:text-slate-700 cursor-pointer text-sm font-bold">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Designation */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Designation</label>
                  <input
                    type="text"
                    {...register('designation', { required: 'Required' })}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 sm:text-xs font-semibold"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Department</label>
                  <input
                    type="text"
                    {...register('department', { required: 'Required' })}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 sm:text-xs font-semibold"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Salary Status</label>
                  <select
                    {...register('status')}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 sm:text-xs font-semibold cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Monthly Salary */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('monthly_salary', { required: 'Required', min: 0 })}
                    className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 sm:text-xs font-semibold"
                  />
                </div>

                {/* Calculated Per Day Salary */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Per Day Salary (Auto Cal.)</label>
                  <div className="flex items-center h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500">
                    ₹{watchMonthlySalary ? (watchMonthlySalary / 30).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>

              {/* Allowances */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Allowances
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">HRA (₹)</label>
                    <input type="number" step="0.01" {...register('allowances.hra')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Transport (₹)</label>
                    <input type="number" step="0.01" {...register('allowances.transport')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Medical (₹)</label>
                    <input type="number" step="0.01" {...register('allowances.medical')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Other (₹)</label>
                    <input type="number" step="0.01" {...register('allowances.other')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-red-500" /> Deductions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">PF (₹)</label>
                    <input type="number" step="0.01" {...register('deductions.pf')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ESI (₹)</label>
                    <input type="number" step="0.01" {...register('deductions.esi')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Prof. Tax (₹)</label>
                    <input type="number" step="0.01" {...register('deductions.professional_tax')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Other (₹)</label>
                    <input type="number" step="0.01" {...register('deductions.other')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-red-500" />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-blue-600" /> Bank & Settlement details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Account Number</label>
                    <input type="text" {...register('bank_details.account_number')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Bank Name</label>
                    <input type="text" {...register('bank_details.bank_name')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">IFSC Code</label>
                    <input type="text" {...register('bank_details.ifsc_code')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">UPI ID</label>
                    <input type="text" {...register('bank_details.upi_id')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
                >
                  Save Salary Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-xl w-full max-h-[80vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">Salary Setup History</h3>
                <p className="text-xs font-bold text-slate-400">Employee: {activeEmployee?.name}</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-450 hover:text-slate-700 cursor-pointer text-sm font-bold">
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              {historyList.map((hist, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 relative">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400">{new Date(hist.date).toLocaleString()}</span>
                    <span className="text-xs font-bold text-slate-700 mt-1">
                      Adjusted monthly salary to <span className="text-blue-600 font-extrabold">₹{hist.monthly_salary}</span>
                    </span>
                    <span className="text-[10px] font-medium text-slate-450 mt-1">Changed by: {hist.changed_by}</span>
                  </div>
                </div>
              ))}
              {historyList.length === 0 && (
                <p className="text-center text-slate-400 text-sm font-bold py-6">No historical modifications logged for this profile.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalarySetup;
