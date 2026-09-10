import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Clock, Save } from 'lucide-react';

const StaffAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [role, setRole] = useState('Teacher');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [notifyVia, setNotifyVia] = useState('Do not send');
  
  // Format selected date for UI header (e.g., 20-Aug-2026)
  const formatHeaderDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/schooladmin/attendance?role=${role}&date=${date}`, config);
      setRecords(data.records || []);
      setNotifyVia(data.notify_via || 'Do not send');
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load attendance records');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchAttendance();
    }
  }, [user, role, date]);

  const handleSearch = () => {
    fetchAttendance();
  };

  const handleSelectAllPresent = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setRecords(prev => prev.map(r => ({ ...r, status: 'Present' })));
    }
  };

  const handleSelectAllAbsent = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setRecords(prev => prev.map(r => ({ ...r, status: 'Absent' })));
    }
  };

  const handleRowStatusChange = (index, status) => {
    setRecords(prev => {
      const next = [...prev];
      next[index] = { ...next[index], status };
      return next;
    });
  };

  const handleTimeChange = (index, field, value) => {
    setRecords(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        role,
        date,
        records,
        notify_via: notifyVia
      };

      await axios.post('/api/schooladmin/attendance', payload, config);
      toast.success('Attendance saved successfully!');
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
      setLoading(false);
    }
  };

  // Determine if all are Present or Absent
  const allPresent = records.length > 0 && records.every(r => r.status === 'Present');
  const allAbsent = records.length > 0 && records.every(r => r.status === 'Absent');

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumbs */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Staffs Attendance</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="text-blue-600">Staffs-attendance</span>
          </div>
        </div>
      </div>

      {/* Filter and Date selectors */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Role select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
            >
              <option value="Teacher">Teacher</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
            />
          </div>

          {/* Search trigger button */}
          <div>
            <button
              onClick={handleSearch}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Attendance List Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8 space-y-6">
        
        {/* Section title & Date sub-title */}
        <div className="text-center">
          <h3 className="text-lg font-black text-slate-800">Attendance Details</h3>
          <p className="text-sm font-bold text-blue-600 mt-1">{formatHeaderDate(date)}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-slate-500 font-medium">Loading records...</div>
        ) : (
          <div className="space-y-6">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-1/4">Name</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-1/6">
                      <div className="flex items-center justify-center gap-2">
                        <span>Present</span>
                        <input
                          type="checkbox"
                          checked={allPresent}
                          onChange={handleSelectAllPresent}
                          className="w-4 h-4 rounded text-blue-650 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-1/6">
                      <div className="flex items-center justify-center gap-2">
                        <span>Absent</span>
                        <input
                          type="checkbox"
                          checked={allAbsent}
                          onChange={handleSelectAllAbsent}
                          className="w-4 h-4 rounded text-blue-650 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-1/4">In Time</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-1/4">Out Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {records.map((record, index) => (
                    <tr key={record.user_id || index} className="hover:bg-slate-50/30 transition-colors duration-150">
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                        {record.name}
                      </td>

                      {/* Present Checkbox */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={record.status === 'Present'}
                          onChange={() => handleRowStatusChange(index, 'Present')}
                          className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer transition-all scale-110"
                        />
                      </td>

                      {/* Absent Checkbox */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={record.status === 'Absent'}
                          onChange={() => handleRowStatusChange(index, 'Absent')}
                          className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer transition-all scale-110"
                        />
                      </td>

                      {/* In Time input */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center items-center">
                          <input
                            type="text"
                            value={record.in_time}
                            onChange={(e) => handleTimeChange(index, 'in_time', e.target.value)}
                            className="w-40 h-10 px-3 text-center text-slate-700 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs font-bold shadow-sm"
                            placeholder="09:00 AM"
                          />
                        </div>
                      </td>

                      {/* Out Time input */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center items-center">
                          <input
                            type="text"
                            value={record.out_time}
                            onChange={(e) => handleTimeChange(index, 'out_time', e.target.value)}
                            className="w-40 h-10 px-3 text-center text-slate-700 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs font-bold shadow-sm"
                            placeholder="05:00 PM"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold">
                        No {role === 'Teacher' ? 'teachers' : 'staff'} found to register attendance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom notify and save actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 shrink-0">Notify via</span>
                <select
                  value={notifyVia}
                  onChange={(e) => setNotifyVia(e.target.value)}
                  className="h-12 px-4 border border-slate-200 rounded-xl outline-none bg-white text-slate-750 font-bold text-xs cursor-pointer focus:border-blue-500 w-full sm:w-48 shadow-sm"
                >
                  <option value="Do not send">Do not send</option>
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <button
                onClick={handleSaveAttendance}
                disabled={records.length === 0}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center gap-2 cursor-pointer disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                <Save className="w-4 h-4" />
                Save Attendance
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAttendance;
