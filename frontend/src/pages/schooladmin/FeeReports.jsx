import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, DollarSign, PieChart, TrendingUp, AlertTriangle, Percent, HelpCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const FeeReports = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [reportsData, setReportsData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [classes, setClasses] = useState([]);

  // Filters
  const [reportType, setReportType] = useState('Daily Collection');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClassId, setSelectedClassId] = useState('');

  const fetchFiltersAndStats = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [resStats, resClasses] = await Promise.all([
        axios.get('/api/schooladmin/fees/dashboard', config),
        axios.get('/api/schooladmin/classes', config)
      ]);
      setDashboardStats(resStats.data);
      setClasses(resClasses.data);
    } catch (error) {
      console.error('Failed to load filters or dashboard analytics');
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      let typeParam = 'Daily';
      if (reportType === 'Monthly Collection') typeParam = 'Monthly';
      if (reportType === 'Class Wise') typeParam = 'Class';

      let url = `/api/schooladmin/fees/reports?type=${typeParam}&date=${selectedDate}&month=${selectedMonth}&year=${selectedYear}`;
      if (selectedClassId) url += `&class_id=${selectedClassId}`;

      const res = await axios.get(url, config);
      setReportsData(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load transaction reports list');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchFiltersAndStats();
    }
  }, [user]);

  useEffect(() => {
    if (user?.token) {
      fetchReports();
    }
  }, [user, reportType, selectedDate, selectedMonth, selectedYear, selectedClassId]);

  const handleExportCSV = () => {
    if (reportsData.length === 0) {
      toast.error('No report data available to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Receipt Number,Student Name,Admission ID,Payment Date,Payment Method,Amount Paid,Transaction ID,Notes\n';

    reportsData.forEach(p => {
      const row = [
        `"${p.receipt_number}"`,
        `"${p.student_id?.student_name || 'N/A'}"`,
        `"${p.student_id?.admission_number || 'N/A'}"`,
        `"${new Date(p.payment_date).toLocaleDateString()}"`,
        `"${p.payment_method}"`,
        p.amount_paid,
        `"${p.transaction_id || '-'}"`,
        `"${p.notes || '-'}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Report_${reportType.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Fee & Collections Reports</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Monitor school revenues, analyze daily receipts cash flow, and export transaction logs</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl flex items-center text-xs font-black transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(16,185,129,0.1)] cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2" /> Export CSV / Excel
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {/* Total Collected */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Total Collected</p>
            <h3 className="text-lg font-black text-slate-850 mt-1">₹{dashboardStats?.totalCollection || 0}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Today's collection */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Today's Cash</p>
            <h3 className="text-lg font-black text-slate-850 mt-1">₹{dashboardStats?.todayCollection || 0}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Pending Fees */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Outstanding</p>
            <h3 className="text-lg font-black text-red-500 mt-1">₹{dashboardStats?.pendingFees || 0}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Total Waivers / Discounts */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Waivers Applied</p>
            <h3 className="text-lg font-black text-indigo-600 mt-1">₹{dashboardStats?.totalDiscounts || 0}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Total Refunds */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Disbursed Refunds</p>
            <h3 className="text-lg font-black text-slate-800 mt-1">₹{dashboardStats?.totalRefunds || 0}</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Est. Revenue</p>
            <h3 className="text-lg font-black text-slate-850 mt-1">₹{dashboardStats?.monthlyRevenue || 0}</h3>
          </div>
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Reports Filter Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Report Category */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="Daily Collection">Daily Collection Report</option>
              <option value="Monthly Collection">Monthly Collection Report</option>
              <option value="Class Wise">Class Wise Report</option>
            </select>
          </div>

          {/* Date Selector for Daily */}
          {reportType === 'Daily Collection' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-11 px-4 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-750"
              />
            </div>
          )}

          {/* Month & Year Selectors for Monthly */}
          {reportType === 'Monthly Collection' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
                >
                  {[...Array(12)].map((_, idx) => (
                    <option key={idx} value={idx + 1}>
                      {new Date(0, idx).toLocaleString('en', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
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
            </>
          )}

          {/* Class Selectors for Class Wise */}
          {reportType === 'Class Wise' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Class Standard</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
              >
                <option value="">-- All Classes --</option>
                {classes.map(cl => (
                  <option key={cl._id} value={cl._id}>{cl.class} - {cl.section}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Reports Table List */}
      <div className="overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Receipt No</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Transaction Ref</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Paid Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {reportsData.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{rec.receipt_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{rec.student_id?.student_name || 'Deleted student'}</span>
                      <span className="text-xs font-semibold text-slate-400">Admission No: {rec.student_id?.admission_number || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                    {new Date(rec.payment_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">{rec.payment_method}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">{rec.transaction_id || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-blue-600">₹{rec.amount_paid}</td>
                </tr>
              ))}
              {reportsData.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold">
                    No transactions matching search parameters.
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

export default FeeReports;
