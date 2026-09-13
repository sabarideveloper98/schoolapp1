import { Routes, Route, Navigate } from 'react-router-dom';
import { BookOpen, User, CalendarRange } from 'lucide-react';
import Layout from '../../components/Layout';
import StudentHomework from './StudentHomework';
import StudentTimetable from './StudentTimetable';
import AccountProfile from '../AccountProfile';

const StudentDashboard = () => {
  const menuItems = [
    { label: 'Class Timetable', path: '/student/timetable', icon: CalendarRange },
    { label: 'My Homework', path: '/student/homework', icon: BookOpen },
    { label: 'My Account', path: '/student/profile', icon: User },
  ];

  return (
    <Layout menuItems={menuItems} title="Student Portal">
      <Routes>
        <Route path="/timetable" element={<StudentTimetable />} />
        <Route path="/homework" element={<StudentHomework />} />
        <Route path="/profile" element={<AccountProfile />} />
        <Route path="*" element={<Navigate to="/student/timetable" replace />} />
      </Routes>
    </Layout>
  );
};

export default StudentDashboard;
