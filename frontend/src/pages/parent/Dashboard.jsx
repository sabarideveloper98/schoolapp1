import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import useParentChildStore from '../../store/useParentChildStore';
import { toast } from 'react-toastify';
import { Users, Wallet, User, Bus, BookOpen, CalendarRange, CheckCircle2 } from 'lucide-react';
import Layout from '../../components/Layout';
import ParentFees from './ParentFees';
import ParentBusTracking from './ParentBusTracking';
import ParentHomework from './ParentHomework';
import ParentTimetable from './ParentTimetable';
import AccountProfile from '../AccountProfile';
import ChildSelector from '../../components/ChildSelector';

const ParentOverview = ({ childrenList: propChildrenList }) => {
  const { childrenList: storeChildren, selectedChildId, setSelectedChildId } = useParentChildStore();
  const childrenList = (propChildrenList && propChildrenList.length > 0) ? propChildrenList : storeChildren;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">My Children</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span>Home</span>
            <span>-</span>
            <span className="text-blue-600">Family Overview</span>
          </div>
        </div>
        <ChildSelector showCard={false} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {childrenList?.map((child) => {
          const isSelected = String(child._id) === String(selectedChildId);
          return (
            <div
              key={child._id}
              onClick={() => setSelectedChildId(child._id)}
              className={`bg-white rounded-2xl border transition-all hover:scale-[1.02] duration-300 p-6 cursor-pointer relative ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                  : 'border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-800">{child.student_name}</h3>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
                    <CheckCircle2 className="w-3 h-3" /> Active Child
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <strong className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-0.5">School</strong> 
                  <span className="text-sm font-semibold text-slate-700">{child.school_id?.name || 'N/A'}</span>
                </div>
                <div>
                  <strong className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-0.5">Class & Section</strong> 
                  <span className="text-sm font-semibold text-slate-700">
                    Class {child.class_id?.class || child.class || 'N/A'} - {child.class_id?.section || child.section || 'N/A'}
                  </span>
                </div>
                <div>
                  <strong className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-0.5">Age</strong> 
                  <span className="text-sm font-semibold text-slate-700">{child.age ? `${child.age} yrs` : 'N/A'}</span>
                </div>
                <div>
                  <strong className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block mb-0.5">Date of Birth</strong> 
                  <span className="text-sm font-semibold text-slate-700">{child.dob ? new Date(child.dob).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          );
        })}
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
  const { setChildrenList } = useParentChildStore();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/parent/dashboard', config);
        setDashboardData(data);
        if (data?.children) {
          setChildrenList(data.children);
        }
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch dashboard info');
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchDashboard();
    }
  }, [user, setChildrenList]);

  const menuItems = [
    { label: 'My Children', path: '/parent/dashboard', icon: Users },
    { label: 'Class Timetable', path: '/parent/timetable', icon: CalendarRange },
    { label: 'Child Homework', path: '/parent/homework', icon: BookOpen },
    { label: 'Fee Details', path: '/parent/fees', icon: Wallet },
    { label: 'Bus Tracking', path: '/parent/bus-tracking', icon: Bus },
    { label: 'My Account', path: '/parent/profile', icon: User },
  ];

  if (loading) return <div className="flex justify-center py-12 text-slate-500 font-medium">Loading dashboard...</div>;

  return (
    <Layout menuItems={menuItems} title="Parent Portal">
      <Routes>
        <Route path="/dashboard" element={<ParentOverview childrenList={dashboardData?.children} />} />
        <Route path="/timetable" element={<ParentTimetable childrenList={dashboardData?.children} />} />
        <Route path="/homework" element={<ParentHomework />} />
        <Route path="/fees" element={<ParentFees />} />
        <Route path="/bus-tracking" element={<ParentBusTracking />} />
        <Route path="/profile" element={<AccountProfile />} />
        <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default ParentDashboard;
