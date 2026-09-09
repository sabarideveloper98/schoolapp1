import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserSquare2, BookOpen, GraduationCap, Users2, Calendar, Coins, Wallet, TrendingUp, User, CreditCard } from 'lucide-react';
import Layout from '../../components/Layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

// We will import these once we create them
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

const StatCard = ({ title, value, icon: Icon, color }) => {
  const textColorClass = color.replace('bg-', 'text-').replace('-500', '-600');
  
  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 border border-slate-100 flex items-center justify-between transition-all hover:scale-[1.02] duration-300">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10`}>
        <Icon className={`w-7 h-7 ${textColorClass}`} />
      </div>
    </div>
  );
};

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('http://localhost:5005/api/schooladmin/dashboard', config);
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
    return <div className="flex items-center justify-center min-h-[400px] font-bold text-slate-400">Loading overview...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-800">School Overview</h2>
        <p className="text-xs font-bold text-slate-400 mt-1">Real-time stats across all active school operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={GraduationCap} color="bg-blue-500" />
        <StatCard title="Total Teachers" value={stats?.totalTeachers || 0} icon={UserSquare2} color="bg-indigo-500" />
        <StatCard title="Total Staff" value={stats?.totalStaff || 0} icon={Users2} color="bg-emerald-500" />
        <StatCard title="Total Classes" value={stats?.totalClasses || 0} icon={BookOpen} color="bg-amber-500" />
      </div>
    </div>
  );
};

const SchoolAdminDashboard = () => {
  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/school-admin/dashboard',
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
      ],
    },
    {
      label: 'Payroll & Salary',
      icon: Coins,
      subItems: [
        { label: 'Salary Setup', path: '/school-admin/salary/setup' },
        { label: 'Payroll Process', path: '/school-admin/salary/process' },
        { label: 'Salary Slips', path: '/school-admin/salary/slips' },
        { label: 'Salary Reports', path: '/school-admin/salary/reports' },
      ],
    },
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
      label: 'SaaS Subscription',
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
        <Route path="/salary/setup" element={<SalarySetup />} />
        <Route path="/salary/process" element={<PayrollProcess />} />
        <Route path="/salary/slips" element={<SalarySlips />} />
        <Route path="/salary/reports" element={<SalaryReports />} />
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
        <Route path="/subscription" element={<SubscriptionManagement />} />
        <Route path="/profile" element={<AccountProfile />} />
        <Route path="*" element={<Navigate to="/school-admin/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default SchoolAdminDashboard;
