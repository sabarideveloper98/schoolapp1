import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { 
  Coins, 
  Save, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  CreditCard, 
  Users, 
  Receipt, 
  TrendingUp, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

const SubscriptionSettings = () => {
  const { user } = useAuthStore();
  const [rates, setRates] = useState({
    rate_1_year: 50,
    rate_2_years: 45,
    rate_3_years: 40,
    rate_5_years: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const [configRes, subsRes] = await Promise.all([
        axios.get('http://localhost:5005/api/subscription/config', config),
        axios.get('http://localhost:5005/api/subscription/superadmin/subscriptions', config)
      ]);

      if (configRes.data) {
        setRates({
          rate_1_year: configRes.data.rate_1_year ?? 50,
          rate_2_years: configRes.data.rate_2_years ?? 45,
          rate_3_years: configRes.data.rate_3_years ?? 40,
          rate_5_years: configRes.data.rate_5_years ?? 30
        });
      }
      setSubscriptions(subsRes.data || []);
    } catch (error) {
      toast.error('Failed to load subscription settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (field, value) => {
    const num = Math.max(0, Number(value) || 0);
    setRates(prev => ({ ...prev, [field]: num }));
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put('http://localhost:5005/api/subscription/superadmin/config', rates, config);
      toast.success('Subscription per-student pricing updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update rates');
    } finally {
      setSaving(false);
    }
  };

  // Filter subscriptions by search
  const filteredSubscriptions = subscriptions.filter(sub => {
    const schoolName = sub.school_id?.name || '';
    const inv = sub.invoice_number || '';
    const q = searchQuery.toLowerCase();
    return schoolName.toLowerCase().includes(q) || inv.toLowerCase().includes(q);
  });

  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const activeCount = subscriptions.filter(s => s.status === 'Active').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500 font-bold">
        Loading subscription settings...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">SaaS Subscription & Pricing Settings</h2>
        <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <span>Super Admin</span>
          <span>-</span>
          <span className="text-blue-600">Per-Student Pricing & Revenue Log</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total SaaS Revenue</span>
            <h3 className="text-2xl font-black text-slate-800">₹{totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Subscriptions</span>
            <h3 className="text-2xl font-black text-slate-800">{activeCount}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Orders</span>
            <h3 className="text-2xl font-black text-slate-800">{subscriptions.length}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Base Rate (1 Yr)</span>
            <h3 className="text-2xl font-black text-slate-800">₹{rates.rate_1_year} <span className="text-xs text-slate-400 font-bold">/ student</span></h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pricing Rate Configuration Form */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Per-Student Subscription Rate Configuration</h3>
            <p className="text-xs font-semibold text-slate-400">Configure price per student for each subscription duration. These rates dynamically update the calculation for School Admins.</p>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">1 Year Plan Rate</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={rates.rate_1_year}
                  onChange={(e) => handleRateChange('rate_1_year', e.target.value)}
                  className="w-full h-11 pl-8 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <p className="text-[11px] font-bold text-slate-400">Per student per year</p>
            </div>

            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">2 Years Plan Rate</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={rates.rate_2_years}
                  onChange={(e) => handleRateChange('rate_2_years', e.target.value)}
                  className="w-full h-11 pl-8 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <p className="text-[11px] font-bold text-slate-400">Per student per year</p>
            </div>

            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">3 Years Plan Rate</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={rates.rate_3_years}
                  onChange={(e) => handleRateChange('rate_3_years', e.target.value)}
                  className="w-full h-11 pl-8 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <p className="text-[11px] font-bold text-slate-400">Per student per year</p>
            </div>

            <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">5 Years Plan Rate</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={rates.rate_5_years}
                  onChange={(e) => handleRateChange('rate_5_years', e.target.value)}
                  className="w-full h-11 pl-8 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <p className="text-[11px] font-bold text-slate-400">Per student per year</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Config...' : 'Save Pricing Rates'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Sample Pricing Matrix Preview */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Live Dynamic Pricing Preview Matrix</h3>
            <p className="text-xs font-semibold text-slate-400">Sample calculations generated dynamically based on active Super Admin rates.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Student Count</th>
                <th className="py-3 px-4">1 Year (₹{rates.rate_1_year}/yr)</th>
                <th className="py-3 px-4">2 Years (₹{rates.rate_2_years}/yr × 2)</th>
                <th className="py-3 px-4">3 Years (₹{rates.rate_3_years}/yr × 3)</th>
                <th className="py-3 px-4">5 Years (₹{rates.rate_5_years}/yr × 5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {[100, 500, 1000, 2000].map((students) => (
                <tr key={students} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-black text-slate-800">{students} Students</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-extrabold">₹{(students * rates.rate_1_year * 1).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-blue-600 font-extrabold">₹{(students * rates.rate_2_years * 2).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-indigo-600 font-extrabold">₹{(students * rates.rate_3_years * 3).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-purple-600 font-extrabold">₹{(students * rates.rate_5_years * 5).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All School Subscriptions Log Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">All School Subscriptions & Invoices</h3>
            <p className="text-xs font-semibold text-slate-400">Complete record of school subscription orders, payments, and generated invoices.</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search school or invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">School Name</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Student Count</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Rate / Student</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Valid Until</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredSubscriptions.map((sub) => (
                <tr key={sub._id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-extrabold text-slate-800">
                    {sub.school_id?.name || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {sub.invoice_number}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {sub.student_count}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-700">
                    {sub.selected_duration}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-600">
                    ₹{sub.price_per_student}
                  </td>
                  <td className="py-3.5 px-4 font-black text-emerald-600">
                    ₹{sub.total_amount?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    {sub.payment_id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      sub.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-500">
                    {new Date(sub.subscription_end_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredSubscriptions.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-bold text-xs">
                    No subscriptions found.
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

export default SubscriptionSettings;
