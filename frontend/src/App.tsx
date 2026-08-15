import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RoleRoute from './components/RoleRoute';
import AdminRoute from './components/AdminRoute';
import StaffRoute from './components/StaffRoute';
import Home from './pages/Home';
import Unauthorized from './pages/Unauthorized';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
import AdminCategories from './pages/AdminCategories';
import AdminExams from './pages/AdminExams';
import AdminReports from './pages/AdminReports';
import ManualGrading from './pages/ManualGrading';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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

          {/* Teacher Routes — dùng lại component quản lý của Admin vì backend đã cấp quyền
              exam:create/update/delete, question:create/update/delete cho teacher.
              Trước đây route này trỏ vào <ExamList/> (giao diện "vào thi" của học sinh) —
              không có chức năng tạo/sửa đề nào cho giáo viên cả. */}
          <Route path="/teacher/exams" element={
            <StaffRoute>
              <AdminLayout>
                <AdminExams />
              </AdminLayout>
            </StaffRoute>
          } />
          <Route path="/teacher/questions" element={
            <StaffRoute>
              <AdminLayout>
                <AdminQuestions />
              </AdminLayout>
            </StaffRoute>
          } />
          <Route path="/teacher/grading" element={
            <StaffRoute>
              <AdminLayout>
                <ManualGrading />
              </AdminLayout>
            </StaffRoute>
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
            <StaffRoute>
              <AdminLayout>
                <AdminQuestions />
              </AdminLayout>
            </StaffRoute>
          } />
          <Route path="/admin/categories" element={
            <StaffRoute>
              <AdminLayout>
                <AdminCategories />
              </AdminLayout>
            </StaffRoute>
          } />
          <Route path="/admin/exams" element={
            <StaffRoute>
              <AdminLayout>
                <AdminExams />
              </AdminLayout>
            </StaffRoute>
          } />
          <Route path="/admin/manual-grading" element={
            <StaffRoute>
              <AdminLayout>
                <ManualGrading />
              </AdminLayout>
            </StaffRoute>
          } />
          <Route path="/admin/reports" element={
            <StaffRoute>
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            </StaffRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
