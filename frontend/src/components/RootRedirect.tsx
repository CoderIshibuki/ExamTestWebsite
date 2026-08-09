import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login');
    } else if (user) {
      if (user.requires_password_change) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f172a' }}>
      <CircularProgress size={60} thickness={4} sx={{ color: '#38bdf8' }} />
    </Box>
  );
};

export default RootRedirect;
