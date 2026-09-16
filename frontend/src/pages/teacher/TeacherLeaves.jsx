import { useState, useEffect } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  Ban
} from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherLeaves = () => {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [user]);

  const fetchLeaves = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/teacher/leaves', config);
      setLeaves(data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load leave history');
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason) return toast.error('Please fill all required fields');
    setSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/teacher/leaves', {
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        reason
      }, config);

      setLeaves([data, ...leaves]);
      toast.success('Leave application submitted successfully');
      setShowApplyModal(false);
      setReason('');
      setFromDate('');
      setToDate('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/teacher/leaves/${id}/cancel`, {}, config);
      setLeaves(leaves.map(l => l._id === id ? data.leave || { ...l, status: 'Cancelled' } : l));
      toast.success('Leave cancelled');
    } catch (error) {
      toast.error('Failed to cancel leave');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" /> Leave Management
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Apply for leaves and track approval status from school administration.</p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Apply For Leave
        </button>
      </div>

      {/* Leaves History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Leave Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Reason</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-extrabold text-slate-800 text-sm">{item.leave_type}</span>
                    <div className="text-[10px] font-semibold text-slate-400">Applied on {new Date(item.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600">
                    {new Date(item.from_date).toLocaleDateString()} - {new Date(item.to_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 max-w-xs truncate">
                    {item.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${
                      item.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      item.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      item.status === 'Cancelled' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {item.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {item.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                      {item.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {item.status === 'Pending' && (
                      <button
                        onClick={() => handleCancelLeave(item._id)}
                        className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <Ban className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold">
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> Apply For Leave
            </h2>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Leave Type</label>
                <SearchableSelect
                  options={[
                    { value: 'Casual Leave', label: 'Casual Leave' },
                    { value: 'Sick Leave', label: 'Sick Leave' },
                    { value: 'Emergency Leave', label: 'Emergency Leave' },
                    { value: 'Maternity / Paternity Leave', label: 'Maternity / Paternity Leave' }
                  ]}
                  value={leaveType}
                  onChange={(val) => setLeaveType(val)}
                  placeholder="Select leave type..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Reason for Leave</label>
                <textarea
                  rows="3"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the reason clearly..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLeaves;
