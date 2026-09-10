import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Printer, FileText, CheckCircle2, AlertTriangle, Landmark } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const SalarySlips = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [payrolls, setPayrolls] = useState([]);
  
  // Date Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPayrollId, setSelectedPayrollId] = useState('');
  
  const [activeSlip, setActiveSlip] = useState(null);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`/api/schooladmin/payroll?month=${selectedMonth}&year=${selectedYear}`, config);
      setPayrolls(res.data);
      if (res.data.length > 0) {
        setSelectedPayrollId(res.data[0]._id);
      } else {
        setSelectedPayrollId('');
        setActiveSlip(null);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load generated payroll list');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchPayrolls();
  }, [user, selectedMonth, selectedYear]);

  const handleGenerateSlip = () => {
    if (!selectedPayrollId) {
      toast.error('Please select an employee payroll log');
      return;
    }
    const slip = payrolls.find(p => p._id === selectedPayrollId);
    setActiveSlip(slip);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-0 print:bg-white print:p-0">
      {/* Page Header (Hidden on print) */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Salary Slips</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Review and print professional salary slips for your employees</p>
        </div>
        
        {activeSlip && (
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-2" /> Print Slip
          </button>
        )}
      </div>

      {/* Selector Filters (Hidden on print) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Month Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>
                  {new Date(0, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Employee Select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Employee Payroll</label>
            <select
              value={selectedPayrollId}
              onChange={(e) => setSelectedPayrollId(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="">-- Choose Employee --</option>
              {payrolls.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.employee_name} ({p.designation}) - ${p.salary_breakdown.net_salary}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <div>
            <button
              onClick={handleGenerateSlip}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer shadow-md"
            >
              <FileText className="w-4 h-4 mr-2" /> View Salary Slip
            </button>
          </div>
        </div>
      </div>

      {/* Salary Slip Layout View */}
      {activeSlip ? (
        <div 
          className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-12 max-w-3xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0 print:mx-0 print:w-full relative"
          id="printable-salary-slip"
        >
          {/* Watermark / Status Stamp */}
          <div className="absolute top-10 right-10 print:right-4 z-10 opacity-15 hover:opacity-100 transition-opacity">
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 border-4 rounded-2xl text-lg font-black uppercase tracking-widest ${
              activeSlip.status === 'Paid' ? 'border-emerald-600 text-emerald-600' : 'border-blue-600 text-blue-600'
            }`}>
              {activeSlip.status}
            </span>
          </div>

          {/* School Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start border-b border-slate-150 pb-6 gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-xl font-black text-slate-800 tracking-wide">S1 ACADEMY</h1>
              <p className="text-xs font-bold text-slate-450 mt-1">Sts. Boston Avenue, NY, USA</p>
              <p className="text-[10px] font-semibold text-slate-400">Phone: +1 555 0199 | Email: info@s1academy.edu</p>
            </div>
            
            <div className="text-center md:text-right">
              <h2 className="text-md font-black text-slate-800 tracking-wider">SALARY SLIP</h2>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Month of {new Date(0, activeSlip.month - 1).toLocaleString('en', { month: 'long' })}, {activeSlip.year}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">Slip Ref ID: #{activeSlip._id.substring(18).toUpperCase()}</p>
            </div>
          </div>

          {/* Employee & Attendance Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            {/* Left Column: Profile details */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Employee details</h3>
              <div className="text-xs font-bold text-slate-700 space-y-1">
                <p>Name: <span className="text-slate-850 font-extrabold">{activeSlip.employee_name}</span></p>
                <p>Designation: <span className="text-slate-800 font-semibold">{activeSlip.designation}</span></p>
                <p>Employee Type: <span className="text-slate-800 font-semibold">{activeSlip.employee_role}</span></p>
              </div>
            </div>

            {/* Right Column: Attendance Metrics */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Attendance Summary</h3>
              <div className="text-xs font-bold text-slate-700 grid grid-cols-2 gap-x-4 gap-y-1">
                <p>Working Days: <span className="text-slate-800 font-extrabold">{activeSlip.attendance_summary.working_days}</span></p>
                <p>Present Days: <span className="text-slate-800 font-extrabold">{activeSlip.attendance_summary.present_days}</span></p>
                <p>Absent Days: <span className="text-red-500 font-extrabold">{activeSlip.attendance_summary.absent_days}</span></p>
                <p>Half Days: <span className="text-blue-600 font-extrabold">{activeSlip.attendance_summary.half_days}</span></p>
                <p className="col-span-2">Paid Leaves: <span className="text-amber-500 font-extrabold">{activeSlip.attendance_summary.paid_leaves}</span></p>
              </div>
            </div>
          </div>

          {/* Breakdowns Table Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Allowances Column */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Allowances & Earnings</h4>
              </div>
              <div className="p-4 space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>HRA Allowance</span>
                  <span className="text-slate-850">₹{activeSlip.salary_breakdown.allowances?.hra || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Allowance</span>
                  <span className="text-slate-850">₹{activeSlip.salary_breakdown.allowances?.transport || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Allowance</span>
                  <span className="text-slate-850">₹{activeSlip.salary_breakdown.allowances?.medical || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Allowances</span>
                  <span className="text-slate-850">₹{activeSlip.salary_breakdown.allowances?.other || 0}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-slate-800">
                  <span>Total Earnings</span>
                  <span className="text-emerald-600">+₹{activeSlip.salary_breakdown.allowances_total}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Deductions</h4>
              </div>
              <div className="p-4 space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>Provident Fund (PF)</span>
                  <span className="text-slate-850">₹{activeSlip.salary_breakdown.deductions?.pf || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>ESI Contribution</span>
                  <span className="text-slate-850">₹{activeSlip.salary_breakdown.deductions?.esi || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional Tax</span>
                  <span className="text-slate-850">₹{activeSlip.salary_breakdown.deductions?.professional_tax || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Deductions</span>
                  <span className="text-slate-850">₹{activeSlip.salary_breakdown.deductions?.other || 0}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-slate-800">
                  <span>Total Deductions</span>
                  <span className="text-red-500">-₹{activeSlip.salary_breakdown.deductions_total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calculations Summary Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calculation Base Formulas</p>
              <div className="text-xs text-slate-300 font-semibold mt-1">
                Base monthly: ₹{activeSlip.salary_breakdown.monthly_salary} | Gross (Payable days): ₹{activeSlip.salary_breakdown.gross_salary}
              </div>
            </div>

            <div className="text-center md:text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Net Settled Salary</span>
              <span className="text-3xl font-black text-white">₹{activeSlip.salary_breakdown.net_salary}</span>
            </div>
          </div>

          {/* Settlement Details */}
          {activeSlip.status === 'Paid' && (
            <div className="border border-slate-150 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center text-xs font-bold text-slate-600 gap-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase">Payment Method</span>
                  <span className="text-slate-800">{activeSlip.payment_details.payment_method}</span>
                </div>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase">Transaction Reference</span>
                <span className="text-slate-800">{activeSlip.payment_details.transaction_ref || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase">Settlement Date</span>
                <span className="text-slate-800">{activeSlip.payment_details.payment_date ? new Date(activeSlip.payment_details.payment_date).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          )}

          {/* Signatures block */}
          <div className="flex justify-between items-center pt-12 text-center text-xs font-bold text-slate-500 border-t border-slate-100">
            <div>
              <div className="h-10 border-b border-slate-200 w-36 mx-auto"></div>
              <p className="mt-2">Employee Signature</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-200 w-36 mx-auto"></div>
              <p className="mt-2">Authorised Signatory</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-12 text-center text-slate-400 font-bold print:hidden">
          <AlertTriangle className="w-12 h-12 text-slate-350 mx-auto mb-4" />
          Select month, year, and employee to generate a Salary Slip view.
        </div>
      )}
    </div>
  );
};

export default SalarySlips;
