import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Skeleton,
  AppBar, Toolbar, Container, Chip, Paper, TextField, InputAdornment,
} from '@mui/material';
import { PlayArrow, AccessTime, Autorenew, ErrorOutlined, Search, ArrowBack, AssignmentTurnedIn } from '@mui/icons-material';
import { examApi } from '../api/examApi';
import type { Exam } from '../api/examApi';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ExamList: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

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

  const filteredExams = exams.filter((e) =>
    (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Top Floating Glassmorphic Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ maxWidth: 1280, mx: 'auto', width: '100%', display: 'flex', justifyContent: 'space-between', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37,99,235,0.25)',
              }}
            >
              <Typography sx={{ color: '#fff', fontSize: '1rem', fontWeight: 900 }}>✦</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
              Exam<span style={{ color: '#2563EB' }}>System</span>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="text"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
              sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}
            >
              Trang cá nhân
            </Button>
            <Button
              variant="text"
              startIcon={<AssignmentTurnedIn />}
              onClick={() => navigate('/student/results')}
              sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}
            >
              Kết quả thi
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={logout}
              sx={{ color: '#64748B', borderColor: '#E2E8F0', textTransform: 'none', borderRadius: 2 }}
            >
              Đăng xuất
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Container */}
      <Container maxWidth="lg" sx={{ py: 5 }}>
        {/* Clean Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            Danh sách Kỳ thi đang mở
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Xem danh sách các đề thi được công bố và chọn bài thi phù hợp để bắt đầu làm bài.
          </Typography>
        </Box>

        {/* Search Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 4,
            borderRadius: 3,
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <TextField
            fullWidth
            placeholder="Tìm kiếm đề thi theo tên môn, mã đề hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
              },
            }}
            variant="outlined"
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
          />
        </Paper>

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((n) => (
              <Grid size={{ xs: 12, md: 4 }} key={n}>
                <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }} role="alert">
            <ErrorOutlined color="error" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" color="error">{error}</Typography>
            <Button variant="contained" sx={{ mt: 3, borderRadius: 2, textTransform: 'none' }} onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </Paper>
        ) : filteredExams.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #E2E8F0' }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'Không tìm thấy đề thi nào khớp với từ khoá.' : 'Hiện chưa có bài thi nào được mở.'}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredExams.map((exam) => (
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
                      transform: 'translateY(-3px)',
                      borderColor: '#2563EB',
                      boxShadow: '0 10px 20px -5px rgba(37,99,235,0.12)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip label="Đang mở" color="success" size="small" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                        <AccessTime sx={{ fontSize: 16 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{exam.duration_minutes} phút</Typography>
                      </Box>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5, minHeight: 48, lineHeight: 1.3 }}>
                      {exam.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5, minHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {exam.description || 'Bài kiểm tra đánh giá kiến thức trực tuyến.'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<Autorenew sx={{ fontSize: 14 }} />}
                        label={`Tối đa: ${exam.max_attempts} lần`}
                        size="small"
                        variant="outlined"
                        sx={{ color: '#64748B', borderColor: '#E2E8F0' }}
                      />
                      <Chip
                        label={`Ngưỡng đạt: ${exam.passing_score ?? 50}%`}
                        size="small"
                        variant="outlined"
                        sx={{ color: '#64748B', borderColor: '#E2E8F0' }}
                      />
                    </Box>
                  </CardContent>

                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<PlayArrow />}
                      onClick={() => navigate(`/student/exam/${exam.id}`)}
                      sx={{
                        bgcolor: '#2563EB',
                        fontWeight: 700,
                        py: 1.2,
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#1D4ED8' },
                      }}
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

