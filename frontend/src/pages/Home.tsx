import { Box, Typography, Container, Button, AppBar, Toolbar, Card, CardContent, Grid, Chip, Skeleton, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import ShieldIcon from '@mui/icons-material/Shield';
import QuizIcon from '@mui/icons-material/Quiz';
import { AuthContext } from '../context/AuthContext';
import { getPublishedExams } from '../api/examApi';
import type { Exam } from '../api/examApi';

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    let mounted = true;
    getPublishedExams()
      .then((data) => {
        if (mounted) setExams(data.slice(0, 5));
      })
      .catch((err) => console.error('Không thể tải danh sách kỳ thi:', err))
      .finally(() => {
        if (mounted) setLoadingExams(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const examListPath = user?.role ? `/${user.role === 'admin' ? 'student' : user.role}/exams` : '/login';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navbar - đồng bộ với Dashboard */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #E2E8F0' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 700, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            exam<span style={{ color: '#10B981' }}>system</span>
          </Typography>

          {!isAuthenticated ? (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="text" onClick={() => navigate('/login')} aria-label="Đăng nhập">
                Đăng nhập
              </Button>
              <Button variant="contained" onClick={() => navigate('/register')} aria-label="Đăng ký">
                Đăng ký
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                Xin chào, <strong>{user?.full_name || user?.username}</strong>
              </Typography>
              <Button variant="outlined" onClick={() => navigate('/dashboard')} aria-label="Vào Dashboard">
                Dashboard
              </Button>
              <Button variant="text" color="inherit" sx={{ color: 'text.secondary' }} onClick={handleLogout} aria-label="Đăng xuất">
                Đăng xuất
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)', pt: 10, pb: 14, mb: -8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, mb: 2, maxWidth: 640 }}>
            Hệ thống Thi Trực Tuyến Toàn Diện
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 400, maxWidth: 560, mb: 4 }}>
            Nền tảng kiểm tra và đánh giá năng lực hiện đại, tích hợp công nghệ chống gian lận và đa dạng loại câu hỏi.
          </Typography>
          {!isAuthenticated && (
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 700, '&:hover': { bgcolor: '#F1F5F9' } }}
              onClick={() => navigate('/register')}
            >
              Bắt đầu ngay
            </Button>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Grid container spacing={4}>
          {/* Danh sách kỳ thi - dữ liệu thật từ API */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', mr: 2 }} aria-hidden="true">
                    <QuizIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Kỳ thi đang mở</Typography>
                </Box>

                {loadingExams ? (
                  <Box role="status" aria-busy="true">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: 2, mb: 1.5 }} />
                    ))}
                  </Box>
                ) : exams.length === 0 ? (
                  <Typography color="text.secondary">Hiện chưa có kỳ thi nào được công bố.</Typography>
                ) : (
                  exams.map((exam) => (
                    <Box
                      key={exam.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        mb: 1.5,
                        borderRadius: 2,
                        border: '1px solid #E2E8F0',
                        '&:hover': { borderColor: 'primary.main', bgcolor: '#F8FAFF' },
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{exam.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Thời lượng: {exam.duration_minutes} phút
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(isAuthenticated ? examListPath : '/login')}
                        aria-label={`Xem kỳ thi ${exam.title}`}
                      >
                        Xem chi tiết
                      </Button>
                    </Box>
                  ))
                )}

                <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={() => navigate(isAuthenticated ? examListPath : '/login')}>
                  Xem tất cả kỳ thi &gt;&gt;&gt;
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Giới thiệu tính năng */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 4, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#ECFDF5', color: '#10B981', mr: 2 }} aria-hidden="true">
                    <SchoolIcon />
                  </Avatar>
                  <Typography sx={{ fontWeight: 700 }}>Đa dạng câu hỏi</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Hỗ trợ trắc nghiệm một/nhiều đáp án, đúng/sai, tự luận và nối cột.
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#FFFBEB', color: '#F59E0B', mr: 2 }} aria-hidden="true">
                    <ShieldIcon />
                  </Avatar>
                  <Typography sx={{ fontWeight: 700 }}>Chống gian lận</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Giám sát thi thời gian thực, phát hiện rời màn hình hoặc mở tab lạ.
                </Typography>
                {!isAuthenticated && (
                  <Chip
                    label="Đăng ký để trải nghiệm"
                    size="small"
                    color="warning"
                    variant="outlined"
                    onClick={() => navigate('/register')}
                    sx={{ mt: 2, cursor: 'pointer' }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
