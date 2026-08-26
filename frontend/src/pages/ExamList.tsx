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
      {/* Top Navbar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #E2E8F0' }}>
        <Toolbar sx={{ maxWidth: 1200, mx: 'auto', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
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

      {/* Header Banner */}
      <Box sx={{ bgcolor: '#1E40AF', pt: 6, pb: 10, color: '#ffffff' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Danh sách Kỳ thi đang mở
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            Chọn đề thi phù hợp và bắt đầu làm bài. Hãy kiểm tra camera và kết nối mạng trước khi thi.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4, pb: 8 }}>
        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm đề thi theo tên hoặc mô tả..."
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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

