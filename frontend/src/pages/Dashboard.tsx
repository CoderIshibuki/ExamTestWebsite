import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Container, Typography, Box, Button, Card, CardContent, Grid, Avatar, AppBar, Toolbar, Chip, Skeleton, Divider } from '@mui/material';
import { School, FactCheck, VerifiedUser, PlayArrow, Videocam, LockReset, Logout } from '@mui/icons-material';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  proctor: 'Giám thị',
  student: 'Học sinh',
};

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Top Navbar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #E2E8F0' }}>
        <Toolbar sx={{ maxWidth: 1200, mx: 'auto', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: 22 }}>
              <Box sx={{ width: 10, height: 10, bgcolor: '#E53935', borderRadius: '2px' }} />
              <Box sx={{ width: 10, height: 10, bgcolor: '#1E88E5', borderRadius: '2px' }} />
              <Box sx={{ width: 10, height: 10, bgcolor: '#FDD835', borderRadius: '2px' }} />
              <Box sx={{ width: 10, height: 10, bgcolor: '#43A047', borderRadius: '2px' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B' }}>
              exam<span style={{ color: '#10B981' }}>system</span>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user && (
              <Chip
                avatar={<Avatar sx={{ bgcolor: '#2563EB', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>{user.username.charAt(0).toUpperCase()}</Avatar>}
                label={`${user.full_name || user.username} (${ROLE_LABELS[user.role] || user.role})`}
                variant="outlined"
                sx={{ borderColor: '#E2E8F0', bgcolor: '#F1F5F9', fontWeight: 600, color: '#334155' }}
              />
            )}
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Logout />}
              onClick={logout}
              sx={{ color: '#64748B', borderColor: '#CBD5E1', textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
            >
              Đăng xuất
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 5 }}>
        {/* Clean Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            Bảng điều khiển cá nhân
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Chào mừng bạn đến với hệ thống thi trực tuyến. Quản lý hoạt động và truy cập các tính năng bên dưới.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* User Profile Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            {user ? (
              <Card
                sx={{
                  borderRadius: 3.5,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  bgcolor: '#ffffff',
                }}
              >
                <CardContent sx={{ p: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 72,
                      height: 72,
                      bgcolor: '#EFF6FF',
                      color: '#2563EB',
                      mb: 2,
                      fontSize: 28,
                      fontWeight: 800,
                      border: '2px solid #DBEAFE',
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                    {user.full_name || user.username}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 1.5 }}>
                    @{user.username} • {user.email}
                  </Typography>

                  <Chip
                    icon={<VerifiedUser sx={{ fontSize: '16px !important' }} />}
                    label={ROLE_LABELS[user.role] || user.role}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 700, px: 1, mb: 2.5 }}
                  />

                  <Divider sx={{ width: '100%', mb: 2.5, borderColor: '#F1F5F9' }} />

                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    startIcon={<LockReset />}
                    onClick={() => navigate('/change-password')}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      color: '#475569',
                      borderColor: '#E2E8F0',
                      fontWeight: 600,
                      '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' },
                    }}
                  >
                    Đổi mật khẩu
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0' }}>
                <CardContent sx={{ p: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Skeleton variant="circular" width={72} height={72} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 2 }} />
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Action Cards */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={2.5}>
              {user?.role === 'admin' && (
                <Grid size={{ xs: 12 }}>
                  <Card
                    sx={{
                      borderRadius: 3.5,
                      border: '1px solid #E0E7FF',
                      bgcolor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: '#6366F1', transform: 'translateY(-2px)' },
                    }}
                  >
                    <CardContent sx={{ p: 3.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', width: 50, height: 50 }}>
                          <VerifiedUser />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E1B4B' }}>Trang Quản trị Hệ thống</Typography>
                          <Typography variant="body2" sx={{ color: '#6366F1' }}>Quản lý người dùng, ngân hàng câu hỏi, đề thi và thống kê báo cáo.</Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, whiteSpace: 'nowrap' }}
                        onClick={() => navigate('/admin/dashboard')}
                      >
                        Vào trang Admin
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {user?.role === 'teacher' && (
                <Grid size={{ xs: 12 }}>
                  <Card
                    sx={{
                      borderRadius: 3.5,
                      border: '1px solid #D1FAE5',
                      bgcolor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: '#10B981', transform: 'translateY(-2px)' },
                    }}
                  >
                    <CardContent sx={{ p: 3.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#ECFDF5', color: '#10B981', width: 50, height: 50 }}>
                          <School />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#064E3B' }}>Cổng Giảng dạy (Teacher Portal)</Typography>
                          <Typography variant="body2" sx={{ color: '#059669' }}>Tạo đề thi, soạn câu hỏi, chấm bài tự luận và theo dõi tiến độ thi.</Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, whiteSpace: 'nowrap' }}
                        onClick={() => navigate('/admin/exams')}
                      >
                        Vào trang Giảng dạy
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {user?.role === 'proctor' && (
                <Grid size={{ xs: 12 }}>
                  <Card
                    sx={{
                      borderRadius: 3.5,
                      border: '1px solid #FEF3C7',
                      bgcolor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: '#F59E0B', transform: 'translateY(-2px)' },
                    }}
                  >
                    <CardContent sx={{ p: 3.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#FFFBEB', color: '#D97706', width: 50, height: 50 }}>
                          <Videocam />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#78350F' }}>Cổng Giám thị (Proctor Portal)</Typography>
                          <Typography variant="body2" sx={{ color: '#B45309' }}>Theo dõi video camera, giám sát vi phạm theo thời gian thực.</Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        sx={{ bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' }, textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, whiteSpace: 'nowrap' }}
                        onClick={() => navigate('/admin/exams')}
                      >
                        Vào phòng Giám sát
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {user?.role === 'student' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 3.5,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        bgcolor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: '#2563EB', transform: 'translateY(-2px)' },
                      }}
                    >
                      <CardContent sx={{ p: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Avatar sx={{ bgcolor: '#EFF6FF', color: '#2563EB', width: 44, height: 44 }}>
                            <School />
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>Danh sách kỳ thi</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                          Xem các đề thi đang mở, kiểm tra thời lượng và bắt đầu làm bài.
                        </Typography>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<PlayArrow />}
                          onClick={() => navigate('/student/exams')}
                          sx={{
                            bgcolor: '#2563EB',
                            '&:hover': { bgcolor: '#1D4ED8' },
                            textTransform: 'none',
                            borderRadius: 2,
                            fontWeight: 700,
                            py: 1,
                          }}
                        >
                          Vào danh sách thi
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 3.5,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        bgcolor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: '#10B981', transform: 'translateY(-2px)' },
                      }}
                    >
                      <CardContent sx={{ p: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Avatar sx={{ bgcolor: '#ECFDF5', color: '#10B981', width: 44, height: 44 }}>
                            <FactCheck />
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>Kết quả học tập</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                          Xem lại lịch sử làm bài, điểm số và bài giải chi tiết của bạn.
                        </Typography>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => navigate('/student/results')}
                          sx={{
                            color: '#10B981',
                            borderColor: '#A7F3D0',
                            '&:hover': { borderColor: '#10B981', bgcolor: '#ECFDF5' },
                            textTransform: 'none',
                            borderRadius: 2,
                            fontWeight: 700,
                            py: 1,
                          }}
                        >
                          Xem kết quả
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Card
                      sx={{
                        borderRadius: 3.5,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        bgcolor: '#ffffff',
                      }}
                    >
                      <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#FFFBEB', color: '#D97706', width: 44, height: 44 }}>
                            <Videocam />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>Kiểm tra Camera & Thiết bị (Proctoring)</Typography>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>Kiểm tra camera, góc nhìn khuôn mặt trước khi thi để không bị vi phạm.</Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={() => navigate('/student/camera-test')}
                          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap' }}
                        >
                          Kiểm tra Camera
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
