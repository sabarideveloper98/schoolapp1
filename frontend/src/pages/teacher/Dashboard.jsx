import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, MessageSquare, User, Bus, CalendarRange } from 'lucide-react';
import Layout from '../../components/Layout';
import useAuthStore from '../../store/useAuthStore';

import TeacherStudents from './TeacherStudents';
import TeacherClasses from './TeacherClasses';
import TeacherMessages from './TeacherMessages';
import TeacherBusTracking from './TeacherBusTracking';
import TeacherHomework from './TeacherHomework';
import TeacherTimetable from '../schooladmin/timetable/TeacherTimetable';
import AccountProfile from '../AccountProfile';

const TeacherDashboard = () => {
  const { user } = useAuthStore();

  const menuItems = [
    {
      label: 'My Timetable',
      icon: CalendarRange,
      path: '/teacher/timetable'
    },
    { 
      label: 'Students Information', 
      icon: Users,
      subItems: [
        { label: 'My Students list', path: '/teacher/students' }
      ]
    },
    { 
      label: 'Academic Configuration', 
      icon: BookOpen,
      subItems: [
        { label: 'Assigned Classes', path: '/teacher/classes' }
      ]
    },
    {
      label: 'Homework Assignment',
      icon: BookOpen,
      path: '/teacher/homework'
    },
    { 
      label: 'Communication Hub', 
      icon: MessageSquare,
      subItems: [
        { label: 'Messages & Chat', path: '/teacher/messages' }
      ]
    },
    {
      label: 'Bus Tracking',
      icon: Bus,
      path: '/teacher/bus-tracking'
    },
    {
      label: 'My Account',
      icon: User,
      path: '/teacher/profile'
    }
  ];

  return (
    <Layout menuItems={menuItems} title="Teacher Portal">
      <Routes>
        <Route path="/timetable" element={<TeacherTimetable preselectedTeacherId={user?.teacher_id || user?._id} />} />
        <Route path="/students" element={<TeacherStudents />} />
        <Route path="/classes" element={<TeacherClasses />} />
        <Route path="/homework" element={<TeacherHomework />} />
        <Route path="/messages" element={<TeacherMessages />} />
        <Route path="/bus-tracking" element={<TeacherBusTracking />} />
        <Route path="/profile" element={<AccountProfile />} />
        <Route path="*" element={<Navigate to="/teacher/timetable" replace />} />
      </Routes>
    </Layout>
  );
};

export default TeacherDashboard;
