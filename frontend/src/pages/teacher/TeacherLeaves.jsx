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
  Ban,
  X,
  Search,
  Filter,
  Check,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';

const LEAVE_TYPES = [
  { value: 'Casual Leave', label: 'Casual Leave' },
  { value: 'Sick Leave', label: 'Sick Leave' },
  { value: 'Emergency Leave', label: 'Emergency Leave' },
  { value: 'Medical Leave', label: 'Medical Leave' },
  { value: 'Earned Leave', label: 'Earned Leave' },
  { value: 'Maternity / Paternity Leave', label: 'Maternity / Paternity Leave' },
  { value: 'Other', label: 'Other' }
];

const TeacherLeaves = () => {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

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
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const { data } = await axios.get('/api/teacher/leaves', config);
      setLeaves(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load leave history:', error);
      toast.error('Failed to load leave history');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setLeaveType('Casual Leave');
    setFromDate('');
    setToDate('');
    setReason('');
    setShowApplyModal(true);
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason.trim()) {
      return toast.error('Please fill all required fields');
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return toast.error('From date cannot be after To date');
    }

    setSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const payload = {
        leave_type: leaveType,
        start_date: fromDate,
        end_date: toDate,
        from_date: fromDate,
        to_date: toDate,
        reason: reason.trim()
      };

      const { data } = await axios.post('/api/teacher/leaves', payload, config);
      const newLeave = data.leave || data;

      setLeaves((prev) => [newLeave, ...prev]);
      toast.success(data.message || 'Leave application submitted successfully');
      setShowApplyModal(false);
      setReason('');
      setFromDate('');
      setToDate('');
    } catch (error) {
      console.error('Apply leave error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;
    setCancellingId(id);
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const { data } = await axios.put(`/api/teacher/leaves/${id}/cancel`, {}, config);
      const updatedLeave = data.leave;
      setLeaves((prev) =>
        prev.map((l) => (l._id === id ? (updatedLeave || { ...l, status: 'Cancelled' }) : l))
      );
      toast.success(data.message || 'Leave request cancelled');
    } catch (error) {
      console.error('Cancel leave error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel leave');
    } finally {
      setCancellingId(null);
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return '-';
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return '-';
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  };

  const filteredLeaves = leaves.filter((item) => {
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (item.leave_type || '').toLowerCase().includes(query) ||
      (item.reason || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const totalCount = leaves.length;
  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;
  const cancelledCount = leaves.filter((l) => l.status === 'Cancelled').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
        <p className="text-xs font-bold text-slate-400">Loading leave records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Leave Management</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1.5 ml-11">
            Apply for leaves, track approval status, and view your complete leave history.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Apply For Leave
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setStatusFilter('All')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'All'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total Applied</div>
          <div className="text-2xl font-black mt-1">{totalCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('Pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md'
              : 'bg-amber-50/60 border-amber-100 text-amber-900 hover:border-amber-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-80">
            <Clock className="w-3 h-3" /> Pending
          </div>
          <div className="text-2xl font-black mt-1">{pendingCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('Approved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Approved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-emerald-50/60 border-emerald-100 text-emerald-900 hover:border-emerald-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-80">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </div>
          <div className="text-2xl font-black mt-1">{approvedCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('Rejected')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Rejected'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-rose-50/60 border-rose-100 text-rose-900 hover:border-rose-200'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-80">
            <XCircle className="w-3 h-3" /> Rejected
          </div>
          <div className="text-2xl font-black mt-1">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by leave type or reason..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Leaves History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Reason & Remarks</th>
                <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.map((item) => {
                const startDate = item.start_date || item.from_date;
                const endDate = item.end_date || item.to_date;
                const duration = calculateDays(startDate, endDate);

                return (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-extrabold text-slate-800 text-sm">{item.leave_type}</span>
                      <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        Applied on {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-700">
                        {startDate ? new Date(startDate).toLocaleDateString() : '-'} &rarr;{' '}
                        {endDate ? new Date(endDate).toLocaleDateString() : '-'}
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 mt-0.5">{duration}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 max-w-sm">
                      <div className="line-clamp-2">{item.reason}</div>
                      {item.admin_remarks && (
                        <div className="text-[11px] font-semibold text-slate-500 mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-700">Admin Remark:</span> {item.admin_remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black border inline-flex items-center gap-1.5 ${
                          item.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.status === 'Cancelled'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {item.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                        {item.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                        {item.status === 'Cancelled' && <Ban className="w-3.5 h-3.5" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.status === 'Pending' ? (
                        <button
                          onClick={() => handleCancelLeave(item._id)}
                          disabled={cancellingId === item._id}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {cancellingId === item._id ? (
                            <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-14 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-2">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No leave applications found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm || statusFilter !== 'All'
                        ? 'Try clearing your search or changing the status filter.'
                        : 'Submit a new leave application using the button above.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">Apply For Leave</h2>
                  <p className="text-[11px] font-semibold text-slate-400">Submit a leave request for school approval</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Leave Type <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={LEAVE_TYPES}
                  value={leaveType}
                  onChange={(val) => setLeaveType(val)}
                  placeholder="Select leave type..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    From Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    To Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={fromDate}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white"
                  />
                </div>
              </div>

              {fromDate && toDate && (
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs font-semibold text-indigo-700">
                  <span>Selected Duration:</span>
                  <span className="font-extrabold">{calculateDays(fromDate, toDate)}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the reason clearly for administration review..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 leading-relaxed"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !fromDate || !toDate || !reason.trim()}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
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
