import { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Box, Button, TextField, Typography, Container, Card, CardContent, Alert, Link } from '@mui/material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { API_URL } from '../api/authInterceptors';

const loginSchema = z.object({
  username: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginSchema = z.infer<typeof loginSchema>;

const BG_DARK = '#121212';
const CARD_BG = '#1e1e1e';
const TEXT_LIGHT = '#ffffff';
const TEXT_MUTED = '#a0a0a0';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);

      const response = await axios.post(`${API_URL}/auth/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      login(response.data.access_token, response.data.refresh_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG_DARK, color: TEXT_LIGHT, fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, background: 'radial-gradient(circle at 50% 0%, #1f2937 0%, #111827 50%, #030712 100%)' }}>
      <Container maxWidth="md">
        <Card sx={{ bgcolor: CARD_BG, color: TEXT_LIGHT, borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', overflow: 'hidden', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          
          {/* Left Side - Branding */}
          <Box sx={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', p: 6, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(30px)' }} />
            <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(30px)' }} />
            
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 2 }} onClick={() => navigate('/')}>
                <Box sx={{ display: 'flex', mr: 1.5 }}>
                  <Box sx={{ width: 14, height: 14, bgcolor: '#fff', borderRadius: '4px', mr: 0.5, opacity: 0.9 }} />
                  <Box sx={{ width: 14, height: 14, bgcolor: '#fff', borderRadius: '4px', mr: 0.5, opacity: 0.7 }} />
                  <Box sx={{ width: 14, height: 14, bgcolor: '#fff', borderRadius: '4px', opacity: 0.5 }} />
                </Box>
                <Box>
                  <Typography component="span" sx={{ lineHeight: 1, color: '#fff', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>exam</Typography>
                  <Typography component="span" sx={{ lineHeight: 1, color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>system</Typography>
                </Box>
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 4, mb: 2, color: '#fff' }}>
                Hệ thống Thi Trực Tuyến Toàn Diện
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                Nền tảng kiểm tra và đánh giá năng lực hiện đại, tích hợp công nghệ chống gian lận và đa dạng loại câu hỏi.
              </Typography>
            </Box>
            
            <Box sx={{ mt: 8 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                © 2026 ExamSystem. All rights reserved.
              </Typography>
            </Box>
          </Box>

          {/* Right Side - Form */}
          <Box sx={{ flex: 1, p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
              Đăng nhập
            </Typography>
            <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 4 }}>
              Chào mừng bạn quay lại. Vui lòng đăng nhập để tiếp tục.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', '& .MuiAlert-icon': { color: '#ef4444' } }}>{error}</Alert>}
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Tên đăng nhập hoặc Email"
                margin="normal"
                variant="outlined"
                {...register('username')}
                error={!!errors.username}
                helperText={errors.username?.message}
                slotProps={{ inputLabel: { style: { color: TEXT_MUTED } } }}
                sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '2px' } } }}
              />
              <TextField
                fullWidth
                label="Mật khẩu"
                type="password"
                margin="normal"
                variant="outlined"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                slotProps={{ inputLabel: { style: { color: TEXT_MUTED } } }}
                sx={{ mb: 4, '& .MuiOutlinedInput-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.03)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '2px' } } }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disableElevation
                sx={{ mb: 3, py: 1.5, bgcolor: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: '1rem', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#2563eb' } }}
              >
                Đăng nhập
              </Button>
            </form>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
                Chưa có tài khoản?{' '}
                <Link component={RouterLink} to="/register" sx={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                  Đăng ký ngay
                </Link>
              </Typography>
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
