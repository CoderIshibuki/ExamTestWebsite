import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    Alert,
} from '@mui/material';
import { API_URL } from '../api/authInterceptors';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      // Dùng chung API_URL với các trang xác thực khác (trước đây hardcode
      // '/api/v1/auth/change-password' bằng axios trần, bỏ qua cơ chế tự động
      // refresh token dùng chung — nếu access token vừa hết hạn đúng lúc này,
      // request sẽ lỗi 401 mà không được thử refresh lại như các API khác).
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_URL}/auth/change-password`,
        { old_password: oldPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xs">
        <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
            Yêu cầu đổi mật khẩu
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
            Vì lý do bảo mật, bạn cần đổi mật khẩu mặc định trước khi tiếp tục sử dụng hệ thống.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Mật khẩu hiện tại"
              type="password"
              margin="normal"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <TextField
              fullWidth
              label="Mật khẩu mới"
              type="password"
              margin="normal"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Ít nhất 8 ký tự"
            />
            <TextField
              fullWidth
              label="Xác nhận mật khẩu mới"
              type="password"
              margin="normal"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
