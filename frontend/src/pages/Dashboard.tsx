import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Typography, Box, Button, Card, CardContent, Grid, Avatar, Chip, Skeleton, Divider } from '@mui/material';
import { School, FactCheck, VerifiedUser, Videocam, LockReset } from '@mui/icons-material';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  student: 'Học sinh',
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <Box>
      {/* Clean Header */}
      <Box sx={{ mb: 3.5 }}>
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
                borderRadius: 1.5,
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
                bgcolor: '#FFFFFF',
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: '#EFF6FF',
                    color: '#2563EB',
                    mb: 1.5,
                    fontSize: 24,
                    fontWeight: 800,
                    border: '2px solid #DBEAFE',
                    borderRadius: 1.2,
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
                  icon={<VerifiedUser sx={{ fontSize: '15px !important' }} />}
                  label={ROLE_LABELS[user.role] || user.role}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700, px: 1, mb: 2, borderRadius: 1 }}
                />

                <Divider sx={{ width: '100%', mb: 2, borderColor: '#F1F5F9' }} />

                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  startIcon={<LockReset />}
                  onClick={() => navigate('/change-password')}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1.5,
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
            <Card sx={{ borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Skeleton variant="circular" width={64} height={64} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1.5 }} />
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
                    borderRadius: 1.5,
                    border: '1px solid #E0E7FF',
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: '#6366F1', transform: 'translateY(-1px)' },
                  }}
                >
                  <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', width: 46, height: 46, borderRadius: 1.2 }}>
                        <VerifiedUser />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E1B4B' }}>Trang Quản trị Hệ thống</Typography>
                        <Typography variant="body2" sx={{ color: '#6366F1' }}>Quản lý người dùng, ngân hàng câu hỏi, đề thi và thống kê báo cáo.</Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, textTransform: 'none', borderRadius: 1.5, fontWeight: 700, px: 3, whiteSpace: 'nowrap' }}
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
                    borderRadius: 1.5,
                    border: '1px solid #D1FAE5',
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: '#10B981', transform: 'translateY(-1px)' },
                  }}
                >
                  <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#ECFDF5', color: '#10B981', width: 46, height: 46, borderRadius: 1.2 }}>
                        <School />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#064E3B' }}>Cổng Giảng dạy (Teacher Portal)</Typography>
                        <Typography variant="body2" sx={{ color: '#059669' }}>Tạo đề thi, soạn câu hỏi, chấm bài tự luận và theo dõi tiến độ thi.</Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', borderRadius: 1.5, fontWeight: 700, px: 3, whiteSpace: 'nowrap' }}
                      onClick={() => navigate('/admin/exams')}
                    >
                      Vào trang Giảng dạy
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {user?.role === 'student' && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Card
                    sx={{
                      borderRadius: 1.5,
                      border: '1px solid #D1FAE5',
                      bgcolor: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: '#10B981', transform: 'translateY(-1px)' },
                    }}
                  >
                    <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#ECFDF5', color: '#10B981', width: 48, height: 48, borderRadius: 1.2 }}>
                          <FactCheck sx={{ fontSize: 26 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#064E3B' }}>
                            Kết quả học tập & Lịch sử bài thi
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#059669', mt: 0.5 }}>
                            Tra cứu điểm số, thời gian làm bài và xem lời giải chi tiết cho tất cả các kỳ thi bạn đã tham gia.
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/student/results')}
                        sx={{
                          bgcolor: '#10B981',
                          '&:hover': { bgcolor: '#059669' },
                          textTransform: 'none',
                          borderRadius: 1.5,
                          fontWeight: 700,
                          px: 3,
                          py: 1,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Xem kết quả bài thi
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card
                    sx={{
                      borderRadius: 1.5,
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
                      bgcolor: '#FFFFFF',
                    }}
                  >
                    <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#FFFBEB', color: '#D97706', width: 42, height: 42, borderRadius: 1.2 }}>
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
                        sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700, whiteSpace: 'nowrap' }}
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
    </Box>
  );
};

export default Dashboard;

