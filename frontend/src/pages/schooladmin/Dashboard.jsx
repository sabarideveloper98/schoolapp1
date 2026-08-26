import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserSquare2, BookOpen, GraduationCap, Users2, Calendar } from 'lucide-react';
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
        <StatCard title="Total Teachers" value={stats?.totalTeachers || 0} icon={UserSquare2} color="bg-blue-500" />
        <StatCard title="Total Staff" value={stats?.totalStaff || 0} icon={Users2} color="bg-emerald-500" />
        <StatCard title="Total Classes" value={stats?.totalClasses || 0} icon={GraduationCap} color="bg-amber-500" />
        <StatCard title="Total Subjects" value={stats?.totalSubjects || 0} icon={BookOpen} color="bg-indigo-500" />
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={Users} color="bg-pink-500" />
      </div>
    </div>
  );
};

const SchoolAdminDashboard = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/school-admin/dashboard', icon: LayoutDashboard },
    {
      label: 'Students Information',
      icon: Users,
      subItems: [
        { label: 'Students List', path: '/school-admin/students' },
      ],
    },
    {
      label: 'Student Attendance',
      icon: Calendar,
      subItems: [
        { label: 'Student Attendance', path: '/school-admin/student-attendance' },
        { label: 'Attendance Report', path: '/school-admin/student-report' },
      ],
    },
    {
      label: 'Exam Module',
      icon: GraduationCap,
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
  ];

  return (
    <Layout menuItems={menuItems} title="School Admin Portal">
      <Routes>
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
        <Route path="*" element={<Navigate to="/school-admin/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default SchoolAdminDashboard;
