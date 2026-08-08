import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamRoom from './pages/ExamRoom';
import ResultSummary from './pages/ResultSummary';
import CameraTest from './components/CameraTest';

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
              <ExamRoom />
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
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
