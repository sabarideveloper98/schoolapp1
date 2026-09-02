import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Printer, CheckCircle, AlertTriangle, Clock, ShieldCheck, Tag, DollarSign, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const ParentFees = () => {
  const { user } = useAuthStore();
  const [childrenFees, setChildrenFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Selected Child
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  // Razorpay simulator state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [checkoutItem, setCheckoutItem] = useState(null); // active item paying
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [processing, setProcessing] = useState(false);

  // Refund request state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const fetchParentFees = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5005/api/parent/fees', config);
      setChildrenFees(res.data.fees);
      setPayments(res.data.payments);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load parent fees ledger');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchParentFees();
  }, [user]);

  const activeChildFee = childrenFees[activeChildIndex];

  const handleOpenSimulator = (item) => {
    const outstanding = item.amount - item.discount_amount - item.paid_amount + (item.fine_calculated || 0);
    if (outstanding <= 0) {
      toast.info('Fee already fully settled!');
      return;
    }
    setCheckoutItem(item);
    setPayoutAmount(outstanding);
    setCardNumber('4111 2222 3333 4444');
    setCardExpiry('12/28');
    setCardCVV('123');
    setIsSimulatorOpen(true);
  };

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    // Simulate gateway delay
    setTimeout(async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        
        // Mock order payload
        const resOrder = await axios.post('http://localhost:5005/api/parent/fees/pay-order', {
          amount: payoutAmount
        }, config);

        const orderId = resOrder.data.id;
        const paymentId = `pay_${Math.random().toString(36).substring(2, 15)}`;
        const signature = `sig_${Math.random().toString(36).substring(2, 15)}`;

        // Verify payload mapping
        const payPayload = {
          student_id: activeChildFee.student_id?._id,
          academic_year: activeChildFee.academic_year,
          payment_method: 'Razorpay',
          notes: 'Self-checkout online parent payment',
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          items_payment: [
            {
              category_id: checkoutItem.category_id?._id || checkoutItem.category_id,
              amount_to_pay: checkoutItem.amount - checkoutItem.discount_amount - checkoutItem.paid_amount,
              fine_to_pay: checkoutItem.fine_calculated || 0
            }
          ]
        };

        const resVerify = await axios.post('http://localhost:5005/api/parent/fees/pay-verify', payPayload, config);
        toast.success('Online checkout payment processed successfully!');
        
        // Display Receipt
        setReceiptData({
          ...resVerify.data.payment,
          student: activeChildFee.student_id,
          class: activeChildFee.class_id
        });

        setIsSimulatorOpen(false);
        setIsReceiptModalOpen(true);
        fetchParentFees();
        setProcessing(false);
      } catch (error) {
        toast.error('Payment checkout failed');
        setProcessing(false);
      }
    }, 1500);
  };

  const handleRequestRefund = async (e) => {
    e.preventDefault();
    if (!refundAmount || !refundReason) {
      toast.error('Please enter refund amount and reason');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5005/api/parent/fees/refund', {
        student_id: activeChildFee.student_id?._id,
        academic_year: activeChildFee.academic_year,
        amount: Number(refundAmount),
        reason: refundReason
      }, config);

      toast.success('Refund request submitted successfully to accountant!');
      setIsRefundModalOpen(false);
      setRefundAmount('');
      setRefundReason('');
      fetchParentFees();
    } catch (error) {
      toast.error('Failed to submit refund request');
    }
  };

  const showPastReceipt = (pay) => {
    setReceiptData({
      ...pay,
      student: pay.student_id,
      class: pay.student_id?.class_id
    });
    setIsReceiptModalOpen(true);
  };

  if (loading) return <div className="flex justify-center py-12 text-slate-550 font-semibold">Loading child billing profiles...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Child Fees & Payouts</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Review student bills, trigger secure online checkout payments, and access transaction receipts</p>
        </div>
      </div>

      {/* Children Selection Tabs */}
      {childrenFees.length > 1 && (
        <div className="flex gap-2">
          {childrenFees.map((fee, idx) => (
            <button
              key={fee._id}
              onClick={() => setActiveChildIndex(idx)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeChildIndex === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {fee.student_id?.student_name}
            </button>
          ))}
        </div>
      )}

      {activeChildFee ? (
        <div className="space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Total Bill</span>
                <h3 className="text-xl font-black text-slate-800 mt-1">
                  ₹{activeChildFee.items.reduce((s, i) => s + i.amount, 0)}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Concessions</span>
                <h3 className="text-xl font-black text-emerald-600 mt-1">
                  ₹{activeChildFee.items.reduce((s, i) => s + i.discount_amount, 0)}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Tag className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Total Paid</span>
                <h3 className="text-xl font-black text-blue-600 mt-1">
                  ₹{activeChildFee.items.reduce((s, i) => s + i.paid_amount, 0)}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Outstanding Balance</span>
                <h3 className="text-xl font-black text-red-500 mt-1">
                  ₹{activeChildFee.items.reduce((s, i) => {
                    const o = i.amount - i.discount_amount - i.paid_amount;
                    return s + (o > 0 ? o : 0);
                  }, 0)}
                </h3>
              </div>
              <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Active Bills Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Assigned Fee Schedule</h3>
              <button
                onClick={() => setIsRefundModalOpen(true)}
                className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Request Fee Refund
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Fee Line Item</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Concession</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Fine</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {activeChildFee.items.map((item, idx) => {
                    const remaining = item.amount - item.discount_amount - item.paid_amount;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-850">
                          {item.category_id?.name || 'Category'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">₹{item.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-emerald-600">₹{item.discount_amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-amber-600">
                          ₹{item.fine_calculated || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                          {new Date(item.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' :
                            item.status === 'Partial' ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {item.status !== 'Paid' ? (
                            <button
                              onClick={() => handleOpenSimulator(item)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-[1.02] cursor-pointer"
                            >
                              Pay Online
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold">Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refund Requests Logs */}
          {activeChildFee.refunds?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Refund Requests</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Refund ID</th>
                      <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Reason</th>
                      <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {activeChildFee.refunds.map(ref => (
                      <tr key={ref._id} className="text-xs">
                        <td className="px-4 py-2.5 font-bold text-slate-700">{ref.ref_no}</td>
                        <td className="px-4 py-2.5 font-black text-red-500">₹{ref.amount}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-500">{ref.reason}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
                            ref.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' :
                            ref.status === 'Approved' ? 'bg-blue-500/10 text-blue-600' :
                            ref.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {ref.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Past Payments History */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Payment History Receipts</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Receipt No</th>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Method</th>
                    <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Amount Paid</th>
                    <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {payments.map(pay => (
                    <tr key={pay._id} className="text-xs">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{pay.receipt_number}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-500">{new Date(pay.payment_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-600">{pay.payment_method}</td>
                      <td className="px-4 py-2.5 font-black text-blue-600">₹{pay.amount_paid}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => showPastReceipt(pay)}
                          className="text-blue-600 hover:text-blue-500 font-bold hover:underline cursor-pointer"
                        >
                          View Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-6 text-center text-slate-400 font-bold">
                        No transactions captured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white p-12 text-center text-slate-400 font-bold rounded-2xl border border-slate-100">
          No children billing records linked to your parent user ID.
        </div>
      )}

      {/* Secure Checkout Razorpay Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800 shadow-2xl text-white space-y-6">
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">Razorpay Secure Checkout</span>
              </div>
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Billing Payout Amount</span>
              <strong className="text-xl font-black text-white">₹{payoutAmount}</strong>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold">Expiry Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-bold">CVV Code</label>
                  <input
                    type="password"
                    value={cardCVV}
                    onChange={(e) => setCardCVV(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 rounded-xl text-xs font-black shadow-lg transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {processing ? 'Authorizing Payout...' : `Pay Securely ₹${payoutAmount}`}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Request Refund Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-800">Submit Payout Refund Request</h3>
            
            <form onSubmit={handleRequestRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Refund Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Reason for Refund *</label>
                <textarea
                  placeholder="Details of the duplicate transaction or cancellation reason..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows="3"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 rounded-lg bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-black cursor-pointer shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full border border-slate-100 shadow-2xl space-y-6 print-container my-8 text-slate-800">
            
            <div className="text-center space-y-1">
              <h1 className="text-xl font-black text-slate-800">FEES PAYMENT RECEIPT</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Parent Portal Slip</p>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Receipt Number</span>
                <strong className="text-slate-850">{receiptData.receipt_number}</strong>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Payment Date</span>
                <strong className="text-slate-850">{new Date(receiptData.payment_date).toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Student Name</span>
                <strong className="text-slate-850">{receiptData.student?.student_name}</strong>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Admission ID</span>
                <strong className="text-slate-850">{receiptData.student?.admission_number}</strong>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Payment Method</span>
                <strong className="text-slate-850">{receiptData.payment_method}</strong>
              </div>
              {receiptData.transaction_id && (
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Transaction ID</span>
                  <strong className="text-slate-850">{receiptData.transaction_id}</strong>
                </div>
              )}
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[9px] font-black text-slate-400 uppercase">Item Description</th>
                    <th className="px-4 py-2 text-right text-[9px] font-black text-slate-400 uppercase">Waiver Applied</th>
                    <th className="px-4 py-2 text-right text-[9px] font-black text-slate-400 uppercase">Fine Settled</th>
                    <th className="px-4 py-2 text-right text-[9px] font-black text-slate-400 uppercase">Total Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {receiptData.breakdown?.map((item, idx) => (
                    <tr key={idx} className="text-xs">
                      <td className="px-4 py-2 font-bold text-slate-700">Fee Category Line</td>
                      <td className="px-4 py-2 text-right text-emerald-600 font-semibold">₹{item.discount_applied || 0}</td>
                      <td className="px-4 py-2 text-right text-amber-600 font-semibold">₹{item.fine_paid || 0}</td>
                      <td className="px-4 py-2 text-right font-black text-slate-850">₹{item.amount + item.fine_paid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-xl">
              <span className="text-xs font-black uppercase tracking-wider">TOTAL AMOUNT SETTLED</span>
              <strong className="text-lg font-black">₹{receiptData.amount_paid}</strong>
            </div>

            <div className="flex justify-between items-end pt-8 text-xs font-bold text-slate-400">
              <div className="text-center w-36">
                <div className="h-0.5 bg-slate-200 mb-2"></div>
                Authorized Signature
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 rounded-lg bg-white"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black flex items-center cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4 mr-2" /> Print Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ParentFees;
