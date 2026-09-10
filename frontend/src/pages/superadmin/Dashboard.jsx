import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, UserSquare2, GraduationCap, UserCheck, User, Coins, TrendingUp, Wallet } from 'lucide-react';
import Layout from '../../components/Layout';
import SchoolManagement from './SchoolManagement';
import AccountProfile from '../AccountProfile';
import SubscriptionSettings from './SubscriptionSettings';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const StatCard = ({ title, value, icon: Icon, color, isCurrency = false, subtitle }) => {
  // Map background utility color class to text color class
  const textColorClass = color.replace('bg-', 'text-').replace('-500', '-600');
  
  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 border border-slate-100 flex items-center justify-between transition-all hover:scale-[1.02] duration-300">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-800">
          {isCurrency ? `₹${(Number(value) || 0).toLocaleString()}` : (Number(value) || 0).toLocaleString()}
        </h3>
        {subtitle && (
          <p className="text-[11px] font-semibold text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 shrink-0`}>
        <Icon className={`w-7 h-7 ${textColorClass}`} />
      </div>
    </div>
  );
};

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/superadmin/stats', config);
        setStats(data);
      } catch (error) {
        toast.error('Failed to fetch superadmin stats');
      }
    };
    if (user?.token) {
      fetchStats();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Super Admin System Overview</h2>
        <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <span>Home</span>
          <span>-</span>
          <span className="text-blue-600">Global System Metrics</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Registered Schools"
          value={stats?.totalSchools || 0}
          icon={Building2}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={GraduationCap}
          color="bg-indigo-500"
        />
        <StatCard
          title="Total Teachers"
          value={stats?.totalTeachers || 0}
          icon={UserSquare2}
          color="bg-emerald-500"
        />
        <StatCard
          title="Total Staff"
          value={stats?.totalStaff || 0}
          icon={Users}
          color="bg-amber-500"
        />
        <StatCard
          title="Total Expense Amount"
          value={stats?.totalExpenses || 0}
          icon={TrendingUp}
          color="bg-rose-500"
          isCurrency={true}
          subtitle={`General: ₹${(stats?.generalExpenses || 0).toLocaleString()} • Payroll: ₹${(stats?.payrollExpenses || 0).toLocaleString()}`}
        />
        <StatCard
          title="Total Parents"
          value={stats?.totalParents || 0}
          icon={UserCheck}
          color="bg-purple-500"
        />
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
    { label: 'School Management', path: '/super-admin/schools', icon: Building2 },
    { label: 'Subscription Rates', path: '/super-admin/subscription-settings', icon: Coins },
    { label: 'My Account', path: '/super-admin/profile', icon: User },
  ];

  return (
    <Layout menuItems={menuItems} title="Super Admin Portal">
      <Routes>
        <Route path="/dashboard" element={<DashboardOverview />} />
        <Route path="/schools" element={<SchoolManagement />} />
        <Route path="/subscription-settings" element={<SubscriptionSettings />} />
        <Route path="/profile" element={<AccountProfile />} />
        <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default SuperAdminDashboard;
