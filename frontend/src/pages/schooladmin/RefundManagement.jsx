import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RotateCcw, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const RefundManagement = () => {
  const { user } = useAuthStore();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRefunds = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5005/api/schooladmin/fees/refunds', config);
      setRefunds(res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load refund requests');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchRefunds();
  }, [user]);

  const handleUpdateStatus = async (stuFeeId, refundId, newStatus) => {
    if (window.confirm(`Are you sure you want to set this refund status to ${newStatus}?`)) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.put('http://localhost:5005/api/schooladmin/fees/refunds', {
          student_fee_id: stuFeeId,
          refund_id: refundId,
          status: newStatus
        }, config);
        toast.success(`Refund status changed to ${newStatus}`);
        fetchRefunds();
      } catch (error) {
        toast.error('Failed to update refund status');
      }
    }
  };

  if (loading) return <div className="flex justify-center py-12 text-slate-550 font-semibold">Loading refund requests...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Fee Refunds Registry</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Review student refund requests, issue approvals, and update disbursement statuses</p>
        </div>
      </div>

      {/* Table list */}
      <div className="overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Reference No</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Refund Amount</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Request Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {refunds.map((ref) => (
                <tr key={ref.refund_id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">{ref.ref_no || 'REF-N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{ref.student?.student_name}</span>
                      <span className="text-xs font-semibold text-slate-400">Class: {ref.class?.class} - {ref.class?.section}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-red-500">₹{ref.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500 max-w-xs truncate">{ref.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">{new Date(ref.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      ref.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' :
                      ref.status === 'Approved' ? 'bg-blue-500/10 text-blue-600' :
                      ref.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {ref.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                    <div className="flex justify-end gap-1">
                      {ref.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(ref.student_fee_id, ref.refund_id, 'Approved')}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Approve Refund"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(ref.student_fee_id, ref.refund_id, 'Rejected')}
                            className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Reject Refund"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {ref.status === 'Approved' && (
                        <button
                          onClick={() => handleUpdateStatus(ref.student_fee_id, ref.refund_id, 'Completed')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
                        >
                          Disburse
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {refunds.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold">
                    No refund requests logged.
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

export default RefundManagement;
