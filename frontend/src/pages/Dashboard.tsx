import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Container, Typography, Box, Button, Card, CardContent, Grid, Avatar, AppBar, Toolbar, Chip, Skeleton } from '@mui/material';
import { School, FactCheck, VerifiedUser, PlayArrow, Videocam } from '@mui/icons-material';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #E2E8F0' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 700 }} aria-label="Antigravity Exams Logo">
            Antigravity<span style={{color: '#10B981'}}>Exams</span>
          </Typography>
          <Button variant="outlined" color="inherit" aria-label="Đăng xuất" sx={{ color: 'text.secondary', borderColor: '#E2E8F0' }} onClick={logout}>
            Đăng xuất
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)', pt: 8, pb: 12, mb: -6 }}>
        <Container maxWidth="lg">
          {user ? (
            <>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                Xin chào, {user.full_name || user.username}!
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
                Chúc bạn một ngày học tập và thi cử hiệu quả.
              </Typography>
            </>
          ) : (
            <Box sx={{ width: '50%' }} role="status" aria-busy="true">
              <Skeleton variant="text" sx={{ fontSize: '3rem', bgcolor: 'rgba(255,255,255,0.3)' }} />
              <Skeleton variant="text" sx={{ fontSize: '1.5rem', width: '80%', bgcolor: 'rgba(255,255,255,0.2)' }} />
            </Box>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Grid container spacing={4}>
          {/* User Profile Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            {user ? (
              <Card sx={{ height: '100%', borderRadius: 4, transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' } }}>
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.light', color: 'primary.dark', mb: 2, fontSize: 32 }} aria-hidden="true">
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{user.full_name || user.username}</Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>{user.email}</Typography>
                  <Chip icon={<VerifiedUser />} label={user.role?.toUpperCase()} color="primary" size="small" sx={{ fontWeight: 600, px: 1 }} aria-label={`Vai trò: ${user.role}`} />
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ height: '100%', borderRadius: 4 }} role="status" aria-busy="true">
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Skeleton variant="circular" width={80} height={80} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={24} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Quick Actions */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card sx={{ height: '100%', borderRadius: 4, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', mr: 2 }} aria-hidden="true"><School /></Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Danh sách kỳ thi</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 4, minHeight: 40 }}>Xem các bài thi đang mở và bắt đầu làm bài ngay.</Typography>
                    <Button variant="contained" fullWidth size="large" startIcon={<PlayArrow />} onClick={() => navigate(`/${user?.role}/exams`)} aria-label="Xem danh sách kỳ thi">
                      Xem kỳ thi
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Card sx={{ height: '100%', borderRadius: 4, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#ECFDF5', color: '#10B981', mr: 2 }} aria-hidden="true"><FactCheck /></Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Kết quả học tập</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 4, minHeight: 40 }}>Xem lại lịch sử làm bài và điểm số của bạn.</Typography>
                    <Button variant="outlined" color="secondary" fullWidth size="large" aria-label="Xem kết quả học tập">
                      Xem kết quả
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Card sx={{ borderRadius: 4, transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } }}>
                  <CardContent sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#FFFBEB', color: '#F59E0B', mr: 3, display: { xs: 'none', sm: 'flex' } }} aria-hidden="true"><Videocam /></Avatar>
                      <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Hệ thống Giám thị (Proctoring)</Typography>
                        <Typography color="text.secondary">Kiểm tra camera và micro trước khi thi để đảm bảo không gặp lỗi kỹ thuật.</Typography>
                      </Box>
                    </Box>
                    <Button variant="outlined" color="warning" onClick={() => navigate(`/${user?.role}/camera-test`)} aria-label="Kiểm tra Camera">
                      Kiểm tra Camera
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
