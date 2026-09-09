import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import { 
  CreditCard, 
  Users, 
  Calendar, 
  Coins, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Printer, 
  Sparkles, 
  Receipt, 
  ArrowRight, 
  X,
  Building2,
  Clock
} from 'lucide-react';

const SubscriptionManagement = () => {
  const { user } = useAuthStore();

  // Active Subscription & Rates State
  const [loading, setLoading] = useState(true);
  const [schoolData, setSchoolData] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [ratesConfig, setRatesConfig] = useState({
    rate_1_year: 50,
    rate_2_years: 45,
    rate_3_years: 40,
    rate_5_years: 30
  });

  // Step 1: Student Count (default: 1000)
  const [studentCount, setStudentCount] = useState('1000');

  // Step 2: Duration Options ('1 Year', '2 Years', '3 Years', '5 Years')
  const [selectedDuration, setSelectedDuration] = useState('3 Years');

  // Checkout & Invoice Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  useEffect(() => {
    fetchCurrentSubscription();
  }, [user]);

  const fetchCurrentSubscription = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('http://localhost:5005/api/subscription/schooladmin/current', config);
      
      setSchoolData(data.school || null);
      setActiveSubscription(data.activeSubscription || null);
      setSubscriptionHistory(data.history || []);
      if (data.ratesConfig) {
        setRatesConfig({
          rate_1_year: data.ratesConfig.rate_1_year ?? 50,
          rate_2_years: data.ratesConfig.rate_2_years ?? 45,
          rate_3_years: data.ratesConfig.rate_3_years ?? 40,
          rate_5_years: data.ratesConfig.rate_5_years ?? 30
        });
      }
    } catch (error) {
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get rate per student for duration
  const getPricePerStudent = (duration) => {
    switch (duration) {
      case '1 Year': return ratesConfig.rate_1_year;
      case '2 Years': return ratesConfig.rate_2_years;
      case '3 Years': return ratesConfig.rate_3_years;
      case '5 Years': return ratesConfig.rate_5_years;
      default: return ratesConfig.rate_1_year;
    }
  };

  const getYearsFromDuration = (duration) => {
    if (duration === '2 Years') return 2;
    if (duration === '3 Years') return 3;
    if (duration === '5 Years') return 5;
    return 1;
  };

  const parsedStudentCount = Math.max(0, parseInt(studentCount) || 0);
  const currentDurationYears = getYearsFromDuration(selectedDuration);
  const currentRatePerStudent = getPricePerStudent(selectedDuration);
  const calculatedTotalAmount = parsedStudentCount * currentRatePerStudent * currentDurationYears;

  // Validation
  const isValidCount = parsedStudentCount > 0;

  // Razorpay Order Creation & Activation
  const handleProceedToSubscribe = () => {
    if (!isValidCount) {
      toast.error('Please enter a valid student count greater than 0');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleConfirmRazorpayPayment = async () => {
    setProcessingPayment(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // Step 1: Create Order
      const orderRes = await axios.post('http://localhost:5005/api/subscription/schooladmin/create-order', {
        student_count: parsedStudentCount,
        duration: selectedDuration
      }, config);

      const orderData = orderRes.data;

      // Step 2: Verify & Activate Payment
      const paymentId = `pay_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const verifyRes = await axios.post('http://localhost:5005/api/subscription/schooladmin/verify-payment', {
        student_count: parsedStudentCount,
        duration: selectedDuration,
        razorpay_order_id: orderData.id,
        razorpay_payment_id: paymentId,
        razorpay_signature: 'sig_mock_verified'
      }, config);

      toast.success('🎉 Subscription Payment Successful! Subscription Activated.');
      setIsCheckoutOpen(false);

      // Open Invoice preview
      if (verifyRes.data?.subscription) {
        setActiveInvoice(verifyRes.data.subscription);
      }

      fetchCurrentSubscription();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment verification failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const durationOptions = [
    { label: '1 Year', years: 1, rate: ratesConfig.rate_1_year, badge: 'Standard' },
    { label: '2 Years', years: 2, rate: ratesConfig.rate_2_years, badge: 'Popular' },
    { label: '3 Years', years: 3, rate: ratesConfig.rate_3_years, badge: 'Best Value' },
    { label: '5 Years', years: 5, rate: ratesConfig.rate_5_years, badge: 'Maximum Savings' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500 font-bold">
        Loading subscription module...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">SaaS Subscription & Licensing</h2>
        <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <span>School Admin</span>
          <span>-</span>
          <span className="text-blue-600">Dynamic Subscription Pricing & Activation</span>
        </div>
      </div>

      {/* Active Subscription Status Banner */}
      {activeSubscription ? (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active SaaS License
                </span>
                <span className="text-slate-400 text-xs font-bold">• {schoolData?.name}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                {activeSubscription.student_count} Students License Plan ({activeSubscription.selected_duration})
              </h3>
              <p className="text-xs font-medium text-slate-300">
                Invoice Number: <span className="font-mono text-blue-300 font-bold">{activeSubscription.invoice_number}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs font-semibold">
              <div>
                <span className="text-[10px] font-bold text-slate-300 block uppercase">Valid Until</span>
                <strong className="text-sm font-extrabold text-white">
                  {new Date(activeSubscription.subscription_end_date).toLocaleDateString()}
                </strong>
              </div>
              <div className="border-l border-white/20 pl-4">
                <span className="text-[10px] font-bold text-slate-300 block uppercase">Total Paid</span>
                <strong className="text-sm font-extrabold text-emerald-400">
                  ₹{activeSubscription.total_amount?.toLocaleString()}
                </strong>
              </div>
              <button
                onClick={() => setActiveInvoice(activeSubscription)}
                className="ml-auto bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" /> View Invoice
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-wide">No Active Subscription Found</h4>
            <p className="text-xs font-semibold text-amber-700">Please select student count and duration below to calculate & activate your school license.</p>
          </div>
          <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase rounded-full tracking-wider">
            Pending Activation
          </span>
        </div>
      )}

      {/* Dynamic Subscription Pricing Calculator Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-850 uppercase tracking-wide">Dynamic Subscription Pricing Calculator</h3>
            <p className="text-xs font-semibold text-slate-400">Enter total student capacity & select plan duration. Calculations update instantly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Inputs (Step 1 & Step 2) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Enter Total Student Count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" /> Step 1: Enter Total Student Count *
                </label>
                <span className="text-[11px] font-bold text-slate-400">Numeric input &gt; 0</span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  placeholder="Enter student count (e.g. 1000)"
                  value={studentCount}
                  onChange={(e) => setStudentCount(e.target.value)}
                  className="w-full h-14 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400 uppercase tracking-wider">
                  Students
                </span>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
                {[100, 500, 1000, 1500, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStudentCount(preset.toString())}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      parsedStudentCount === preset
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {preset} Students
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Duration */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" /> Step 2: Select Subscription Duration *
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {durationOptions.map((opt) => {
                  const isSelected = selectedDuration === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedDuration(opt.label)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between h-28 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full w-fit ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {opt.badge}
                      </span>
                      <div>
                        <strong className="text-base font-black text-slate-800 block">{opt.label}</strong>
                        <span className="text-xs font-extrabold text-blue-600">₹{opt.rate} <span className="text-[10px] text-slate-400 font-semibold">/ student</span></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Auto Calculate Display Card (Step 3) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-1">Step 3: Auto Calculated Summary</span>
              <h4 className="text-xl font-black tracking-tight">Subscription Review</h4>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-300">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span>Total Students</span>
                <strong className="text-sm font-black text-white">{parsedStudentCount} Students</strong>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span>Selected Plan</span>
                <strong className="text-sm font-black text-blue-400">{selectedDuration}</strong>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span>Price Per Student</span>
                <strong className="text-sm font-black text-emerald-400">₹{currentRatePerStudent}</strong>
              </div>

              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Formula Calculation</span>
                <p className="text-xs font-mono text-slate-300">
                  {parsedStudentCount} Students × ₹{currentRatePerStudent} × {currentDurationYears} Yr{currentDurationYears > 1 ? 's' : ''} = <span className="text-white font-bold">₹{calculatedTotalAmount.toLocaleString()}</span>
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">Calculated Total Amount</span>
                <strong className="text-3xl font-black text-emerald-400 tracking-tight block">
                  ₹{calculatedTotalAmount.toLocaleString()}
                </strong>
              </div>
            </div>

            <button
              onClick={handleProceedToSubscribe}
              disabled={!isValidCount}
              className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" /> Subscribe Now with Razorpay
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Example Calculation Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Live Price Comparison Matrix</h3>
            <p className="text-xs font-semibold text-slate-400">Compare total costs across various student capacities and duration plans.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Students</th>
                <th className="py-3 px-4">1 Year (₹{ratesConfig.rate_1_year}/yr)</th>
                <th className="py-3 px-4">2 Years (₹{ratesConfig.rate_2_years}/yr × 2)</th>
                <th className="py-3 px-4">3 Years (₹{ratesConfig.rate_3_years}/yr × 3)</th>
                <th className="py-3 px-4">5 Years (₹{ratesConfig.rate_5_years}/yr × 5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {[100, 500, 1000, 2000].map((count) => (
                <tr 
                  key={count} 
                  className={`hover:bg-slate-50/70 transition-colors ${
                    parsedStudentCount === count ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-black text-slate-800">{count}</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-extrabold">₹{(count * ratesConfig.rate_1_year * 1).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-blue-600 font-extrabold">₹{(count * ratesConfig.rate_2_years * 2).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-indigo-600 font-extrabold">₹{(count * ratesConfig.rate_3_years * 3).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-purple-600 font-extrabold">₹{(count * ratesConfig.rate_5_years * 5).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Order & Invoice History */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 sm:p-8 space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Subscription Payment & Invoice History</h3>
          <p className="text-xs font-semibold text-slate-400">All past SaaS subscription payments and official generated invoices for this school.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Student Capacity</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Rate / Student</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {subscriptionHistory.map((sub) => (
                <tr key={sub._id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {sub.invoice_number}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {sub.student_count} Students
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
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => setActiveInvoice(sub)}
                      className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl cursor-pointer transition-colors"
                      title="View Invoice"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {subscriptionHistory.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 font-bold text-xs">
                    No past subscription invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Razorpay Checkout Payment Review Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 block">Razorpay Secure Checkout</span>
                <h3 className="text-xl font-black tracking-tight">Complete SaaS Subscription</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase">School Name</span>
                  <span className="text-slate-900 font-black">{schoolData?.name || 'School Account'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase">Total Students</span>
                  <span className="text-slate-900 font-black">{parsedStudentCount} Students</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase">Subscription Duration</span>
                  <span className="text-blue-600 font-black">{selectedDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase">Rate Per Student</span>
                  <span className="text-slate-900 font-black">₹{currentRatePerStudent}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black">
                  <span>Total Payable Amount</span>
                  <span className="text-emerald-600 text-lg">₹{calculatedTotalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <p className="text-[11px] font-semibold text-emerald-800">
                  Instant activation upon successful payment verification. Invoice will be generated automatically.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-1/2 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRazorpayPayment}
                  disabled={processingPayment}
                  className="w-1/2 h-11 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {processingPayment ? 'Processing Payment...' : 'Pay & Activate Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 relative animate-in fade-in zoom-in-95 duration-150 print-container">
            {/* Header */}
            <div className="flex justify-between items-start pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">OFFICIAL SAAS INVOICE</h2>
                <p className="text-xs font-bold text-slate-400 mt-0.5">School Management System Subscription Receipt</p>
              </div>
              <button
                onClick={() => setActiveInvoice(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold text-slate-700">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Invoice Number</span>
                <span className="text-blue-600 font-mono font-black">{activeInvoice.invoice_number}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Issue Date</span>
                <span>{new Date(activeInvoice.subscription_start_date || activeInvoice.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Status</span>
                <span className="text-emerald-600 font-black uppercase">PAID</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment ID</span>
                <span className="font-mono text-[11px]">{activeInvoice.payment_id}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs font-bold text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4">Rate / Student</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-4 px-4 font-black text-slate-800">
                      SaaS License Subscription ({activeInvoice.selected_duration})
                    </td>
                    <td className="py-4 px-4">{activeInvoice.student_count} Students</td>
                    <td className="py-4 px-4">₹{activeInvoice.price_per_student}</td>
                    <td className="py-4 px-4 text-right font-black text-emerald-600">
                      ₹{activeInvoice.total_amount?.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-400">
                Valid: {new Date(activeInvoice.subscription_start_date).toLocaleDateString()} — {new Date(activeInvoice.subscription_end_date).toLocaleDateString()}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Amount Paid</span>
                <strong className="text-2xl font-black text-slate-850">₹{activeInvoice.total_amount?.toLocaleString()}</strong>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print / Save Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
