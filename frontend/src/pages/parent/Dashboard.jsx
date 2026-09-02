import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { Users, Wallet, User } from 'lucide-react';
import Layout from '../../components/Layout';
import ParentFees from './ParentFees';
import AccountProfile from '../AccountProfile';

const ParentOverview = ({ childrenList }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800">My Children</h2>
        <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <span>Home</span>
          <span>-</span>
          <span className="text-blue-600">Family Overview</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {childrenList?.map((child) => (
          <div key={child._id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 transition-all hover:scale-[1.02] duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-4">{child.student_name}</h3>
            <div className="space-y-3">
              <div>
                <strong className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-0.5">School</strong> 
                <span className="text-sm font-semibold text-slate-700">{child.school_id?.name || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-0.5">Class & Section</strong> 
                <span className="text-sm font-semibold text-slate-700">{child.class_id?.class} - {child.class_id?.section}</span>
              </div>
              <div>
                <strong className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-0.5">Age</strong> 
                <span className="text-sm font-semibold text-slate-700">{child.age} yrs</span>
              </div>
              <div>
                <strong className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-0.5">Date of Birth</strong> 
                <span className="text-sm font-semibold text-slate-700">{new Date(child.dob).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
        {childrenList?.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 font-semibold shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            No children records found.
          </div>
        )}
      </div>
    </div>
  );
};

const ParentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('http://localhost:5005/api/parent/dashboard', config);
        setDashboardData(data);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch dashboard info');
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchDashboard();
    }
  }, [user]);

  const menuItems = [
    { label: 'My Children', path: '/parent/dashboard', icon: Users },
    { label: 'Fee Details', path: '/parent/fees', icon: Wallet },
    { label: 'My Account', path: '/parent/profile', icon: User },
  ];

  if (loading) return <div className="flex justify-center py-12 text-slate-500 font-medium">Loading dashboard...</div>;

  return (
    <Layout menuItems={menuItems} title="Parent Portal">
      <Routes>
        <Route path="/dashboard" element={<ParentOverview childrenList={dashboardData?.children} />} />
        <Route path="/fees" element={<ParentFees />} />
        <Route path="/profile" element={<AccountProfile />} />
        <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default ParentDashboard;
