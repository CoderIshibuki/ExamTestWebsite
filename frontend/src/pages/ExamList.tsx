import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Skeleton,
  Chip, Paper, TextField, InputAdornment,
} from '@mui/material';
import { PlayArrow, AccessTime, Autorenew, ErrorOutlined, Search } from '@mui/icons-material';
import { examApi } from '../api/examApi';
import type { Exam } from '../api/examApi';
import { useNavigate } from 'react-router-dom';

const ExamList: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredExams = exams.filter((e) =>
    (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {/* Clean Header */}
      <Box sx={{ mb: 3.5 }}>
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
          mb: 3.5,
          borderRadius: 1.5,
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
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#F8FAFC' } }}
        />
      </Paper>

      {loading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map((n) => (
            <Grid size={{ xs: 12, md: 4 }} key={n}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1.5 }} />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 1.5 }} role="alert">
          <ErrorOutlined color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" color="error">{error}</Typography>
          <Button variant="contained" sx={{ mt: 2.5, borderRadius: 1.5, textTransform: 'none' }} onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </Paper>
      ) : filteredExams.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 1.5, bgcolor: '#ffffff', border: '1px solid #E2E8F0' }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'Không tìm thấy đề thi nào khớp với từ khoá.' : 'Hiện chưa có bài thi nào được mở.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredExams.map((exam) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={exam.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 1.5,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: '#2563EB',
                    boxShadow: '0 8px 16px -2px rgba(37,99,235,0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Chip label="Đang mở" color="success" size="small" sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                      <AccessTime sx={{ fontSize: 15 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{exam.duration_minutes} phút</Typography>
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 1, minHeight: 44, fontSize: '1rem', lineHeight: 1.3 }}>
                    {exam.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 2, minHeight: 36, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontSize: '0.82rem' }}>
                    {exam.description || 'Bài kiểm tra đánh giá kiến thức trực tuyến.'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<Autorenew sx={{ fontSize: 13 }} />}
                      label={`Tối đa: ${exam.max_attempts} lần`}
                      size="small"
                      variant="outlined"
                      sx={{ color: '#64748B', borderColor: '#E2E8F0', borderRadius: 1 }}
                    />
                    <Chip
                      label={`Ngưỡng đạt: ${exam.passing_score ?? 50}%`}
                      size="small"
                      variant="outlined"
                      sx={{ color: '#64748B', borderColor: '#E2E8F0', borderRadius: 1 }}
                    />
                  </Box>
                </CardContent>

                <Box sx={{ p: 2.5, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PlayArrow />}
                    onClick={() => navigate(`/student/exam/${exam.id}`)}
                    sx={{
                      bgcolor: '#2563EB',
                      fontWeight: 700,
                      py: 1,
                      borderRadius: 1.5,
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
    </Box>
  );
};

export default ExamList;

