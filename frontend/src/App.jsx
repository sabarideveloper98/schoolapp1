import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useAuthStore from './store/useAuthStore';

import Login from './pages/Login';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SchoolAdminDashboard from './pages/schooladmin/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import ParentDashboard from './pages/parent/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import DriverLogin from './pages/driver/DriverLogin';
import DriverPortal from './pages/driver/DriverPortal';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Or unauthorized page
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/portal" element={<DriverPortal />} />
          
          <Route path="/super-admin/*" element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/school-admin/*" element={
            <ProtectedRoute allowedRoles={['SchoolAdmin']}>
              <SchoolAdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/teacher/*" element={
            <ProtectedRoute allowedRoles={['Teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="/student/*" element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/parent/*" element={
            <ProtectedRoute allowedRoles={['Parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
}

export default App;
