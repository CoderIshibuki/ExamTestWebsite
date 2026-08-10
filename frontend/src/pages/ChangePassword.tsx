import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/v1/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      
      // Require user to login again
      await logout();
      
      // Redirect to login
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 450, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
          Action Required
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
          For security reasons, you must change your default password before you can access the system.
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            required
            sx={{ mb: 3 }}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            required
            sx={{ mb: 3 }}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            fullWidth
            required
            sx={{ mb: 4 }}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            size="large"
            disabled={loading}
            sx={{ bgcolor: '#1b4f8a', py: 1.5, fontWeight: 'bold', '&:hover': { bgcolor: '#133a66' } }}
          >
            {loading ? 'Updating...' : 'Change Password & Continue'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
