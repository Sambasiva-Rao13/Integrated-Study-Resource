import { useAuth } from './contexts/AuthContext';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user && window.location.pathname !== '/login') {
        navigate('/login');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <LoginPage />} />
      
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : (
            <Navigate to={`/${user.role}`} />
          )
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
