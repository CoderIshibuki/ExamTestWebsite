import {
  Box, Typography, Container, Toolbar, Skeleton, Grid, Card, CardContent,
  Button, Chip, Avatar, AppBar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import {
  School, Security, Speed, BarChart, PlayArrow,
  CheckCircle, AccessTime, ArrowForward,
} from '@mui/icons-material';
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
        if (mounted) setExams(data);
      })
      .catch((err) => console.error('Không thể tải danh sách kỳ thi:', err))
      .finally(() => {
        if (mounted) setLoadingExams(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleExamClick = (examId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'student' || user?.role === 'admin') {
      navigate(`/student/exam/${examId}`);
    } else {
      navigate('/teacher/exams');
    }
  };

  const features = [
    {
      icon: <Security sx={{ fontSize: 36, color: '#2563EB' }} />,
      title: 'Giám sát AI & WebRTC',
      desc: 'Giám sát webcam theo thời gian thực, phát hiện chuyển tab, rời khỏi màn hình và cảnh báo gian lận tức thì.',
      bgColor: '#EFF6FF',
    },
    {
      icon: <School sx={{ fontSize: 36, color: '#10B981' }} />,
      title: 'Đa dạng dạng câu hỏi',
      desc: 'Hỗ trợ trắc nghiệm 1 đáp án, nhiều đáp án, đúng/sai, nối cột và tự luận (gõ text hoặc chụp ảnh bài làm).',
      bgColor: '#ECFDF5',
    },
    {
      icon: <Speed sx={{ fontSize: 36, color: '#F59E0B' }} />,
      title: 'Chấm điểm tức thì',
      desc: 'Hệ thống tự động chấm trắc nghiệm ngay khi nộp bài và hỗ trợ giáo viên chấm tay câu tự luận chuyên nghiệp.',
      bgColor: '#FFFBEB',
    },
    {
      icon: <BarChart sx={{ fontSize: 36, color: '#8B5CF6' }} />,
      title: 'Thống kê & Báo cáo',
      desc: 'Phân tích điểm số chi tiết, tỷ lệ đạt/chưa đạt theo môn học và biểu đồ đánh giá năng lực học sinh.',
      bgColor: '#F5F3FF',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', color: '#1E293B', display: 'flex', flexDirection: 'column' }}>
      {/* Header / Navbar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #E2E8F0' }}>
        <Toolbar sx={{ maxWidth: 1240, mx: 'auto', width: '100%', display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: 24 }}>
              <Box sx={{ width: 11, height: 11, bgcolor: '#E53935', borderRadius: '3px' }} />
              <Box sx={{ width: 11, height: 11, bgcolor: '#2563EB', borderRadius: '3px' }} />
              <Box sx={{ width: 11, height: 11, bgcolor: '#FDD835', borderRadius: '3px' }} />
              <Box sx={{ width: 11, height: 11, bgcolor: '#10B981', borderRadius: '3px' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>
              exam<span style={{ color: '#2563EB' }}>system</span>
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
            <Button
              color="inherit"
              onClick={() => navigate(isAuthenticated ? (user?.role === 'teacher' ? '/teacher/exams' : user?.role === 'admin' ? '/admin/exams' : '/student/exams') : '/login')}
              sx={{ color: '#475569', fontWeight: 600, textTransform: 'none' }}
            >
              Kỳ thi
            </Button>
            {isAuthenticated && user?.role === 'student' && (
              <Button
                color="inherit"
                onClick={() => navigate('/student/results')}
                sx={{ color: '#475569', fontWeight: 600, textTransform: 'none' }}
              >
                Kết quả của tôi
              </Button>
            )}
            {isAuthenticated && (user?.role === 'teacher' || user?.role === 'admin') && (
              <Button
                color="inherit"
                onClick={() => navigate(user?.role === 'teacher' ? '/teacher/exams' : '/admin/dashboard')}
                sx={{ color: '#475569', fontWeight: 600, textTransform: 'none' }}
              >
                Quản trị & Giảng dạy
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {!isAuthenticated ? (
              <>
                <Button
                  variant="text"
                  onClick={() => navigate('/login')}
                  sx={{ color: '#2563EB', fontWeight: 600, textTransform: 'none', px: 2 }}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/register')}
                  sx={{ bgcolor: '#2563EB', fontWeight: 600, textTransform: 'none', borderRadius: 2, px: 2.5, '&:hover': { bgcolor: '#1D4ED8' } }}
                >
                  Đăng ký
                </Button>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                  sx={{ borderColor: '#E2E8F0', color: '#1E293B', fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
                >
                  {user?.full_name || user?.username}
                </Button>
                <Button
                  variant="text"
                  color="error"
                  onClick={logout}
                  sx={{ fontWeight: 600, textTransform: 'none' }}
                >
                  Đăng xuất
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: '#0F172A',
          color: '#ffffff',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Chip
            icon={<CheckCircle sx={{ color: '#38BDF8 !important' }} />}
            label="Hệ thống Khảo thí & Giám sát Trực tuyến Chuẩn Quốc tế"
            sx={{ bgcolor: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', fontWeight: 600, mb: 3, px: 1, border: '1px solid rgba(56, 189, 248, 0.25)' }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2.4rem', sm: '3.2rem', md: '4rem' },
              lineHeight: 1.15,
              mb: 2.5,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #93C5FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Đánh Giá Năng Lực Toàn Diện &<br />Giám Sát AI Chống Gian Lận
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#94A3B8',
              maxWidth: 760,
              mx: 'auto',
              mb: 5,
              lineHeight: 1.6,
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            Nền tảng kiểm tra trực tuyến hiện đại hỗ trợ đầy đủ các dạng câu hỏi, tự động chấm điểm,
            và công nghệ truyền video WebRTC thời gian thực cho giám thị.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={() => navigate(isAuthenticated ? (user?.role === 'student' ? '/student/exams' : '/dashboard') : '/login')}
              sx={{
                bgcolor: '#2563EB',
                color: '#fff',
                fontWeight: 700,
                px: 4,
                py: 1.6,
                fontSize: '1.05rem',
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5)',
                '&:hover': { bgcolor: '#1D4ED8' },
              }}
            >
              {isAuthenticated ? 'Vào danh sách kỳ thi' : 'Bắt đầu làm bài ngay'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                const el = document.getElementById('features-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                color: '#E2E8F0',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                fontWeight: 600,
                px: 3.5,
                py: 1.6,
                fontSize: '1.05rem',
                borderRadius: 2.5,
                textTransform: 'none',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255, 255, 255, 0.05)' },
              }}
            >
              Khám phá tính năng
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Kỳ thi đang mở */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
              Kỳ thi đang mở
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Các bài thi được công bố và sẵn sàng để học sinh tham gia làm bài.
            </Typography>
          </Box>
          <Button
            variant="text"
            endIcon={<ArrowForward />}
            onClick={() => navigate(isAuthenticated ? '/student/exams' : '/login')}
            sx={{ fontWeight: 700, color: '#2563EB', textTransform: 'none' }}
          >
            Xem tất cả
          </Button>
        </Box>

        {loadingExams ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : exams.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #E2E8F0' }}>
            <School sx={{ fontSize: 48, color: '#94A3B8', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
              Hiện chưa có đề thi nào được công bố
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Giáo viên sẽ cập nhật các bài thi mới trong thời gian sớm nhất.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {exams.map((exam) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={exam.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3.5,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: '#2563EB',
                      boxShadow: '0 12px 24px -6px rgba(37,99,235,0.12)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label="ĐANG MỞ"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.5px' }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                        <AccessTime sx={{ fontSize: 16 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{exam.duration_minutes} phút</Typography>
                      </Box>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5, minHeight: 48, lineHeight: 1.3 }}>
                      {exam.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5, minHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {exam.description || 'Bài kiểm tra đánh giá kiến thức.'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`Tối đa: ${exam.max_attempts} lần thi`} size="small" variant="outlined" sx={{ color: '#64748B', borderColor: '#E2E8F0' }} />
                      <Chip label={`Ngưỡng đạt: ${exam.passing_score ?? 50}%`} size="small" variant="outlined" sx={{ color: '#64748B', borderColor: '#E2E8F0' }} />
                    </Box>
                  </CardContent>

                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleExamClick(exam.id)}
                      sx={{
                        bgcolor: '#2563EB',
                        fontWeight: 700,
                        py: 1.2,
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#1D4ED8' },
                      }}
                    >
                      {isAuthenticated ? 'Vào thi ngay' : 'Đăng nhập để thi'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Features Section */}
      <Box id="features-section" sx={{ bgcolor: '#ffffff', py: 10, borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5 }}>
              Tính năng Vượt trội của Hệ thống
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto' }}>
              Được thiết kế toàn diện nhằm phục vụ nhu cầu khảo thí cho các cơ sở giáo dục, giảng viên và học sinh.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feat, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                <Card
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: 3.5,
                    border: '1px solid #E2E8F0',
                    boxShadow: 'none',
                    bgcolor: '#FAFBFD',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#93C5FD', bgcolor: '#ffffff', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' },
                  }}
                >
                  <Avatar sx={{ width: 56, height: 56, bgcolor: feat.bgColor, mb: 2.5 }}>
                    {feat.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0F172A' }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                    {feat.desc}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#0F172A', color: '#94A3B8', py: 6, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff' }}>
                exam<span style={{ color: '#38BDF8' }}>system</span>
              </Typography>
            </Box>
            <Typography variant="body2">
              © {new Date().getFullYear()} ExamSystem Platform. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

