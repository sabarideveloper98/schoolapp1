import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, UserSquare2, GraduationCap, UserCheck } from 'lucide-react';
import Layout from '../../components/Layout';
import SchoolManagement from './SchoolManagement';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';

const StatCard = ({ title, value, icon: Icon, color }) => {
  // Map background utility color class to text color class
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
        const res = await axios.get('http://localhost:5005/api/superadmin/dashboard', config);
        setStats(res.data);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch dashboard stats');
        setLoading(false);
      }
    };

    if (user?.token) fetchStats();
  }, [user]);

  if (loading) return <div className="flex justify-center py-12 text-slate-500 font-medium">Loading overview...</div>;

  return (
    <div className="space-y-6">
      {/* Page Header and Breadcrumb */}
      <div>
        <h2 className="text-2xl font-black text-slate-800">Dashboard</h2>
        <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <span>Home</span>
          <span>-</span>
          <span className="text-blue-600">At-a-glance</span>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Schools"
          value={stats?.totalSchools || 0}
          icon={Building2}
          color="bg-blue-500"
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
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={GraduationCap}
          color="bg-indigo-500"
        />
        <StatCard
          title="Total Parents"
          value={stats?.totalParents || 0}
          icon={UserCheck}
          color="bg-pink-500"
        />
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
    { label: 'School Management', path: '/super-admin/schools', icon: Building2 },
  ];

  return (
    <Layout menuItems={menuItems} title="Super Admin Portal">
      <Routes>
        <Route path="/dashboard" element={<DashboardOverview />} />
        <Route path="/schools" element={<SchoolManagement />} />
        <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default SuperAdminDashboard;
