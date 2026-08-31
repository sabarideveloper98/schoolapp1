import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Save, Edit, Play, CheckSquare, CreditCard, ChevronDown, CheckCircle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';

const PayrollProcess = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [payrolls, setPayrolls] = useState([]);
  
  // Date Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing Dialog modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  
  // Payment Dialog modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');

  const { register, handleSubmit, setValue, watch } = useForm();
  
  // Watch inputs inside day editor modal to dynamically recalculate formulas in the form!
  const watchWorkingDays = watch('attendance_summary.working_days') || 0;
  const watchPresentDays = watch('attendance_summary.present_days') || 0;
  const watchHalfDays = watch('attendance_summary.half_days') || 0;
  const watchPaidLeaves = watch('attendance_summary.paid_leaves') || 0;

  const watchHra = watch('salary_breakdown.allowances.hra') || 0;
  const watchTransport = watch('salary_breakdown.allowances.transport') || 0;
  const watchMedical = watch('salary_breakdown.allowances.medical') || 0;
  const watchOtherAllowances = watch('salary_breakdown.allowances.other') || 0;

  const watchPf = watch('salary_breakdown.deductions.pf') || 0;
  const watchEsi = watch('salary_breakdown.deductions.esi') || 0;
  const watchProfTax = watch('salary_breakdown.deductions.professional_tax') || 0;
  const watchOtherDeductions = watch('salary_breakdown.deductions.other') || 0;

  const fetchDraftPayrolls = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5005/api/schooladmin/payroll/draft?month=${selectedMonth}&year=${selectedYear}`, config);
      setPayrolls(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to pre-fetch payroll draft list');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchDraftPayrolls();
  }, [user, selectedMonth, selectedYear]);

  // Edit/Override Form Values prefill
  const handleEditDays = (rec) => {
    setActiveRecord(rec);
    setIsEditOpen(true);
    
    setValue('attendance_summary.working_days', rec.attendance_summary.working_days);
    setValue('attendance_summary.present_days', rec.attendance_summary.present_days);
    setValue('attendance_summary.absent_days', rec.attendance_summary.absent_days);
    setValue('attendance_summary.half_days', rec.attendance_summary.half_days);
    setValue('attendance_summary.paid_leaves', rec.attendance_summary.paid_leaves);

    setValue('salary_breakdown.allowances.hra', rec.salary_breakdown.allowances.hra);
    setValue('salary_breakdown.allowances.transport', rec.salary_breakdown.allowances.transport);
    setValue('salary_breakdown.allowances.medical', rec.salary_breakdown.allowances.medical);
    setValue('salary_breakdown.allowances.other', rec.salary_breakdown.allowances.other);

    setValue('salary_breakdown.deductions.pf', rec.salary_breakdown.deductions.pf);
    setValue('salary_breakdown.deductions.esi', rec.salary_breakdown.deductions.esi);
    setValue('salary_breakdown.deductions.professional_tax', rec.salary_breakdown.deductions.professional_tax);
    setValue('salary_breakdown.deductions.other', rec.salary_breakdown.deductions.other);
  };

  const onSaveEdit = (data) => {
    const workingDays = parseFloat(data.attendance_summary.working_days) || 1;
    const presentDays = parseFloat(data.attendance_summary.present_days) || 0;
    const halfDays = parseFloat(data.attendance_summary.half_days) || 0;
    const paidLeaves = parseFloat(data.attendance_summary.paid_leaves) || 0;

    const hra = parseFloat(data.salary_breakdown.allowances.hra) || 0;
    const transport = parseFloat(data.salary_breakdown.allowances.transport) || 0;
    const medical = parseFloat(data.salary_breakdown.allowances.medical) || 0;
    const otherAllowances = parseFloat(data.salary_breakdown.allowances.other) || 0;

    const pf = parseFloat(data.salary_breakdown.deductions.pf) || 0;
    const esi = parseFloat(data.salary_breakdown.deductions.esi) || 0;
    const profTax = parseFloat(data.salary_breakdown.deductions.professional_tax) || 0;
    const otherDeductions = parseFloat(data.salary_breakdown.deductions.other) || 0;

    // Run dynamic calculations based on standard formulas
    const monthlySalary = activeRecord.salary_breakdown.monthly_salary;
    const perDaySalary = parseFloat((monthlySalary / workingDays).toFixed(2));
    const payableDays = presentDays + paidLeaves + (halfDays * 0.5);
    const grossSalary = parseFloat((perDaySalary * payableDays).toFixed(2));
    const allowancesTotal = hra + transport + medical + otherAllowances;
    const deductionsTotal = pf + esi + profTax + otherDeductions;
    const netSalary = parseFloat((grossSalary + allowancesTotal - deductionsTotal).toFixed(2));

    const updated = payrolls.map(p => {
      if (p.user_id === activeRecord.user_id) {
        return {
          ...p,
          attendance_summary: {
            working_days: workingDays,
            present_days: presentDays,
            absent_days: parseFloat(data.attendance_summary.absent_days) || 0,
            half_days: halfDays,
            paid_leaves: paidLeaves
          },
          salary_breakdown: {
            monthly_salary: monthlySalary,
            per_day_salary: perDaySalary,
            payable_days: payableDays,
            gross_salary: grossSalary,
            allowances_total: allowancesTotal,
            deductions_total: deductionsTotal,
            net_salary: netSalary,
            allowances: { hra, transport, medical, other: otherAllowances },
            deductions: { pf, esi, professional_tax: profTax, other: otherDeductions }
          }
        };
      }
      return p;
    });

    setPayrolls(updated);
    setIsEditOpen(false);
    toast.success('Calculations recalculated successfully!');
  };

  const handleBulkGenerate = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Prepare records for saving
      const payload = {
        payrolls: payrolls.map(p => ({
          user_id: p.user_id,
          employee_name: p.employee_name,
          employee_role: p.employee_role,
          designation: p.designation,
          month: p.month,
          year: p.year,
          attendance_summary: p.attendance_summary,
          salary_breakdown: p.salary_breakdown,
          payment_details: p.payment_details,
          status: p.existing_payroll_id ? p.existing_status : 'Generated'
        }))
      };
      
      await axios.post('http://localhost:5005/api/schooladmin/payroll', payload, config);
      toast.success('Monthly payroll generated successfully!');
      fetchDraftPayrolls();
    } catch (error) {
      toast.error('Failed to generate payrolls');
    }
  };

  const handleApprovePayroll = async (rec) => {
    if (!rec.existing_payroll_id) {
      toast.error('Please save/generate the payroll structure first!');
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`http://localhost:5005/api/schooladmin/payroll/${rec.existing_payroll_id}`, { status: 'Approved' }, config);
      toast.success('Payroll approved successfully!');
      fetchDraftPayrolls();
    } catch (error) {
      toast.error('Failed to approve payroll');
    }
  };

  const handlePayPayroll = (rec) => {
    if (!rec.existing_payroll_id) {
      toast.error('Please save/generate the payroll structure first!');
      return;
    }
    setPaymentRecord(rec);
    setPaymentMethod('Bank Transfer');
    setTransactionRef('');
    setIsPaymentOpen(true);
  };

  const onSubmitPayment = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        status: 'Paid',
        payment_details: {
          payment_method: paymentMethod,
          transaction_ref: transactionRef,
          payment_date: new Date()
        }
      };
      await axios.put(`http://localhost:5005/api/schooladmin/payroll/${paymentRecord.existing_payroll_id}`, payload, config);
      toast.success('Payment recorded successfully!');
      setIsPaymentOpen(false);
      fetchDraftPayrolls();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const filteredPayrolls = payrolls.filter(p => 
    p.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Payroll Processing</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Generate salary calculations and process payments based on attendance logs</p>
        </div>
        <button
          onClick={handleBulkGenerate}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
        >
          <Save className="w-4 h-4 mr-2" /> Save / Generate Payroll
        </button>
      </div>

      {/* Date Selectors & Search bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search employee by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="h-11 px-4 text-xs font-bold bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer focus:border-blue-500 focus:bg-white"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i + 1}>
                {new Date(0, i).toLocaleString('en', { month: 'long' })}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-11 px-4 text-xs font-bold bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer focus:border-blue-500 focus:bg-white"
          >
            {[2024, 2025, 2026, 2027].map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid listing */}
      <div className="overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Attendance Snapshot</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Monthly Salary</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Payable Days</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Payable</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Payroll Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPayrolls.map((rec) => {
                const summary = rec.attendance_summary;
                const status = rec.existing_payroll_id ? rec.existing_status : 'Draft';
                return (
                  <tr key={rec.user_id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{rec.employee_name}</span>
                        <span className="text-xs font-semibold text-slate-450">{rec.designation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="text-emerald-600">Pres: {summary.present_days}</span>
                        <span>•</span>
                        <span className="text-red-500">Abs: {summary.absent_days}</span>
                        <span>•</span>
                        <span className="text-blue-500">Half: {summary.half_days}</span>
                        <span>•</span>
                        <span className="text-amber-500">Leaves: {summary.paid_leaves}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                      ${rec.salary_breakdown.monthly_salary}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-extrabold text-slate-700">
                      {rec.salary_breakdown.payable_days} / {summary.working_days} Days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-blue-600">
                      ${rec.salary_breakdown.net_salary}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' :
                        status === 'Approved' ? 'bg-blue-500/10 text-blue-600' :
                        status === 'Generated' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-2">
                        {status !== 'Paid' && (
                          <>
                            <button
                              onClick={() => handleEditDays(rec)}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" /> Adjust
                            </button>
                            
                            {status === 'Generated' && (
                              <button
                                onClick={() => handleApprovePayroll(rec)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Play className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}

                            {status === 'Approved' && (
                              <button
                                onClick={() => handlePayPayroll(rec)}
                                className="bg-emerald-555 bg-opacity-10 hover:bg-opacity-20 text-emerald-600 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> Pay
                              </button>
                            )}
                          </>
                        )}
                        {status === 'Paid' && (
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-emerald-600" /> Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPayrolls.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold">
                    No active configurations for this selected date filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing calculations Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">Adjust Calculations Override</h3>
                <p className="text-xs font-bold text-slate-400">Employee: {activeRecord?.employee_name}</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-450 hover:text-slate-700 cursor-pointer text-sm font-bold">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSubmit(onSaveEdit)} className="space-y-6">
              {/* Info alert */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 font-medium">
                  Modifying attendance metrics below will dynamically calculate Net Payable salaries on-the-fly using standard formula:
                  <div className="font-bold mt-1">Payable Days = Present Days + Paid Leaves + (Half Days * 0.5)</div>
                </div>
              </div>

              {/* Attendance values inputs */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Working Days</label>
                  <input type="number" {...register('attendance_summary.working_days')} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Present Days</label>
                  <input type="number" {...register('attendance_summary.present_days')} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Absent Days</label>
                  <input type="number" {...register('attendance_summary.absent_days')} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Half Days</label>
                  <input type="number" {...register('attendance_summary.half_days')} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Paid Leaves</label>
                  <input type="number" {...register('attendance_summary.paid_leaves')} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none" />
                </div>
              </div>

              {/* Allowances details overrides */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-3">Adjust Allowances</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">HRA ($)</label>
                    <input type="number" step="0.01" {...register('salary_breakdown.allowances.hra')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Transport ($)</label>
                    <input type="number" step="0.01" {...register('salary_breakdown.allowances.transport')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Medical ($)</label>
                    <input type="number" step="0.01" {...register('salary_breakdown.allowances.medical')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Other ($)</label>
                    <input type="number" step="0.01" {...register('salary_breakdown.allowances.other')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                </div>
              </div>

              {/* Deductions overrides */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-3">Adjust Deductions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">PF ($)</label>
                    <input type="number" step="0.01" {...register('salary_breakdown.deductions.pf')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ESI ($)</label>
                    <input type="number" step="0.01" {...register('salary_breakdown.deductions.esi')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Prof. Tax ($)</label>
                    <input type="number" step="0.01" {...register('salary_breakdown.deductions.professional_tax')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Other ($)</label>
                    <input type="number" step="0.01" {...register('salary_breakdown.deductions.other')} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                </div>
              </div>

              {/* Calculations preview box */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-6 justify-between items-center shadow-inner">
                <div>
                  <h4 className="text-xs font-black text-slate-850 uppercase">Formulas Calculations Summary</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Per day: ${(activeRecord?.salary_breakdown.monthly_salary / (watchWorkingDays || 1)).toFixed(2)} | Payable: {Number(watchPresentDays) + Number(watchPaidLeaves) + (Number(watchHalfDays) * 0.5)} Days</p>
                </div>
                
                <div className="flex gap-6 items-center">
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 block uppercase">Calculated Net Payable</span>
                    <span className="text-2xl font-black text-blue-600">
                      ${(
                        ((activeRecord?.salary_breakdown.monthly_salary / (watchWorkingDays || 1)) * 
                        (Number(watchPresentDays) + Number(watchPaidLeaves) + (Number(watchHalfDays) * 0.5))) +
                        (Number(watchHra) + Number(watchTransport) + Number(watchMedical) + Number(watchOtherAllowances)) -
                        (Number(watchPf) + Number(watchEsi) + Number(watchProfTax) + Number(watchOtherDeductions))
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
                >
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-md w-full space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">Record Salary Payment</h3>
                <p className="text-xs font-bold text-slate-400">Employee: {paymentRecord?.employee_name}</p>
              </div>
              <button onClick={() => setIsPaymentOpen(false)} className="text-slate-450 hover:text-slate-700 cursor-pointer text-sm font-bold">
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Transaction Reference / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. TXN987213890123"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="block w-full h-11 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs font-bold"
                />
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Settlement Net Payable</span>
                <span className="block text-2xl font-black text-emerald-600 mt-0.5">${paymentRecord?.salary_breakdown.net_salary}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="px-5 py-2.5 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={onSubmitPayment}
                className="px-5 py-2.5 text-xs font-black rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.1)]"
              >
                Confirm Settle Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollProcess;
