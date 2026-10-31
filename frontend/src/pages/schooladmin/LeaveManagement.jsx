import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Filter,
  Search,
  Eye,
  FileText,
  Check,
  X,
  AlertCircle,
  Calendar,
  Users,
  Briefcase,
  RefreshCw,
  Plus
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const LeaveManagement = () => {
  const { user } = useAuthStore();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Pending', 'Approved', 'Rejected'
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('all'); // 'all', 'Teacher', 'Staff'
  const [searchTerm, setSearchTerm] = useState('');

  // View Modal state
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Status Action Modal (Approve / Reject) state
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    leave: null,
    action: 'Approved', // 'Approved' or 'Rejected'
    remarks: '',
    loading: false
  });

  const getAuthHeader = () => {
    const token =
      user?.token ||
      user?.accessToken ||
      (typeof localStorage !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{}')?.token || localStorage.getItem('token')
        : '') ||
      '';
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/schooladmin/leaves', getAuthHeader());
      if (res.data?.success && Array.isArray(res.data.leaves)) {
        setLeaves(res.data.leaves);
      } else if (Array.isArray(res.data)) {
        setLeaves(res.data);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.error('Failed to fetch school leaves:', error);
      toast.error(error.response?.data?.message || 'Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 1;
    try {
      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
      const diffTime = Math.abs(e - s);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 1;
    } catch {
      return 1;
    }
  };

  const handleOpenActionModal = (leave, action) => {
    setActionModal({
      isOpen: true,
      leave,
      action,
      remarks: '',
      loading: false
    });
  };

  const handleConfirmAction = async () => {
    if (!actionModal.leave) return;

    try {
      setActionModal((prev) => ({ ...prev, loading: true }));
      const payload = {
        status: actionModal.action,
        admin_remarks: actionModal.remarks.trim(),
        leave_source: actionModal.leave.leave_source
      };

      const res = await axios.put(
        `/api/schooladmin/leaves/${actionModal.leave._id}/status`,
        payload,
        getAuthHeader()
      );

      toast.success(res.data?.message || `Leave application marked as ${actionModal.action}`);

      // Optimistically update state
      setLeaves((prev) =>
        prev.map((item) =>
          item._id === actionModal.leave._id
            ? {
                ...item,
                status: actionModal.action,
                admin_remarks: actionModal.remarks.trim()
              }
            : item
        )
      );

      if (selectedLeave && selectedLeave._id === actionModal.leave._id) {
        setSelectedLeave((prev) => ({
          ...prev,
          status: actionModal.action,
          admin_remarks: actionModal.remarks.trim()
        }));
      }

      setActionModal({ isOpen: false, leave: null, action: 'Approved', remarks: '', loading: false });
    } catch (error) {
      console.error('Failed to update leave status:', error);
      toast.error(error.response?.data?.message || 'Failed to update leave status');
      setActionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Filter computation
  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter !== 'all' && leave.status !== statusFilter) {
      return false;
    }

    if (employeeTypeFilter !== 'all') {
      if (employeeTypeFilter === 'Teacher' && leave.leave_source !== 'Teacher') return false;
      if (employeeTypeFilter === 'Staff' && leave.leave_source !== 'Staff') return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const name = (leave.employee_name || '').toLowerCase();
      const empId = (leave.employee_id || '').toLowerCase();
      const type = (leave.leave_type || '').toLowerCase();
      const reason = (leave.reason || '').toLowerCase();
      const empType = (leave.employee_type || '').toLowerCase();
      if (!name.includes(q) && !empId.includes(q) && !type.includes(q) && !reason.includes(q) && !empType.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Summary counts
  const totalCount = leaves.length;
  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Leave Management</h1>
            <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Review, track, approve, and manage leave applications submitted by Teachers and Staff.
          </p>
        </div>

        <button
          onClick={fetchLeaves}
          disabled={loading}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leaves */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">All Leaves</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center font-bold">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2">{totalCount}</h2>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Teacher & Staff combined</p>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => setStatusFilter('Pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Action</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-amber-700 mt-2">{pendingCount}</h2>
          <p className="text-[11px] font-semibold text-amber-600/80 mt-0.5">Awaiting admin review</p>
        </div>

        {/* Approved Leaves */}
        <div
          onClick={() => setStatusFilter('Approved')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Approved'
              ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Approved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-emerald-700 mt-2">{approvedCount}</h2>
          <p className="text-[11px] font-semibold text-emerald-600/80 mt-0.5">Granted leave requests</p>
        </div>

        {/* Rejected Leaves */}
        <div
          onClick={() => setStatusFilter('Rejected')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Rejected'
              ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-rose-700 mt-2">{rejectedCount}</h2>
          <p className="text-[11px] font-semibold text-rose-600/80 mt-0.5">Declined applications</p>
        </div>
      </div>

      {/* Main Leave Register Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filter & Search Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'Pending', label: `Pending (${pendingCount})` },
              { id: 'Approved', label: `Approved (${approvedCount})` },
              { id: 'Rejected', label: `Rejected (${rejectedCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Employee Type Filter */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Employee Type filter */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs font-bold">
              <button
                onClick={() => setEmployeeTypeFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  employeeTypeFilter === 'all' ? 'bg-white shadow-2xs text-slate-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Roles
              </button>
              <button
                onClick={() => setEmployeeTypeFilter('Teacher')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  employeeTypeFilter === 'Teacher' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3 h-3" />
                Teachers
              </button>
              <button
                onClick={() => setEmployeeTypeFilter('Staff')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  employeeTypeFilter === 'Staff' ? 'bg-white shadow-2xs text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase className="w-3 h-3" />
                Staff
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, ID, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-5">EMPLOYEE</th>
                <th className="py-3.5 px-4">EMPLOYEE ID</th>
                <th className="py-3.5 px-4">ROLE</th>
                <th className="py-3.5 px-4">LEAVE TYPE</th>
                <th className="py-3.5 px-4">DURATION</th>
                <th className="py-3.5 px-4">DAYS</th>
                <th className="py-3.5 px-4">REASON</th>
                <th className="py-3.5 px-4">APPLIED DATE</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400 font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading leave applications...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400 font-bold">
                    No leave applications found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const totalDays = leave.total_days || calculateDays(leave.start_date, leave.end_date);
                  const isPending = leave.status === 'Pending';
                  const isApproved = leave.status === 'Approved';
                  const isRejected = leave.status === 'Rejected';

                  return (
                    <tr key={leave._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Employee Name */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-black text-xs shrink-0">
                            {leave.employee_name?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800 text-xs">{leave.employee_name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{leave.employee_phone || leave.employee_email}</div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Employee ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-700 text-xs">
                        {leave.employee_id || '-'}
                      </td>

                      {/* 3. Employee Type (Teacher / Staff) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                            leave.leave_source === 'Teacher'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {leave.leave_source === 'Teacher' ? (
                            <Users className="w-3 h-3" />
                          ) : (
                            <Briefcase className="w-3 h-3" />
                          )}
                          {leave.employee_type || leave.leave_source}
                        </span>
                      </td>

                      {/* 4. Leave Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-slate-800 text-xs">{leave.leave_type}</span>
                      </td>

                      {/* 5 & 6. From Date - To Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-xs font-semibold">
                        <div>{formatDate(leave.start_date || leave.from_date)}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          to {formatDate(leave.end_date || leave.to_date)}
                        </div>
                      </td>

                      {/* 7. Total Leave Days */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md text-xs">
                          {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
                        </span>
                      </td>

                      {/* 8. Reason for Leave */}
                      <td className="py-3.5 px-4 max-w-xs text-xs">
                        <p className="line-clamp-1 text-slate-600 font-medium" title={leave.reason}>
                          {leave.reason || '-'}
                        </p>
                      </td>

                      {/* 9. Applied Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-xs">
                        {formatDate(leave.applied_date || leave.createdAt)}
                      </td>

                      {/* 10. Leave Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isApproved && <CheckCircle2 className="w-3 h-3" />}
                          {isRejected && <XCircle className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          {leave.status || 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLeave(leave)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleOpenActionModal(leave, 'Approved')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Approve Request"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(leave, 'Rejected')}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Reject Request"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW COMPLETE LEAVE DETAILS MODAL                                         */}
      {/* ========================================================================= */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-black text-lg">
                  {selectedLeave.employee_name?.charAt(0) || 'L'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">{selectedLeave.employee_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-slate-400">{selectedLeave.employee_id}</span>
                    <span>•</span>
                    <span className="text-xs font-bold text-blue-600">{selectedLeave.employee_type}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeave(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Leave Type</span>
                <span className="font-extrabold text-slate-800">{selectedLeave.leave_type}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Duration</span>
                <span className="font-black text-blue-600">
                  {selectedLeave.total_days || calculateDays(selectedLeave.start_date, selectedLeave.end_date)} Days
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">From Date</span>
                <span className="font-extrabold text-slate-800">{formatDate(selectedLeave.start_date || selectedLeave.from_date)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">To Date</span>
                <span className="font-extrabold text-slate-800">{formatDate(selectedLeave.end_date || selectedLeave.to_date)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Applied On</span>
                <span className="font-extrabold text-slate-800">{formatDate(selectedLeave.applied_date || selectedLeave.createdAt)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Current Status</span>
                <span
                  className={`font-black uppercase text-[11px] ${
                    selectedLeave.status === 'Approved'
                      ? 'text-emerald-700'
                      : selectedLeave.status === 'Rejected'
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}
                >
                  {selectedLeave.status}
                </span>
              </div>
            </div>

            {/* Reason Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Reason for Leave Application
              </span>
              <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                {selectedLeave.reason || 'No specific reason provided.'}
              </p>
            </div>

            {/* Admin Remarks if any */}
            {selectedLeave.admin_remarks && (
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1.5">
                  Admin Remarks
                </span>
                <p className="text-blue-900 font-medium whitespace-pre-wrap leading-relaxed">
                  {selectedLeave.admin_remarks}
                </p>
              </div>
            )}

            {/* Footer action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLeave(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>

              {selectedLeave.status === 'Pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const l = selectedLeave;
                      setSelectedLeave(null);
                      handleOpenActionModal(l, 'Approved');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => {
                      const l = selectedLeave;
                      setSelectedLeave(null);
                      handleOpenActionModal(l, 'Rejected');
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Reject Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPROVE / REJECT CONFIRMATION MODAL                                       */}
      {/* ========================================================================= */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                  actionModal.action === 'Approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {actionModal.action === 'Approved' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {actionModal.action === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  for {actionModal.leave?.employee_name} ({actionModal.leave?.leave_type})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to mark this leave request as{' '}
              <span className={`font-bold uppercase ${actionModal.action === 'Approved' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {actionModal.action}
              </span>
              ? The employee will be able to see this updated status.
            </p>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Admin Remarks / Note (Optional)
              </label>
              <textarea
                rows="3"
                placeholder="Enter any comments or conditions for the employee..."
                value={actionModal.remarks}
                onChange={(e) => setActionModal({ ...actionModal, remarks: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActionModal({ isOpen: false, leave: null, action: 'Approved', remarks: '', loading: false })}
                disabled={actionModal.loading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionModal.loading}
                className={`px-5 py-2 font-bold rounded-xl text-xs text-white cursor-pointer shadow-sm flex items-center gap-1.5 ${
                  actionModal.action === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionModal.loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm {actionModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
