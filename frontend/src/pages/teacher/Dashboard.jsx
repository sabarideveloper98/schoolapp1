import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, MessageSquare } from 'lucide-react';
import Layout from '../../components/Layout';

import TeacherStudents from './TeacherStudents';
import TeacherClasses from './TeacherClasses';
import TeacherMessages from './TeacherMessages';

const TeacherDashboard = () => {
  const menuItems = [
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
      label: 'Communication Hub', 
      icon: MessageSquare,
      subItems: [
        { label: 'Messages & Chat', path: '/teacher/messages' }
      ]
    }
  ];

  return (
    <Layout menuItems={menuItems} title="Teacher Portal">
      <Routes>
        <Route path="/students" element={<TeacherStudents />} />
        <Route path="/classes" element={<TeacherClasses />} />
        <Route path="/messages" element={<TeacherMessages />} />
        <Route path="*" element={<Navigate to="/teacher/students" replace />} />
      </Routes>
    </Layout>
  );
};

export default TeacherDashboard;
