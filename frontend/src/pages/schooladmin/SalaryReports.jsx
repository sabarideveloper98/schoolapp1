import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, CreditCard, PieChart, Users, BarChart3, AlertCircle, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const SalaryReports = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [reportsData, setReportsData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState('Monthly Payroll');
  const [departmentInput, setDepartmentInput] = useState('');

  const fetchDashboardStats = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5005/api/schooladmin/payroll/dashboard?month=${selectedMonth}&year=${selectedYear}`, config);
      setDashboardStats(res.data);
    } catch (error) {
      console.error('Failed to fetch payroll dashboard stats');
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      let url = `http://localhost:5005/api/schooladmin/payroll/reports?month=${selectedMonth}&year=${selectedYear}`;
      
      // Map report type filters
      if (reportType === 'Teacher Salary') url += '&role=Teacher';
      if (reportType === 'Staff Salary') url += '&role=Staff';
      if (reportType === 'Paid Salary') url += '&status=Paid';
      if (reportType === 'Pending Salary') url += '&status=Approved'; // or Draft/Generated/Approved
      if (reportType === 'Department-wise Salary' && departmentInput) {
        url += `&department=${departmentInput}`;
      }

      const res = await axios.get(url, config);
      let records = res.data;

      // Extra client-side filter for pending salaries
      if (reportType === 'Pending Salary') {
        records = records.filter(r => r.status !== 'Paid');
      }

      setReportsData(records);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch reports list');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchDashboardStats();
      fetchReports();
    }
  }, [user, selectedMonth, selectedYear, reportType, departmentInput]);

  const handleExportCSV = () => {
    if (reportsData.length === 0) {
      toast.error('No report data available to export');
      return;
    }
    
    // Construct CSV Header
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Employee Name,Designation,Working Days,Present Days,Absent Days,Gross Salary,Allowances,Deductions,Net Salary,Payment Status\n';
    
    // Construct CSV Rows
    reportsData.forEach(p => {
      const row = [
        `"${p.employee_name}"`,
        `"${p.designation}"`,
        p.attendance_summary.working_days,
        p.attendance_summary.present_days,
        p.attendance_summary.absent_days,
        p.salary_breakdown.gross_salary,
        p.salary_breakdown.allowances_total,
        p.salary_breakdown.deductions_total,
        p.salary_breakdown.net_salary,
        `"${p.status}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Salary_Report_${reportType.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Salary & Payroll Reports</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Review monthly payroll summaries, teacher expenditures, and export records</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(16,185,129,0.1)] cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2" /> Export CSV / Excel
        </button>
      </div>

      {/* Dashboard Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {/* Total Teachers */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Total Teachers</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{dashboardStats?.totalTeachers || 0}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Staff */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Total Staff</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{dashboardStats?.totalStaff || 0}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Generated count */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Generated</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{dashboardStats?.payrollGenerated || 0}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        {/* Paid count */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Settled</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{dashboardStats?.payrollPaid || 0}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Pending count */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Unsettled</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{dashboardStats?.payrollPending || 0}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-650 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Paid Expense</p>
            <h3 className="text-xl font-black text-slate-800 mt-1">${dashboardStats?.monthlySalaryExpense || 0}</h3>
          </div>
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Selectors and Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Report Type */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="Monthly Payroll">Monthly Payroll Report</option>
              <option value="Teacher Salary">Teacher Salary Report</option>
              <option value="Staff Salary">Staff Salary Report</option>
              <option value="Paid Salary">Paid Salary Report</option>
              <option value="Pending Salary">Pending Salary Report</option>
              <option value="Department-wise">Department-wise Salary Report</option>
            </select>
          </div>

          {/* Department filter option */}
          {reportType === 'Department-wise' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Enter Department</label>
              <input
                type="text"
                placeholder="e.g. Science, Accounts..."
                value={departmentInput}
                onChange={(e) => setDepartmentInput(e.target.value)}
                className="w-full h-11 px-4 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
              />
            </div>
          )}

          {/* Month Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Month</label>
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
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Year</label>
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
        </div>
      </div>

      {/* Reports Table List */}
      <div className="overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Employee Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Working Days</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Present Days</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Absent Days</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Gross Salary</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {reportsData.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{rec.employee_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">{rec.designation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">{rec.attendance_summary.working_days}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-emerald-600">{rec.attendance_summary.present_days}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-red-500">{rec.attendance_summary.absent_days}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">${rec.salary_breakdown.gross_salary}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-blue-600">${rec.salary_breakdown.net_salary}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      rec.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' :
                      rec.status === 'Approved' ? 'bg-blue-500/10 text-blue-600' :
                      rec.status === 'Generated' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 text-slate-550'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
              {reportsData.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-bold">
                    No payroll data found matching the selected report filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryReports;
