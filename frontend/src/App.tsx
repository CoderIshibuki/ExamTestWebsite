import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamRoom from './pages/ExamRoom';
import { ExamProvider } from './context/ExamContext';
import ResultSummary from './pages/ResultSummary';
import CameraTest from './components/CameraTest';
import RoleRoute from './components/RoleRoute';
import ProctorDashboard from './pages/ProctorDashboard';
import AdminRoute from './components/AdminRoute';
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
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/exams" element={
            <PrivateRoute>
              <ExamList />
            </PrivateRoute>
          } />
          <Route path="/exam/:id" element={
            <PrivateRoute>
              <ExamProvider>
                <ExamRoom />
              </ExamProvider>
            </PrivateRoute>
          } />
          <Route path="/result/:examId" element={
            <PrivateRoute>
              <ResultSummary />
            </PrivateRoute>
          } />
          <Route path="/camera-test" element={
            <PrivateRoute>
              <CameraTest />
            </PrivateRoute>
          } />
          <Route path="/proctor/:examId" element={
            <RoleRoute allowedRoles={['admin', 'teacher']}>
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
          
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
