import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RoleRoute from './components/RoleRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Unauthorized from './pages/Unauthorized';

import Login from './pages/Login';
import Register from './pages/Register';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamRoom from './pages/ExamRoom';
import { ExamProvider } from './context/ExamContext';
import ResultSummary from './pages/ResultSummary';
import CameraTest from './components/CameraTest';
import ProctorDashboard from './pages/ProctorDashboard';

import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminQuestions from './pages/AdminQuestions';
import AdminExams from './pages/AdminExams';
import AdminReports from './pages/AdminReports';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/change-password" element={
            <RoleRoute allowedRoles={['student', 'teacher', 'admin']}>
              <ChangePassword />
            </RoleRoute>
          } />
          
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={
            <RoleRoute allowedRoles={['student', 'teacher', 'admin']}>
              <Dashboard />
            </RoleRoute>
          } />

          {/* Student Routes */}
          <Route path="/student/exams" element={
            <RoleRoute allowedRoles={['student', 'admin']}>
              <ExamList />
            </RoleRoute>
          } />
          <Route path="/student/exam/:id" element={
            <RoleRoute allowedRoles={['student', 'admin']}>
              <ExamProvider>
                <ExamRoom />
              </ExamProvider>
            </RoleRoute>
          } />
          <Route path="/student/result/:attemptId" element={
            <RoleRoute allowedRoles={['student', 'admin']}>
              <ResultSummary />
            </RoleRoute>
          } />
          <Route path="/student/camera-test" element={
            <RoleRoute allowedRoles={['student', 'admin']}>
              <CameraTest />
            </RoleRoute>
          } />

          {/* Teacher Routes */}
          <Route path="/teacher/exams" element={
            <RoleRoute allowedRoles={['teacher', 'admin']}>
              <ExamList />
            </RoleRoute>
          } />

          {/* Proctor Route */}
          <Route path="/proctor/exam/:examId" element={
            <RoleRoute allowedRoles={['teacher', 'admin']}>
              <ProctorDashboard />
            </RoleRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/questions" element={
            <AdminRoute>
              <AdminLayout>
                <AdminQuestions />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/exams" element={
            <AdminRoute>
              <AdminLayout>
                <AdminExams />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/reports" element={
            <AdminRoute>
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            </AdminRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
