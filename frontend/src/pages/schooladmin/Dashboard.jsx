import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserSquare2, BookOpen, GraduationCap, Users2, Calendar, 
  Coins, Wallet, TrendingUp, User, CreditCard, Navigation, CalendarRange, Sun, 
  TrendingDown, ArrowUpRight, Bus, Bell, Zap, UserPlus, ClipboardCheck, Receipt, 
  UserCheck, Send, MapPin, Clock, Phone, ChevronRight, Sparkles, Search, ArrowRight, CheckCircle2, AlertTriangle
} from 'lucide-react';
import Layout from '../../components/Layout';
import DashboardAnalyticsBar from '../../components/DashboardAnalyticsBar';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

// Existing module imports
import TeacherManagement from './TeacherManagement';
import StaffManagement from './StaffManagement';
import SubjectManagement from './SubjectManagement';
import ClassManagement from './ClassManagement';
import StudentManagement from './StudentManagement';
import StudentCreate from './StudentCreate';
import TeacherCreate from './TeacherCreate';
import StaffAttendance from './StaffAttendance';
import StaffReport from './StaffReport';
import StudentAttendance from './StudentAttendance';
import StudentReport from './StudentReport';
import AddMarks from './AddMarks';
import ExamReport from './ExamReport';
import SalarySetup from './SalarySetup';
import PayrollProcess from './PayrollProcess';
import SalarySlips from './SalarySlips';
import SalaryReports from './SalaryReports';
import FeeCategoryManagement from './FeeCategoryManagement';
import FeeStructureManagement from './FeeStructureManagement';
import StudentFeeAssignment from './StudentFeeAssignment';
import FeeCollection from './FeeCollection';
import DiscountManagement from './DiscountManagement';
import RefundManagement from './RefundManagement';
import FeeReports from './FeeReports';
import FinanceDashboard from './FinanceDashboard';
import ExpenseCategoryManagement from './ExpenseCategoryManagement';
import ExpenseManagement from './ExpenseManagement';
import IncomeManagement from './IncomeManagement';
import FinanceReports from './FinanceReports';
import AccountProfile from '../AccountProfile';
import SubscriptionManagement from './SubscriptionManagement';
import TransportManagement from './TransportManagement';
import HomeworkManagement from './HomeworkManagement';

// Timetable Module Imports
import TimetableDashboard from './timetable/TimetableDashboard';
import CreateTimetable from './timetable/CreateTimetable';
import ManageTimetable from './timetable/ManageTimetable';
import ClassTimetable from './timetable/ClassTimetable';
import TeacherTimetable from './timetable/TeacherTimetable';
import GlobalTimetable from './timetable/GlobalTimetable';
import PrintTimetable from './timetable/PrintTimetable';
import TeacherAssignment from './timetable/TeacherAssignment';
import AutoGenerator from './timetable/AutoGenerator';
import ConflictDetection from './timetable/ConflictDetection';
import TimetableSettingsPage from './timetable/TimetableSettings';
import TimetableReports from './timetable/TimetableReports';

// Mini Sparkline Component
const Sparkline = ({ color = '#2563eb' }) => (
  <svg className="w-16 h-8 shrink-0 overflow-visible" viewBox="0 0 60 30" fill="none">
    <path
      d="M2 24 C 12 18, 18 26, 26 14 C 34 2, 42 18, 58 8"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState('01');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/schooladmin/dashboard', config);
        setStats(data);
      } catch (error) {
        toast.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500">Loading school dashboard...</p>
        </div>
      </div>
    );
  }

  // Attendance class-wise mock/calculated bars
  const classAttendanceData = [
    { class: 'Nursery', pct: 96 },
    { class: 'LKG', pct: 94 },
    { class: 'UKG', pct: 92 },
    { class: 'Grade 1', pct: 90 },
    { class: 'Grade 2', pct: 88 },
    { class: 'Grade 3', pct: 93 },
    { class: 'Grade 4', pct: 91 },
    { class: 'Grade 5', pct: 89 },
    { class: 'Grade 6', pct: 87 },
    { class: 'Grade 7', pct: 85 },
    { class: 'Grade 8', pct: 82 },
    { class: 'Grade 9', pct: 78 },
    { class: 'Grade 10', pct: 76 },
    { class: 'Grade 11', pct: 73 },
    { class: 'Grade 12', pct: 71 },
  ];

  const busData = {
    '01': {
      busNo: '01',
      routeName: 'Green Valley Route',
      driverName: 'Ramesh Patel',
      mobile: '+91 98765 43210',
      currentLocation: 'Near Green Park',
      nextStop: 'Lake View',
      eta: '12 mins',
      status: 'On Time',
      statusColor: 'emerald'
    },
    '02': {
      busNo: '02',
      routeName: 'Lake View Route',
      driverName: 'Suresh Kumar',
      mobile: '+91 98765 43211',
      currentLocation: 'Lake View Circle',
      nextStop: 'Sunrise Nagar',
      eta: '8 mins',
      status: 'On Time',
      statusColor: 'emerald'
    },
    '03': {
      busNo: '03',
      routeName: 'Sunrise Route',
      driverName: 'Vikram Singh',
      mobile: '+91 98765 43212',
      currentLocation: 'Sunrise Main Gate',
      nextStop: 'School Depot',
      eta: '5 mins',
      status: 'On Time',
      statusColor: 'emerald'
    },
    '04': {
      busNo: '04',
      routeName: 'Hill Top Route',
      driverName: 'Amit Verma',
      mobile: '+91 98765 43213',
      currentLocation: 'Hill Top Junction',
      nextStop: 'Green Park',
      eta: '18 mins',
      status: 'Delayed 5 mins',
      statusColor: 'amber'
    }
  };

  const activeBus = busData[selectedBus] || busData['01'];

  const userName = user?.name || user?.email?.split('@')[0] || 'Rajesh Kumar';

  return (
    <div className="space-y-6 pb-12 font-sans bg-slate-50/60 min-h-screen">
      
      {/* Top Banner & Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 shadow-sm border border-amber-100/60">
            <Sun className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Good Morning, {userName}
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Here's what's happening at your school today.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-bold shadow-xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Mon, 21 Apr 2025</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
            Academic Year 2024 – 2025
          </div>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Stat Card 1: Student Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Student Attendance</span>
              </div>
            </div>
            
            <div className="flex items-baseline justify-between mt-3">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">92.4%</span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>2.3% from last week</span>
                </div>
              </div>
              <Sparkline color="#2563eb" />
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
            {stats?.totalStudents ? `${Math.round(stats.totalStudents * 0.924)} / ${stats.totalStudents} present` : '1,248 / 1,350 present'}
          </div>
        </div>

        {/* Stat Card 2: Fee Collection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Fee Collection</span>
              </div>
            </div>
            
            <div className="flex items-baseline justify-between mt-3">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">78.6%</span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>5.2% from last month</span>
                </div>
              </div>
              <Sparkline color="#d97706" />
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
            ₹ 32,48,750 / ₹ 41,50,000
          </div>
        </div>

        {/* Stat Card 3: Transport On-Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Bus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Transport On-Time</span>
              </div>
            </div>
            
            <div className="flex items-baseline justify-between mt-3">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">95.2%</span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>1.8% from last week</span>
                </div>
              </div>
              <Sparkline color="#059669" />
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
            48 / 50 buses on time
          </div>
        </div>

        {/* Stat Card 4: Active Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Active Alerts</span>
              </div>
            </div>
            
            <div className="flex items-baseline justify-between mt-3">
              <div>
                <span className="text-3xl font-black text-slate-900 tracking-tight">3</span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>2 from yesterday</span>
                </div>
              </div>
              <Sparkline color="#e11d48" />
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] font-bold text-slate-500 flex items-center gap-2">
            <span>2 fee dues</span>
            <span>•</span>
            <span>1 attendance</span>
            <span>•</span>
            <span>0 transport</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Class-wise Attendance (Left) + Fee Trend & Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Class-wise Attendance Chart Card (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">Class-wise Attendance</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Attendance percentage by class (Today)</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-200 inline-block"></span>
                  <span>Absent</span>
                </div>
              </div>
            </div>

            {/* Custom Bar Chart Visualization */}
            <div className="pt-6 pb-2">
              <div className="relative h-64 flex items-end justify-between gap-1 sm:gap-2 border-b border-slate-200 pb-2">
                {/* Y-axis Guides */}
                <div className="absolute inset-x-0 top-0 border-b border-slate-100 border-dashed text-[10px] font-bold text-slate-400 pl-1">100%</div>
                <div className="absolute inset-x-0 top-1/4 border-b border-slate-100 border-dashed text-[10px] font-bold text-slate-400 pl-1">80%</div>
                <div className="absolute inset-x-0 top-2/4 border-b border-slate-100 border-dashed text-[10px] font-bold text-slate-400 pl-1">60%</div>
                <div className="absolute inset-x-0 top-3/4 border-b border-slate-100 border-dashed text-[10px] font-bold text-slate-400 pl-1">40%</div>

                {classAttendanceData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group z-10">
                    <span className="text-[10px] font-bold text-slate-700 mb-1 opacity-90 group-hover:scale-110 transition-transform">
                      {item.pct}%
                    </span>
                    <div className="w-full max-w-[22px] bg-blue-100 rounded-t-md h-full flex items-end overflow-hidden">
                      <div 
                        className="w-full bg-blue-600 rounded-t-md group-hover:bg-blue-700 transition-all duration-500"
                        style={{ height: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between gap-1 sm:gap-2 mt-3 text-[10px] font-bold text-slate-500 overflow-x-auto">
                {classAttendanceData.map((item, idx) => (
                  <div key={idx} className="flex-1 text-center truncate" title={item.class}>
                    {item.class.replace('Grade ', 'G')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Overall Attendance Rate: <strong className="text-slate-800">92.4%</strong></span>
            <button 
              onClick={() => navigate('/school-admin/student-attendance')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>View Attendance Log</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Fee Collection Trend & Quick Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Fee Collection Trend Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">Fee Collection Trend</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Monthly collection (₹)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>Collected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Pending</span>
                </div>
              </div>
            </div>

            {/* Line Trend Visualization */}
            <div className="relative h-44 my-4 border-b border-slate-200">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                {/* Background Grid Lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="300" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />

                {/* Collected Line (Blue) */}
                <path
                  d="M 10 90 L 60 75 L 120 65 L 180 50 L 240 40 L 290 15"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                />
                
                {/* Pending Line (Amber) */}
                <path
                  d="M 10 100 L 60 95 L 120 90 L 180 82 L 240 75 L 290 65"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />

                {/* Points & Tooltip */}
                <circle cx="290" cy="15" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <rect x="250" y="-8" width="48" height="18" rx="4" fill="#1e40af" />
                <text x="274" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">₹ 32.5L</text>
              </svg>

              {/* Month Labels */}
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                <span>Nov</span>
                <span>Dec</span>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
              </div>
            </div>

            {/* Bottom Target Summaries */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mt-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Collected</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">₹ 32,48,750</p>
                <p className="text-[10px] font-bold text-emerald-600 mt-0.5">78.6% of target</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Amount</p>
                <p className="text-sm font-black text-rose-600 mt-0.5">₹ 9,01,250</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">21.4% of target</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-blue-600 fill-blue-600" />
              <h3 className="text-base font-black text-slate-900">Quick Actions</h3>
            </div>

            <div className="space-y-2.5">
              
              <button 
                onClick={() => navigate('/school-admin/students/create')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Add New Student</p>
                    <p className="text-[11px] font-semibold text-slate-400">Enroll a new student to the system</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>

              <button 
                onClick={() => navigate('/school-admin/student-attendance')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ClipboardCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Record Attendance</p>
                    <p className="text-[11px] font-semibold text-slate-400">Mark or view attendance</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>

              <button 
                onClick={() => navigate('/school-admin/fees/collect')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors">Collect Fees</p>
                    <p className="text-[11px] font-semibold text-slate-400">Generate invoice / record payment</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>

              <button 
                onClick={() => navigate('/school-admin/teachers')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Assign Substitute Teacher</p>
                    <p className="text-[11px] font-semibold text-slate-400">Manage substitute teachers</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>

              <button 
                onClick={() => navigate('/school-admin/dashboard')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors">Send Notification</p>
                    <p className="text-[11px] font-semibold text-slate-400">Message parents / staff</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>

            </div>
          </div>

        </div>

      </div>

      {/* Bottom Grid: Transport GPS Tracking (Left) & Substitute Teacher Tracker (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Transport GPS Tracking Card (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Transport GPS Tracking</h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Live location of school buses</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Bus Selection List (3 cols) */}
            <div className="md:col-span-4 space-y-2">
              {Object.keys(busData).map((key) => {
                const bus = busData[key];
                const isSelected = selectedBus === key;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedBus(key)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/70 border-blue-200 shadow-xs' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">Bus {bus.busNo}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        bus.statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        • {bus.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">{bus.routeName}</p>
                  </button>
                );
              })}
            </div>

            {/* Center Map Graphic (5 cols) */}
            <div className="md:col-span-5 bg-slate-100/70 rounded-xl p-3 relative flex flex-col justify-between min-h-[220px] overflow-hidden border border-slate-200/60">
              
              {/* Map Illustration Elements */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px]" />
              
              {/* Top Status */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Live • 12:45 PM</span>
                </div>
              </div>

              {/* Styled SVG Map Route */}
              <div className="relative z-10 my-auto">
                <svg className="w-full h-28 overflow-visible" viewBox="0 0 240 100">
                  {/* Route path */}
                  <path 
                    d="M 20 80 Q 70 20 120 70 T 220 30" 
                    fill="none" 
                    stroke="#2563eb" 
                    strokeWidth="3.5" 
                    strokeDasharray="1,0"
                  />
                  
                  {/* Stops */}
                  <circle cx="20" cy="80" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="90" cy="45" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="160" cy="65" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="220" cy="30" r="6" fill="#1e40af" stroke="#ffffff" strokeWidth="2" />

                  {/* Bus Marker */}
                  <g transform="translate(80, 25)">
                    <rect x="-35" y="-22" width="70" height="20" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" shadow="0 2px 4px rgba(0,0,0,0.1)" />
                    <text x="0" y="-8" fill="#1e293b" fontSize="9" fontWeight="bold" textAnchor="middle">Bus {activeBus.busNo}</text>
                    <text x="0" y="3" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">{activeBus.eta} away</text>
                    <circle cx="0" cy="20" r="6" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  </g>
                </svg>
              </div>

              {/* Bottom Map Legend */}
              <div className="relative z-10 flex items-center gap-3 text-[9px] font-bold text-slate-600 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200/60 shadow-xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Bus Location</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-blue-500"></span>
                  <span>Route</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-900"></span>
                  <span>School</span>
                </div>
              </div>

            </div>

            {/* Right Bus Details (3 cols) */}
            <div className="md:col-span-3 flex flex-col justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div>
                <h4 className="text-xs font-black text-slate-800 mb-3 border-b border-slate-200 pb-2">Bus Details</h4>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Bus No.</span>
                    <span className="font-bold text-slate-800">{activeBus.busNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Driver Name</span>
                    <span className="font-bold text-slate-800 truncate max-w-[100px]" title={activeBus.driverName}>{activeBus.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Mobile</span>
                    <span className="font-bold text-slate-800">{activeBus.mobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Location</span>
                    <span className="font-bold text-slate-800 truncate max-w-[100px]" title={activeBus.currentLocation}>{activeBus.currentLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Next Stop</span>
                    <span className="font-bold text-slate-800">{activeBus.nextStop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">ETA to School</span>
                    <span className="font-bold text-blue-600">{activeBus.eta}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => navigate('/school-admin/transport')}
                className="w-full mt-4 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Full Route</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* Substitute Teacher Tracker Card (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">Substitute Teacher Tracker</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Today's active substitutions</p>
                </div>
              </div>

              <button 
                onClick={() => navigate('/school-admin/teachers')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Substitute Teachers */}
            <div className="space-y-3">
              
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                    PS
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">Ms. Priya Sharma</p>
                    <p className="text-[11px] font-semibold text-slate-400 truncate">Mathematics – Grade 8</p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    On Duty
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">8:00 AM – 12:00 PM</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                    AM
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">Mr. Arjun Mehta</p>
                    <p className="text-[11px] font-semibold text-slate-400 truncate">Science – Grade 6</p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                    Assigned
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">9:00 AM – 1:00 PM</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-black text-xs flex items-center justify-center shrink-0">
                    NK
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">Ms. Neha Kapoor</p>
                    <p className="text-[11px] font-semibold text-slate-400 truncate">English – Grade 5</p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                    Pending
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">10:00 AM – 2:00 PM</span>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Analytics Drawer Toggle */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <DashboardAnalyticsBar role="SchoolAdmin" />
          </div>
        </div>

      </div>

      {/* Bottom Footer Details Bar */}
      <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-400">
        <div>
          <span>Bright Future International School</span>
          <span className="mx-2">•</span>
          <span>Admin Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Safe Students</span>
          <span>•</span>
          <span>Smart Management</span>
          <span>•</span>
          <span>Successful Tomorrow</span>
        </div>
      </div>

    </div>
  );
};

const SchoolAdminDashboard = () => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loadingSub, setLoadingSub] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/subscription/schooladmin/current', config);
        
        const activeSub = data?.activeSubscription;
        const isCurrentlyActive = activeSub && activeSub.status === 'Active' && new Date(activeSub.subscription_end_date) > new Date();
        
        setHasActiveSubscription(!!isCurrentlyActive);
      } catch (error) {
        setHasActiveSubscription(false);
      } finally {
        setLoadingSub(false);
      }
    };

    if (user?.token) {
      checkSubscriptionStatus();
    } else {
      setLoadingSub(false);
    }
  }, [user]);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/school-admin/dashboard',
    },
    {
      label: '📅 Timetable Management',
      icon: CalendarRange,
      subItems: [
        { label: 'Timetable Dashboard', path: '/school-admin/timetable/dashboard' },
        { label: 'Create Timetable', path: '/school-admin/academics/timetable/create' },
        { label: 'Manage Timetable', path: '/school-admin/academics/timetable/manage' },
        { label: 'Class Timetable', path: '/school-admin/academics/timetable/class' },
        { label: 'Teacher Timetable', path: '/school-admin/academics/timetable/teacher' },
        { label: 'Timetable Settings', path: '/school-admin/timetable/settings' },
        { label: 'Reports', path: '/school-admin/timetable/reports' },
      ],
    },
    {
      label: 'Students Information',
      icon: GraduationCap,
      subItems: [
        { label: 'Students List', path: '/school-admin/students' },
        { label: 'Student Attendance', path: '/school-admin/student-attendance' },
        { label: 'Attendance Report', path: '/school-admin/student-report' },
      ],
    },
    {
      label: 'Examinations',
      icon: Calendar,
      subItems: [
        { label: 'Add Marks', path: '/school-admin/exam/add-marks' },
        { label: 'Exam Report', path: '/school-admin/exam/report' },
      ],
    },
    {
      label: 'Staffs Information',
      icon: Users2,
      subItems: [
        { label: 'Staff Attendance', path: '/school-admin/staff-attendance' },
        { label: 'Staff Attendance Report', path: '/school-admin/staff-report' },
        { label: 'Teachers List', path: '/school-admin/teachers' },
        { label: 'Staff List', path: '/school-admin/staff' },
      ],
    },
    {
      label: 'Academic Configuration',
      icon: BookOpen,
      subItems: [
        { label: 'Subjects List', path: '/school-admin/subjects' },
        { label: 'Classes & Sections', path: '/school-admin/classes' },
        { label: 'Create Timetable', path: '/school-admin/academics/timetable/create' },
        { label: 'Manage Timetable', path: '/school-admin/academics/timetable/manage' },
        { label: 'Class Timetable', path: '/school-admin/academics/timetable/class' },
        { label: 'Teacher Timetable', path: '/school-admin/academics/timetable/teacher' },
        { label: 'Print Timetable', path: '/school-admin/academics/timetable/print' },
      ],
    },
    ...(hasActiveSubscription ? [{
      label: 'Payroll & Salary',
      icon: Coins,
      subItems: [
        { label: 'Salary Setup', path: '/school-admin/salary/setup' },
        { label: 'Payroll Process', path: '/school-admin/salary/process' },
        { label: 'Salary Slips', path: '/school-admin/salary/slips' },
        { label: 'Salary Reports', path: '/school-admin/salary/reports' },
      ],
    }] : []),
    {
      label: 'Fee Management',
      icon: Wallet,
      subItems: [
        { label: 'Fee Categories', path: '/school-admin/fees/categories' },
        { label: 'Fee Structures', path: '/school-admin/fees/structures' },
        { label: 'Student Assignments', path: '/school-admin/fees/assignments' },
        { label: 'Collect Fees', path: '/school-admin/fees/collect' },
        { label: 'Discount Schemes', path: '/school-admin/fees/discounts' },
        { label: 'Refund Claims', path: '/school-admin/fees/refunds' },
        { label: 'Revenue Reports', path: '/school-admin/fees/reports' },
      ],
    },
    {
      label: 'Finance & Expenses',
      icon: TrendingUp,
      subItems: [
        { label: 'Finance Dashboard', path: '/school-admin/finance/dashboard' },
        { label: 'Expense Categories', path: '/school-admin/finance/categories' },
        { label: 'Expenses Register', path: '/school-admin/finance/expenses' },
        { label: 'Income Register', path: '/school-admin/finance/income' },
        { label: 'Financial Reports', path: '/school-admin/finance/reports' },
      ],
    },
    {
      label: 'Transport Management',
      icon: Navigation,
      path: '/school-admin/transport',
    },
    {
      label: 'Homework Assignment',
      icon: BookOpen,
      path: '/school-admin/homework',
    },
    {
      label: 'Subscription',
      icon: CreditCard,
      path: '/school-admin/subscription',
    },
    {
      label: 'My Account',
      icon: User,
      path: '/school-admin/profile',
    },
  ];

  return (
    <Layout menuItems={menuItems} title="School Admin Portal">
      <Routes>
        <Route index element={<Navigate to="/school-admin/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/school-admin/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardOverview />} />
        
        {/* Timetable Sub-routes */}
        <Route path="/timetable/dashboard" element={<TimetableDashboard />} />
        <Route path="/timetable/create" element={<CreateTimetable />} />
        <Route path="/timetable/manage" element={<ManageTimetable />} />
        <Route path="/timetable/class" element={<ClassTimetable />} />
        <Route path="/timetable/teacher" element={<TeacherTimetable />} />
        <Route path="/timetable/print" element={<PrintTimetable />} />
        <Route path="/timetable/global" element={<GlobalTimetable />} />
        <Route path="/timetable/assignments" element={<TeacherAssignment />} />
        <Route path="/timetable/auto-generate" element={<AutoGenerator />} />
        <Route path="/timetable/conflicts" element={<ConflictDetection />} />
        <Route path="/timetable/settings" element={<TimetableSettingsPage />} />
        <Route path="/timetable/reports" element={<TimetableReports />} />

        {/* Academics Timetable Aliases */}
        <Route path="/academics/timetable/create" element={<CreateTimetable />} />
        <Route path="/academics/timetable/manage" element={<ManageTimetable />} />
        <Route path="/academics/timetable/class" element={<ClassTimetable />} />
        <Route path="/academics/timetable/teacher" element={<TeacherTimetable />} />
        <Route path="/academics/timetable/print" element={<PrintTimetable />} />

        <Route path="/teachers" element={<TeacherManagement />} />
        <Route path="/teachers/create" element={<TeacherCreate />} />
        <Route path="/staff" element={<StaffManagement />} />
        <Route path="/staff-attendance" element={<StaffAttendance />} />
        <Route path="/staff-report" element={<StaffReport />} />
        <Route path="/student-attendance" element={<StudentAttendance />} />
        <Route path="/student-report" element={<StudentReport />} />
        <Route path="/exam/add-marks" element={<AddMarks />} />
        <Route path="/exam/report" element={<ExamReport />} />
        <Route path="/subjects" element={<SubjectManagement />} />
        <Route path="/classes" element={<ClassManagement />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/students/create" element={<StudentCreate />} />
        
        {/* Payroll routes */}
        <Route path="/salary/setup" element={hasActiveSubscription ? <SalarySetup /> : <Navigate to="/school-admin/subscription" replace />} />
        <Route path="/salary/process" element={hasActiveSubscription ? <PayrollProcess /> : <Navigate to="/school-admin/subscription" replace />} />
        <Route path="/salary/slips" element={hasActiveSubscription ? <SalarySlips /> : <Navigate to="/school-admin/subscription" replace />} />
        <Route path="/salary/reports" element={hasActiveSubscription ? <SalaryReports /> : <Navigate to="/school-admin/subscription" replace />} />
        
        <Route path="/fees/categories" element={<FeeCategoryManagement />} />
        <Route path="/fees/structures" element={<FeeStructureManagement />} />
        <Route path="/fees/assignments" element={<StudentFeeAssignment />} />
        <Route path="/fees/collect" element={<FeeCollection />} />
        <Route path="/fees/discounts" element={<DiscountManagement />} />
        <Route path="/fees/refunds" element={<RefundManagement />} />
        <Route path="/fees/reports" element={<FeeReports />} />
        <Route path="/finance/dashboard" element={<FinanceDashboard />} />
        <Route path="/finance/categories" element={<ExpenseCategoryManagement />} />
        <Route path="/finance/expenses" element={<ExpenseManagement />} />
        <Route path="/finance/income" element={<IncomeManagement />} />
        <Route path="/finance/reports" element={<FinanceReports />} />
        <Route path="/transport" element={<TransportManagement />} />
        <Route path="/transport/*" element={<TransportManagement />} />
        <Route path="/homework" element={<HomeworkManagement />} />
        <Route path="/homework/*" element={<HomeworkManagement />} />
        <Route path="/subscription" element={<SubscriptionManagement />} />
        <Route path="/profile" element={<AccountProfile />} />
        <Route path="*" element={<Navigate to="/school-admin/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default SchoolAdminDashboard;
