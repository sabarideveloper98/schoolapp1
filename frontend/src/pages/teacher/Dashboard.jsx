import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  MessageSquare, 
  User, 
  Bus, 
  CalendarRange, 
  CheckSquare, 
  Award, 
  FileText, 
  Star, 
  Calendar, 
  Bell, 
  FileSpreadsheet 
} from 'lucide-react';
import Layout from '../../components/Layout';
import useAuthStore from '../../store/useAuthStore';

import TeacherOverview from './TeacherOverview';
import TeacherStudents from './TeacherStudents';
import TeacherClasses from './TeacherClasses';
import TeacherMessages from './TeacherMessages';
import TeacherBusTracking from './TeacherBusTracking';
import TeacherHomework from './TeacherHomework';
import TeacherAttendance from './TeacherAttendance';
import TeacherExams from './TeacherExams';
import TeacherMaterials from './TeacherMaterials';
import TeacherLeaves from './TeacherLeaves';
import TeacherRemarks from './TeacherRemarks';
import TeacherAnnouncements from './TeacherAnnouncements';
import TeacherReports from './TeacherReports';
import TeacherProfile from './TeacherProfile';
import TeacherTimetable from '../schooladmin/timetable/TeacherTimetable';

const TeacherDashboard = () => {
  const { user } = useAuthStore();

  const menuItems = [
    {
      label: 'Overview',
      icon: LayoutDashboard,
      path: '/teacher/overview'
    },
    {
      label: 'My Timetable',
      icon: CalendarRange,
      path: '/teacher/timetable'
    },
    { 
      label: 'Academic Management', 
      icon: BookOpen,
      subItems: [
        { label: 'Assigned Classes', path: '/teacher/classes' },
        { label: 'My Students', path: '/teacher/students' },
        { label: 'Daily Attendance', path: '/teacher/attendance' },
        { label: 'Homework Assignments', path: '/teacher/homework' },
        { label: 'Exam Marks', path: '/teacher/exams' },
        { label: 'Study Materials', path: '/teacher/materials' }
      ]
    },
    {
      label: 'Student Conduct & Remarks',
      icon: Star,
      path: '/teacher/remarks'
    },
    {
      label: 'Leave Applications',
      icon: Calendar,
      path: '/teacher/leaves'
    },
    { 
      label: 'Communication Hub', 
      icon: MessageSquare,
      subItems: [
        { label: 'Parent Queries & Messages', path: '/teacher/messages' },
        { label: 'School Circulars', path: '/teacher/announcements' }
      ]
    },
    {
      label: 'Bus Tracking',
      icon: Bus,
      path: '/teacher/bus-tracking'
    },
    {
      label: 'Academic Reports',
      icon: FileSpreadsheet,
      path: '/teacher/reports'
    },
    {
      label: 'My Account & Profile',
      icon: User,
      path: '/teacher/profile'
    }
  ];

  return (
    <Layout menuItems={menuItems} title="Teacher Portal">
      <Routes>
        <Route path="/overview" element={<TeacherOverview />} />
        <Route path="/timetable" element={<TeacherTimetable preselectedTeacherId={user?.teacher_id || user?._id} />} />
        <Route path="/students" element={<TeacherStudents />} />
        <Route path="/classes" element={<TeacherClasses />} />
        <Route path="/attendance" element={<TeacherAttendance />} />
        <Route path="/homework" element={<TeacherHomework />} />
        <Route path="/exams" element={<TeacherExams />} />
        <Route path="/materials" element={<TeacherMaterials />} />
        <Route path="/remarks" element={<TeacherRemarks />} />
        <Route path="/leaves" element={<TeacherLeaves />} />
        <Route path="/messages" element={<TeacherMessages />} />
        <Route path="/announcements" element={<TeacherAnnouncements />} />
        <Route path="/bus-tracking" element={<TeacherBusTracking />} />
        <Route path="/reports" element={<TeacherReports />} />
        <Route path="/profile" element={<TeacherProfile />} />
        <Route path="*" element={<Navigate to="/teacher/overview" replace />} />
      </Routes>
    </Layout>
  );
};

export default TeacherDashboard;
