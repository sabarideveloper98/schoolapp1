import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, User, BarChart3, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';

const StaffReport = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('month-wise'); // 'month-wise', 'week-wise', 'individual'
  
  // Filter states
  const [role, setRole] = useState('Teacher');
  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    // Default to Monday of current week
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(today.setDate(diff));
    return mon.toISOString().split('T')[0];
  });
  
  // Lists for individual dropdown selector
  const [teachersList, setTeachersList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [individualMode, setIndividualMode] = useState('month'); // 'month', 'week'

  // Report Data States
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [individualData, setIndividualData] = useState(null);

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = ['2024', '2025', '2026', '2027'];

  // Load teachers/staff list for individual reports
  useEffect(() => {
    const loadStaffList = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [teachersRes, staffRes] = await Promise.all([
          axios.get('/api/schooladmin/teachers', config),
          axios.get('/api/schooladmin/staff', config)
        ]);
        setTeachersList(teachersRes.data);
        setStaffList(staffRes.data);
        
        // Default to first teacher in list if available
        if (role === 'Teacher' && teachersRes.data.length > 0) {
          setSelectedUserId(teachersRes.data[0].user_id);
        } else if (role === 'Staff' && staffRes.data.length > 0) {
          setSelectedUserId(staffRes.data[0].user_id);
        }
      } catch (error) {
        toast.error('Failed to load teachers or staff list');
      }
    };
    if (user?.token) loadStaffList();
  }, [user]);

  // Update selected individual when role changes
  useEffect(() => {
    if (role === 'Teacher' && teachersList.length > 0) {
      setSelectedUserId(teachersList[0].user_id);
    } else if (role === 'Staff' && staffList.length > 0) {
      setSelectedUserId(staffList[0].user_id);
    } else {
      setSelectedUserId('');
    }
  }, [role, teachersList, staffList]);

  // Fetch Report Data
  const fetchReport = async () => {
    if (activeTab === 'individual' && !selectedUserId) {
      toast.error('Please select a teacher/staff member');
      return;
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      let url = '/api/schooladmin/attendance/report?';

      if (activeTab === 'individual') {
        url += `user_id=${selectedUserId}`;
        if (individualMode === 'month') {
          url += `&month=${selectedMonth}&year=${selectedYear}`;
        } else {
          url += `&week_start=${weekStart}`;
        }
      } else if (activeTab === 'month-wise') {
        url += `role=${role}&month=${selectedMonth}&year=${selectedYear}`;
      } else if (activeTab === 'week-wise') {
        url += `role=${role}&week_start=${weekStart}`;
      }

      const { data } = await axios.get(url, config);

      if (activeTab === 'individual') {
        setIndividualData(data);
      } else {
        setSummaryData(data.summary || []);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to generate report');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchReport();
    }
  }, [user, activeTab, role, selectedMonth, selectedYear, weekStart, selectedUserId, individualMode]);

  // Quick action: view details of individual from overview table
  const viewIndividualDetails = (userId, userRole) => {
    setRole(userRole);
    setSelectedUserId(userId);
    setIndividualMode('month');
    setActiveTab('individual');
  };

  // Helper: Format Dates
  const formatDate = (dateInput) => {
    const d = new Date(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${monthsName[d.getMonth()]}-${d.getFullYear()}`;
  };

  const getDayName = (dateInput) => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[new Date(dateInput).getDay()];
  };

  // Find staff/teacher profile info
  const getSelectedProfileName = () => {
    if (role === 'Teacher') {
      const match = teachersList.find(t => t.user_id === selectedUserId);
      return match ? match.name : 'Teacher';
    } else {
      const match = staffList.find(s => s.user_id === selectedUserId);
      return match ? match.name : 'Staff';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Staff Attendance Report</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="text-blue-600">Staff-report</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-px">
        <button
          onClick={() => setActiveTab('month-wise')}
          className={`px-6 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'month-wise'
              ? 'bg-white border-t border-x border-slate-100 text-blue-600 shadow-[0_-4px_12px_rgba(0,0,0,0.01)]'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Month-wise Overview
        </button>
        <button
          onClick={() => setActiveTab('week-wise')}
          className={`px-6 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'week-wise'
              ? 'bg-white border-t border-x border-slate-100 text-blue-600 shadow-[0_-4px_12px_rgba(0,0,0,0.01)]'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Week-wise Overview
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-6 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'individual'
              ? 'bg-white border-t border-x border-slate-100 text-blue-600 shadow-[0_-4px_12px_rgba(0,0,0,0.01)]'
              : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          Individual Report
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          
          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
            >
              <option value="Teacher">Teacher</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          {/* Individual selector (Shown only in Individual tab) */}
          {activeTab === 'individual' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Staff Member</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
              >
                <option value="">Select Staff</option>
                {role === 'Teacher'
                  ? teachersList.map(t => <option key={t.user_id} value={t.user_id}>{t.name}</option>)
                  : staffList.map(s => <option key={s.user_id} value={s.user_id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {/* Individual Report Mode Toggle */}
          {activeTab === 'individual' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Report Mode</label>
              <select
                value={individualMode}
                onChange={(e) => setIndividualMode(e.target.value)}
                className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
              >
                <option value="month">Month wise</option>
                <option value="week">Week wise</option>
              </select>
            </div>
          )}

          {/* Month selector (Shown for Month mode) */}
          {((activeTab === 'month-wise') || (activeTab === 'individual' && individualMode === 'month')) && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
                >
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Week picker (Shown for Week mode) */}
          {((activeTab === 'week-wise') || (activeTab === 'individual' && individualMode === 'week')) && (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Week Starting Date</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
              />
            </div>
          )}

          {/* Search Button */}
          <div className={activeTab === 'individual' ? '' : 'md:col-span-1'}>
            <button
              onClick={fetchReport}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Report Presentation Section */}
      {loading ? (
        <div className="flex justify-center py-12 text-slate-500 font-medium">Generating Report Details...</div>
      ) : activeTab === 'individual' ? (
        /* INDIVIDUAL REPORT VIEW */
        individualData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Card: Summary Stats Profile */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 space-y-6">
              <div className="flex flex-col items-center justify-center text-center pb-6 border-b border-slate-100">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-650 flex items-center justify-center font-bold text-3xl mb-4 border border-blue-100 uppercase shadow-inner">
                  {getSelectedProfileName().substring(0, 2)}
                </div>
                <h3 className="text-xl font-black text-slate-850">{getSelectedProfileName()}</h3>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider mt-1.5">{role}</span>
              </div>

              {/* Aggregation statistics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present</span>
                  <span className="text-lg font-black text-emerald-600 mt-1 block">
                    {individualData.records.filter(r => r.status === 'Present').length}
                  </span>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</span>
                  <span className="text-lg font-black text-rose-600 mt-1 block">
                    {individualData.records.filter(r => r.status === 'Absent').length}
                  </span>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate</span>
                  <span className="text-lg font-black text-blue-600 mt-1 block">
                    {(() => {
                      const pres = individualData.records.filter(r => r.status === 'Present').length;
                      const tot = individualData.records.filter(r => r.status !== 'N/A').length;
                      return tot > 0 ? `${Math.round((pres / tot) * 100)}%` : '0%';
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card: Calendar Details List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 overflow-hidden">
              <h3 className="text-md font-black text-slate-800 mb-6">Attendance Calendar</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">DATE</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">DAY</th>
                      <th className="px-6 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">IN TIME</th>
                      <th className="px-6 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">OUT TIME</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {individualData.records.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-850">
                          {formatDate(rec.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                          {getDayName(rec.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {rec.status === 'Present' ? (
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full">Present</span>
                          ) : rec.status === 'Absent' ? (
                            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-full">Absent</span>
                          ) : (
                            <span className="bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-full">No Record</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-slate-700">
                          {rec.in_time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-slate-700">
                          {rec.out_time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        /* MONTH-WISE / WEEK-WISE OVERVIEW */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">NAME</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">ROLE</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">DAYS PRESENT</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">DAYS ABSENT</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">ATTENDANCE RATE</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {summaryData.map((staff) => (
                  <tr key={staff.user_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                      {staff.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 uppercase">
                      {staff.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-emerald-600">
                      {staff.present}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-rose-600">
                      {staff.absent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        staff.rate >= 90
                          ? 'bg-emerald-50 text-emerald-650 border-emerald-100'
                          : staff.rate >= 75
                          ? 'bg-amber-50 text-amber-650 border-amber-100'
                          : 'bg-rose-50 text-rose-650 border-rose-100'
                      }`}>
                        {staff.rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => viewIndividualDetails(staff.user_id, staff.role)}
                        className="text-blue-600 hover:text-blue-500 font-bold text-xs flex items-center gap-1 ml-auto cursor-pointer transition-colors"
                      >
                        View Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {summaryData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold">
                      No records found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffReport;
