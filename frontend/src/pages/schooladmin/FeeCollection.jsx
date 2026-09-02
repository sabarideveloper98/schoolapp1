import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Coins, CreditCard, Receipt, FileText, CheckCircle, AlertTriangle, Printer, Tag } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const FeeCollection = () => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [assignedFees, setAssignedFees] = useState([]);

  // Pay Modal State
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [activeFeeRecord, setActiveFeeRecord] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [payoutItems, setPayoutItems] = useState([]);

  // Discount Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [activeDiscountIndex, setActiveDiscountIndex] = useState(null);

  // Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const fetchFilters = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [resClasses, resDiscounts] = await Promise.all([
        axios.get('http://localhost:5005/api/schooladmin/classes', config),
        axios.get('http://localhost:5005/api/schooladmin/fees/discounts', config)
      ]);
      setClasses(resClasses.data);
      setDiscounts(resDiscounts.data.filter(d => d.status === 'Active'));
    } catch (error) {
      toast.error('Failed to load page parameters');
    }
  };

  useEffect(() => {
    if (user?.token) fetchFilters();
  }, [user]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(
        `http://localhost:5005/api/schooladmin/fees/search?query=${searchQuery}&class_id=${selectedClassId}&academic_year=${academicYear}`,
        config
      );
      setAssignedFees(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Search failed');
      setLoading(false);
    }
  };

  const openCollectModal = (record) => {
    setActiveFeeRecord(record);
    
    // Initialize payout inputs
    const payouts = record.items.map(item => {
      const remaining = item.amount - item.discount_amount - item.paid_amount;
      return {
        category_id: item.category_id?._id || item.category_id,
        name: item.category_id?.name || 'Category',
        amount: item.amount,
        discount_amount: item.discount_amount,
        paid_amount: item.paid_amount,
        remaining: remaining > 0 ? remaining : 0,
        fine_calculated: item.fine_calculated || 0,
        amount_to_pay: '',
        fine_to_pay: ''
      };
    });

    setPayoutItems(payouts);
    setPaymentMethod('Cash');
    setTransactionId('');
    setPaymentNotes('');
    setIsCollectModalOpen(true);
  };

  const fillFullPayout = () => {
    const filled = payoutItems.map(item => ({
      ...item,
      amount_to_pay: item.remaining.toString(),
      fine_to_pay: item.fine_calculated.toString()
    }));
    setPayoutItems(filled);
  };

  const handlePayoutItemChange = (idx, field, val) => {
    const temp = [...payoutItems];
    temp[idx][field] = val;
    setPayoutItems(temp);
  };

  const handleSavePayment = async () => {
    // Validate
    const activePayments = payoutItems.filter(p => Number(p.amount_to_pay) > 0 || Number(p.fine_to_pay) > 0);
    if (activePayments.length === 0) {
      toast.error('Please enter payment amounts for at least one fee category line');
      return;
    }

    const payload = {
      student_id: activeFeeRecord.student?._id,
      academic_year: academicYear,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      notes: paymentNotes,
      items_payment: activePayments
    };

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.post('http://localhost:5005/api/schooladmin/fees/collect', payload, config);
      toast.success(res.data.message || 'Fee transaction completed successfully!');
      
      // Load receipt
      setReceiptData({
        ...res.data.payment,
        student: activeFeeRecord.student,
        class: activeFeeRecord.student?.class_id
      });
      
      setIsCollectModalOpen(false);
      setIsReceiptModalOpen(true);
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transaction capture failed');
    }
  };

  const openDiscountWaiver = (idx) => {
    setActiveDiscountIndex(idx);
    setIsDiscountModalOpen(true);
  };

  const applyWaiverScheme = async (discountScheme) => {
    const temp = [...payoutItems];
    const item = temp[activeDiscountIndex];

    let discVal = 0;
    if (discountScheme.type === 'Percentage') {
      discVal = (item.amount * discountScheme.amount) / 100;
    } else {
      discVal = discountScheme.amount;
    }

    // Apply waiver backend
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // Update student's specific item inside StudentFee assignment array
      const itemsPayload = activeFeeRecord.items.map((i, index) => {
        const catId = i.category_id?._id || i.category_id;
        const targetCatId = item.category_id;
        
        if (catId.toString() === targetCatId.toString()) {
          return {
            category_id: catId,
            amount: i.amount,
            due_date: i.due_date,
            fine_type: i.fine_type,
            fine_amount: i.fine_amount,
            discount_id: discountScheme._id,
            discount_amount: discVal,
            paid_amount: i.paid_amount,
            status: i.status
          };
        }
        return {
          category_id: catId,
          amount: i.amount,
          due_date: i.due_date,
          fine_type: i.fine_type,
          fine_amount: i.fine_amount,
          discount_id: i.discount_id,
          discount_amount: i.discount_amount,
          paid_amount: i.paid_amount,
          status: i.status
        };
      });

      await axios.post('http://localhost:5005/api/schooladmin/fees/assignments', {
        student_id: activeFeeRecord.student?._id,
        class_id: activeFeeRecord.student?.class_id?._id,
        academic_year: academicYear,
        items: itemsPayload
      }, config);

      toast.success(`Applied ${discountScheme.name} waiver!`);
      
      // Update local values
      item.discount_amount = discVal;
      item.remaining = Math.max(0, item.amount - discVal - item.paid_amount);
      temp[activeDiscountIndex] = item;
      setPayoutItems(temp);
      
      setIsDiscountModalOpen(false);
      handleSearch();
    } catch (error) {
      toast.error('Failed to save discount waiver mapping');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Collect Student Fees</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Search student ledgers, process partial/full invoice payments, and print transaction slips</p>
        </div>
      </div>

      {/* Search Registers Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Search Query (Name, Phone, or Admission No.)</label>
            <input
              type="text"
              placeholder="e.g. Sabari, ADM-9801..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 px-4 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Filter by Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="">-- Choose Grade --</option>
              {classes.map(cl => (
                <option key={cl._id} value={cl._id}>{cl.class} - {cl.section}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full h-11 px-4 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 cursor-pointer"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all hover:scale-[1.02]"
          >
            Search Ledgers
          </button>
        </div>
      </div>

      {/* Results List */}
      {assignedFees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignedFees.map((rec) => {
            const totalAssigned = rec.items.reduce((s, i) => s + i.amount, 0);
            const totalPaid = rec.items.reduce((s, i) => s + i.paid_amount, 0);
            const totalWaivers = rec.items.reduce((s, i) => s + i.discount_amount, 0);
            const totalDue = totalAssigned - totalWaivers - totalPaid;
            
            return (
              <div key={rec._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-black text-slate-800">{rec.student?.student_name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      Admission Number: {rec.student?.admission_number} | Class: {rec.student?.class_id?.class} - {rec.student?.class_id?.section}
                    </p>
                  </div>
                  <button
                    onClick={() => openCollectModal(rec)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
                  >
                    Collect Fees
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-xl">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Base</span>
                    <strong className="text-xs font-black text-slate-800">₹{totalAssigned}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Waivers</span>
                    <strong className="text-xs font-black text-emerald-600">₹{totalWaivers}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Setted Paid</span>
                    <strong className="text-xs font-black text-blue-600">₹{totalPaid}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Outstanding</span>
                    <strong className="text-xs font-black text-red-500">₹{totalDue > 0 ? totalDue : 0}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {assignedFees.length === 0 && !loading && (
        <div className="bg-white p-12 text-center text-slate-400 font-bold rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          Search by student details or select class to display billings.
        </div>
      )}

      {/* Collect Payout Modal */}
      {isCollectModalOpen && activeFeeRecord && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full border border-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800">Process Fee Collection</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  Student: {activeFeeRecord.student?.student_name} | Admission: {activeFeeRecord.student?.admission_number}
                </p>
              </div>
              <button onClick={() => setIsCollectModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                Close
              </button>
            </div>

            {/* Collection Items Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Assigned Fee Breakdown</h4>
                <button
                  type="button"
                  onClick={fillFullPayout}
                  className="text-[10px] font-black text-blue-600 hover:underline flex items-center cursor-pointer"
                >
                  Fill Outstanding In Full
                </button>
              </div>

              <div className="space-y-3">
                {payoutItems.map((item, idx) => (
                  <div key={idx} className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                    
                    {/* Category Title */}
                    <div className="md:col-span-2">
                      <strong className="text-xs font-bold text-slate-700 block">{item.name}</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Base: ₹{item.amount} | Waiver: ₹{item.discount_amount} | Paid: ₹{item.paid_amount}
                      </span>
                    </div>

                    {/* Fine Overdue info */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Overdue Fine</span>
                      {item.fine_calculated > 0 ? (
                        <strong className="text-xs font-bold text-amber-600 flex items-center">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> ₹{item.fine_calculated}
                        </strong>
                      ) : (
                        <strong className="text-xs font-semibold text-slate-500">No Fine</strong>
                      )}
                    </div>

                    {/* Apply Discount Waiver */}
                    <div className="text-left">
                      <button
                        type="button"
                        onClick={() => openDiscountWaiver(idx)}
                        className="text-[10px] font-bold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg inline-flex items-center cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5 mr-1" /> Apply Waiver
                      </button>
                    </div>

                    {/* Pay amount */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Pay Base Amount</label>
                      <input
                        type="number"
                        placeholder={`Max ₹${item.remaining}`}
                        value={item.amount_to_pay}
                        onChange={(e) => handlePayoutItemChange(idx, 'amount_to_pay', e.target.value)}
                        className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-750"
                      />
                    </div>

                    {/* Pay fine */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Pay Late Fine</label>
                      <input
                        type="number"
                        placeholder={`Fine ₹${item.fine_calculated}`}
                        value={item.fine_to_pay}
                        onChange={(e) => handlePayoutItemChange(idx, 'fine_to_pay', e.target.value)}
                        disabled={item.fine_calculated === 0}
                        className="w-full h-8 px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-750 disabled:opacity-50"
                      />
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Payment Fields */}
            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Transaction ID / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. TXN9801..."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="Received from parent..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 rounded-lg bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow-md cursor-pointer"
              >
                Complete Payment & Print
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Select Discount Scheme Waiver Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-800">Apply Fee Waiver</h3>
            <p className="text-xs font-semibold text-slate-400">Select a configured scholarship, sibling concession, or sports waiver scheme.</p>
            
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {discounts.map(disc => (
                <button
                  key={disc._id}
                  onClick={() => applyWaiverScheme(disc)}
                  className="w-full p-3 border border-slate-100 hover:border-blue-500 rounded-xl bg-slate-50/50 hover:bg-blue-50/20 text-left transition-all cursor-pointer"
                >
                  <strong className="text-xs font-bold text-slate-800 block">{disc.name}</strong>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Waiver: {disc.type === 'Percentage' ? `${disc.amount}%` : `₹${disc.amount}`} | Reason: {disc.reason || 'None'}
                  </span>
                </button>
              ))}
              {discounts.length === 0 && (
                <p className="text-center text-slate-400 text-xs font-bold py-6">
                  No active discount waivers schemes. Configure discounts first.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 rounded-lg bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full border border-slate-100 shadow-2xl space-y-6 print-container my-8">
            
            {/* Printable Receipt Header */}
            <div className="text-center space-y-1">
              <h1 className="text-xl font-black text-slate-800">FEES PAYMENT RECEIPT</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official School Record Receipt</p>
            </div>

            <hr className="border-slate-100" />

            {/* Receipt Summary Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Receipt Number</span>
                <strong className="text-slate-800">{receiptData.receipt_number}</strong>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Payment Date</span>
                <strong className="text-slate-800">{new Date(receiptData.payment_date).toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Student Name</span>
                <strong className="text-slate-800">{receiptData.student?.student_name}</strong>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Admission ID</span>
                <strong className="text-slate-800">{receiptData.student?.admission_number}</strong>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Payment Method</span>
                <strong className="text-slate-800">{receiptData.payment_method}</strong>
              </div>
              {receiptData.transaction_id && (
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Transaction ID</span>
                  <strong className="text-slate-800">{receiptData.transaction_id}</strong>
                </div>
              )}
            </div>

            {/* breakdown table */}
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

            {/* Total Paid Display */}
            <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-xl">
              <span className="text-xs font-black uppercase tracking-wider">TOTAL AMOUNT SETTLED</span>
              <strong className="text-lg font-black">₹{receiptData.amount_paid}</strong>
            </div>

            {/* Signature Block */}
            <div className="flex justify-between items-end pt-8 text-xs font-bold text-slate-400">
              <div className="text-center w-36">
                <div className="h-0.5 bg-slate-200 mb-2"></div>
                Accountant Signature
              </div>
              <div className="text-center w-36">
                <div className="h-0.5 bg-slate-200 mb-2"></div>
                Authorized Signatory
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 rounded-lg bg-white"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
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

export default FeeCollection;
