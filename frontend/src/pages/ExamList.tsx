import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Skeleton,
  AppBar,
  Toolbar,
  Container,
  Chip,
  Avatar,
  Paper
} from '@mui/material';
import { PlayArrow, AccessTime, Autorenew, ErrorOutline } from '@mui/icons-material';
import { examApi } from '../api/examApi';
import type { Exam } from '../api/examApi';
import { useNavigate } from 'react-router-dom';

const ExamList: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await examApi.getPublishedExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to fetch exams', err);
        setError('Không thể tải danh sách bài thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #E2E8F0' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 700 }} aria-label="Antigravity Exams Logo">
            Antigravity<span style={{color: '#10B981'}}>Exams</span>
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            aria-label="Đăng xuất"
            sx={{ color: 'text.secondary', borderColor: '#E2E8F0' }}
            onClick={() => {
              localStorage.removeItem('access_token');
              navigate('/login');
            }}
          >
            Đăng xuất
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ 
        background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)', 
        pt: 8, pb: 12, mb: -6 
      }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 2 }} aria-label="Chào mừng trở lại">
            Chào mừng trở lại!
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
            Dưới đây là danh sách các bài thi đang mở. Chúc bạn hoàn thành tốt.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {loading ? (
          <Grid container spacing={4} role="status" aria-busy="true">
            {[1, 2, 3].map((n) => (
              <Grid size={{ xs: 12, md: 4 }} key={n}>
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 4 }} />
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }} role="alert">
            <ErrorOutline color="error" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" color="error">{error}</Typography>
            <Button variant="contained" sx={{ mt: 3 }} onClick={() => window.location.reload()} aria-label="Thử lại">
              Thử lại
            </Button>
          </Paper>
        ) : exams.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }} role="status">
            <Typography variant="h6" color="text.secondary">Chưa có bài thi nào được mở.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={4} role="list" aria-label="Danh sách bài thi">
            {exams.map((exam) => (
              <Grid size={{ xs: 12, md: 4 }} key={exam.id} role="listitem">
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
                    borderRadius: 4,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 48, height: 48 }} aria-hidden="true">
                        {exam.title.charAt(0)}
                      </Avatar>
                      <Chip label="Đang mở" color="success" size="small" sx={{ fontWeight: 600 }} />
                    </Box>
                    <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {exam.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {exam.description || 'Không có mô tả cho bài thi này.'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <AccessTime sx={{ fontSize: 18, mr: 0.5 }} aria-hidden="true" />
                        <Typography variant="body2" aria-label={`Thời gian ${exam.duration_minutes} phút`}>{exam.duration_minutes} phút</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <Autorenew sx={{ fontSize: 18, mr: 0.5 }} aria-hidden="true" />
                        <Typography variant="body2" aria-label={`Tối đa ${exam.max_attempts} lần thử`}>Tối đa {exam.max_attempts} lần</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<PlayArrow />}
                      onClick={() => navigate(`/exam/${exam.id}`)}
                      aria-label={`Bắt đầu bài thi ${exam.title}`}
                    >
                      Bắt đầu làm bài
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default ExamList;
