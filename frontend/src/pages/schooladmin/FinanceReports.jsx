import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import {
  FileText, Download, Printer, Filter, DollarSign, TrendingUp,
  TrendingDown, PieChart, ShieldCheck, RefreshCw, Calendar, ArrowRight
} from 'lucide-react';

export default function FinanceReports() {
  const { user } = useAuthStore();
  const [reportType, setReportType] = useState('pnl'); // pnl, daily, monthly, yearly, income, payroll, fee
  const [dateFilter, setDateFilter] = useState('all'); // all, today, yesterday, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    expenses: [],
    incomes: [],
    feePayments: [],
    payrolls: [],
    summary: {
      totalManualExpense: 0,
      totalPayrollExpense: 0,
      totalOverallExpense: 0,
      totalManualIncome: 0,
      totalFeeIncome: 0,
      totalOverallIncome: 0,
      netProfitLoss: 0,
      teacherSalaryCost: 0,
      staffSalaryCost: 0,
      totalRefunds: 0,
      pendingFeesTotal: 0
    }
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/schooladmin/finance/reports', config);
      setReportData(res.data);
    } catch (error) {
      toast.error('Failed to load financial reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchReports();
  }, [user]);

  const formatCurr = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  const exportCSV = (filename, headers, rows) => {
    if (rows.length === 0) {
      toast.error('No rows to export');
      return;
    }
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully');
  };

  const handleExportCurrent = () => {
    const s = reportData.summary;
    if (reportType === 'pnl') {
      const headers = ['Financial Parameter', 'Amount (INR)'];
      const rows = [
        ['Total Manual Income', s.totalManualIncome],
        ['Total Fee Collection Revenue', s.totalFeeIncome],
        ['GROSS TOTAL INCOME', s.totalOverallIncome],
        ['Total Operational Expenses', s.totalManualExpense],
        ['Total Payroll Expenses', s.totalPayrollExpense],
        ['GROSS TOTAL EXPENSES', s.totalOverallExpense],
        ['NET PROFIT / LOSS', s.netProfitLoss]
      ];
      exportCSV('Profit_And_Loss_Statement', headers, rows);
    } else if (reportType === 'payroll') {
      const headers = ['Employee Name', 'Role', 'Designation', 'Month/Year', 'Net Salary', 'Status'];
      const rows = reportData.payrolls.map(p => [
        `"${p.employee_name}"`,
        p.employee_role,
        `"${p.designation}"`,
        `${p.month}/${p.year}`,
        p.salary_breakdown?.net_salary || 0,
        p.status
      ]);
      exportCSV('Payroll_Expense_Report', headers, rows);
    } else if (reportType === 'fee') {
      const headers = ['Receipt No', 'Date', 'Student Name', 'Amount Paid', 'Method'];
      const rows = reportData.feePayments.map(fp => [
        fp.receipt_number,
        new Date(fp.payment_date).toLocaleDateString('en-IN'),
        `"${fp.student_id?.student_name || 'Student'}"`,
        fp.amount_paid,
        fp.payment_method
      ]);
      exportCSV('Fee_Collection_Report', headers, rows);
    } else {
      const headers = ['Expense ID', 'Date', 'Category', 'Title', 'Amount', 'Status'];
      const rows = reportData.expenses.map(e => [
        e.expense_id,
        new Date(e.expense_date).toLocaleDateString('en-IN'),
        e.category_id?.name || 'N/A',
        `"${e.title}"`,
        e.amount,
        e.status
      ]);
      exportCSV('Expense_Report', headers, rows);
    }
  };

  const s = reportData.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Financial Reports & Statements</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Audit school income, operational expenditures, payroll accounts, and net profit & loss balance</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center text-xs font-black transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-2 text-slate-500" /> Print Report
          </button>
          <button
            onClick={handleExportCurrent}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" /> Export Statement
          </button>
        </div>
      </div>

      {/* Report Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        {[
          { id: 'pnl', label: 'Profit & Loss Statement' },
          { id: 'daily', label: 'Daily Expense' },
          { id: 'monthly', label: 'Monthly Expense' },
          { id: 'yearly', label: 'Yearly Expense' },
          { id: 'income', label: 'Income Report' },
          { id: 'payroll', label: 'Payroll Expense' },
          { id: 'fee', label: 'Fee Collection Revenue' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              reportType === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content Body */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : reportType === 'pnl' ? (
        /* Profit & Loss Statement Card */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Gross Total Income</span>
              <h3 className="text-3xl font-black text-emerald-700 mt-2">{formatCurr(s.totalOverallIncome)}</h3>
              <div className="mt-3 pt-3 border-t border-emerald-200/60 text-xs font-bold text-emerald-700 space-y-1">
                <div className="flex justify-between"><span>Fee Revenue:</span><span>{formatCurr(s.totalFeeIncome)}</span></div>
                <div className="flex justify-between"><span>Other Income:</span><span>{formatCurr(s.totalManualIncome)}</span></div>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl">
              <span className="text-xs font-black text-rose-800 uppercase tracking-wider">Gross Total Expenses</span>
              <h3 className="text-3xl font-black text-rose-700 mt-2">{formatCurr(s.totalOverallExpense)}</h3>
              <div className="mt-3 pt-3 border-t border-rose-200/60 text-xs font-bold text-rose-700 space-y-1">
                <div className="flex justify-between"><span>Operational:</span><span>{formatCurr(s.totalManualExpense)}</span></div>
                <div className="flex justify-between"><span>Payroll:</span><span>{formatCurr(s.totalPayrollExpense)}</span></div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border ${s.netProfitLoss >= 0 ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
              <span className="text-xs font-black uppercase tracking-wider">Net Profit / Loss</span>
              <h3 className="text-3xl font-black mt-2">{formatCurr(s.netProfitLoss)}</h3>
              <p className="text-xs font-bold mt-3 pt-3 border-t border-current/20">
                Formula: Net Profit/Loss = Total Income - Total Expenses
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
            <h3 className="text-base font-black text-slate-800">Income vs Expense Detailed Statement</h3>
            <div className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              <div className="py-3 flex justify-between"><span>Student Fee Collections (Net Refunds)</span><span className="font-black text-emerald-600">+{formatCurr(s.totalFeeIncome)}</span></div>
              <div className="py-3 flex justify-between"><span>Direct Non-Fee School Incomes</span><span className="font-black text-emerald-600">+{formatCurr(s.totalManualIncome)}</span></div>
              <div className="py-3 flex justify-between"><span>Staff & Teacher Payroll Disbursements</span><span className="font-black text-rose-600">-{formatCurr(s.totalPayrollExpense)}</span></div>
              <div className="py-3 flex justify-between"><span>Campus & Operational Expenses</span><span className="font-black text-rose-600">-{formatCurr(s.totalManualExpense)}</span></div>
              <div className="py-4 flex justify-between text-base font-black border-t-2 border-slate-900 pt-4">
                <span>Net Audit Reserve Surplus</span>
                <span className={s.netProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurr(s.netProfitLoss)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : reportType === 'payroll' ? (
        /* Payroll Expense Report */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400">Teacher Payroll Cost</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{formatCurr(s.teacherSalaryCost)}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400">Staff Payroll Cost</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{formatCurr(s.staffSalaryCost)}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400">Total Payroll Cost</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1">{formatCurr(s.totalPayrollExpense)}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase">
                  <th className="p-4 pl-6">Employee Name</th>
                  <th className="p-4">Role & Designation</th>
                  <th className="p-4">Period</th>
                  <th className="p-4">Disbursed Net Salary</th>
                  <th className="p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {reportData.payrolls.map(p => (
                  <tr key={p._id}>
                    <td className="p-4 pl-6 font-black text-slate-800">{p.employee_name}</td>
                    <td className="p-4"><span className="font-bold text-slate-700">{p.employee_role}</span> ({p.designation})</td>
                    <td className="p-4 font-mono">{p.month}/{p.year}</td>
                    <td className="p-4 font-black text-slate-900">{formatCurr(p.salary_breakdown?.net_salary)}</td>
                    <td className="p-4 pr-6 font-bold text-emerald-600">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : reportType === 'fee' ? (
        /* Fee Revenue Report */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400">Total Fees Collected</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatCurr(s.totalFeeIncome)}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400">Pending Uncollected Fees</span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{formatCurr(s.pendingFeesTotal)}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400">Refund Disbursements</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1">{formatCurr(s.totalRefunds)}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase">
                  <th className="p-4 pl-6">Receipt No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4 pr-6">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {reportData.feePayments.map(fp => (
                  <tr key={fp._id}>
                    <td className="p-4 pl-6 font-mono font-black text-blue-700">{fp.receipt_number}</td>
                    <td className="p-4 text-slate-500">{new Date(fp.payment_date).toLocaleDateString('en-IN')}</td>
                    <td className="p-4 font-black text-slate-800">{fp.student_id?.student_name || 'Student'}</td>
                    <td className="p-4 font-black text-slate-900">{formatCurr(fp.amount_paid)}</td>
                    <td className="p-4 pr-6 font-bold text-slate-600">{fp.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Expenses & Incomes General Table */
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase">
                <th className="p-4 pl-6">Ref/ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Category / Type</th>
                <th className="p-4">Title / Description</th>
                <th className="p-4 pr-6">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {reportType === 'income' ? (
                reportData.incomes.map(i => (
                  <tr key={i._id}>
                    <td className="p-4 pl-6 font-mono font-black text-emerald-700">{i.income_id}</td>
                    <td className="p-4 text-slate-500">{new Date(i.income_date).toLocaleDateString('en-IN')}</td>
                    <td className="p-4 font-black text-slate-800">{i.income_type}</td>
                    <td className="p-4 text-slate-500">{i.description || '—'}</td>
                    <td className="p-4 pr-6 font-black text-emerald-600">+{formatCurr(i.amount)}</td>
                  </tr>
                ))
              ) : (
                reportData.expenses.map(e => (
                  <tr key={e._id}>
                    <td className="p-4 pl-6 font-mono font-black text-blue-700">{e.expense_id}</td>
                    <td className="p-4 text-slate-500">{new Date(e.expense_date).toLocaleDateString('en-IN')}</td>
                    <td className="p-4 font-black text-slate-800">{e.category_id?.name || 'Category'}</td>
                    <td className="p-4 text-slate-700 font-bold">{e.title}</td>
                    <td className="p-4 pr-6 font-black text-rose-600">-{formatCurr(e.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
