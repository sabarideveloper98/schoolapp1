import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard,
  PieChart as PieChartIcon, Calendar, ArrowUpRight, ArrowDownRight,
  ShieldCheck, RefreshCw, BarChart2, Award
} from 'lucide-react';

export default function FinanceDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    monthlyExpenses: 0,
    monthlyIncome: 0,
    feeCollectionIncome: 0,
    payrollExpenses: 0,
    netBalance: 0,
    todayIncome: 0,
    todayExpenses: 0,
    thisMonthIncome: 0,
    thisMonthExpenses: 0,
    monthlyTrend: [],
    categoryBreakdown: []
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5005/api/schooladmin/finance/dashboard', config);
      setStats(res.data);
    } catch (error) {
      toast.error('Failed to load finance analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const formatCurr = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  const maxExpenseTrend = Math.max(...stats.monthlyTrend.map(t => t.expenses), 1);
  const maxIncomeTrend = Math.max(...stats.monthlyTrend.map(t => t.income), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800">Finance & Expense Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 uppercase tracking-wider">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-1">Real-time ledger overview, profit & loss analysis, and integrated cash flow statistics</p>
        </div>
        <button
          onClick={fetchStats}
          className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl flex items-center text-xs font-black transition-all cursor-pointer w-fit"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh Financials
        </button>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Income */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-emerald-100 uppercase tracking-wider">Total Income</p>

              <h3 className="text-2xl font-black mt-2">{formatCurr(stats.totalIncome)}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-400/30 flex items-center justify-between text-xs font-bold text-emerald-100">
            <span>Fee Revenue: {formatCurr(stats.feeCollectionIncome)}</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-200" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-2xl text-white shadow-lg shadow-rose-500/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-rose-100 uppercase tracking-wider">Total Expenses</p>
              <h3 className="text-2xl font-black mt-2">{formatCurr(stats.totalExpenses)}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-rose-400/30 flex items-center justify-between text-xs font-bold text-rose-100">
            <span>Payroll Expense: {formatCurr(stats.payrollExpenses)}</span>
            <ArrowDownRight className="w-4 h-4 text-rose-200" />
          </div>
        </div>

        {/* Net Balance */}
        <div className={`p-6 rounded-2xl text-white shadow-lg ${stats.netBalance >= 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/10' : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/10'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-blue-100 uppercase tracking-wider">Net Balance</p>
              <h3 className="text-2xl font-black mt-2">{formatCurr(stats.netBalance)}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white/90">
            <span>Status: {stats.netBalance >= 0 ? 'Net Surplus' : 'Deficit Reserve'}</span>
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Monthly Net */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-lg shadow-slate-900/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-slate-300 uppercase tracking-wider">This Month Net</p>
              <h3 className="text-2xl font-black mt-2">{formatCurr(stats.thisMonthIncome - stats.thisMonthExpenses)}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>In: {formatCurr(stats.thisMonthIncome)} | Out: {formatCurr(stats.thisMonthExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Today & This Month Quick Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">Today's Income</p>
            <p className="text-base font-black text-slate-800">{formatCurr(stats.todayIncome)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">Today's Expenses</p>
            <p className="text-base font-black text-slate-800">{formatCurr(stats.todayExpenses)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">This Month Income</p>
            <p className="text-base font-black text-slate-800">{formatCurr(stats.thisMonthIncome)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400">This Month Expenses</p>
            <p className="text-base font-black text-slate-800">{formatCurr(stats.thisMonthExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" /> Income vs Expenses Trend
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Monthly cash flow comparative analytics</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-600"><span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Income</span>
              <span className="flex items-center gap-1 text-rose-600"><span className="w-3 h-3 bg-rose-500 rounded-full"></span> Expenses</span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {stats.monthlyTrend.map((m, idx) => {
              const maxVal = Math.max(m.income, m.expenses, 1);
              const incPct = Math.round((m.income / maxVal) * 100);
              const expPct = Math.round((m.expenses / maxVal) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{m.month}</span>
                    <span>Net: <strong className={m.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurr(m.net)}</strong></span>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-2 rounded-xl">
                    <div className="h-3 bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${incPct}%` }} title={`Income: ${formatCurr(m.income)}`} />
                    <div className="h-3 bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${expPct}%` }} title={`Expenses: ${formatCurr(m.expenses)}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Category Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600" /> Expense Category Distribution
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Top expenditure categories by volume</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 text-center py-8">No expense records found to plot distribution.</p>
            ) : (
              stats.categoryBreakdown.map((cat, idx) => {
                const totalExp = Math.max(stats.totalExpenses, 1);
                const pct = Math.round((cat.amount / totalExp) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{cat.category}</span>
                      <span className="text-slate-500">{formatCurr(cat.amount)} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
