import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, CircularProgress, Divider, Container, Fade } from '@mui/material';
import { CheckCircleOutlined, CancelOutlined, EmojiEvents, Home } from '@mui/icons-material';
import { gradingApi } from '../api/gradingApi';
import type { ExamResult } from '../api/gradingApi';

const ResultSummary: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // In a real app, this would come from AuthContext

  useEffect(() => {
    if (attemptId) {
      setLoading(true);
      setError(null);
      gradingApi
        .getExamResult(attemptId)
        .then(setResult)
        .catch(() => setError('Không thể tải kết quả. Vui lòng thử lại sau.'))
        .finally(() => setLoading(false));
    }
  }, [attemptId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: 'background.default' }} role="status" aria-busy="true">
        <CircularProgress size={60} thickness={4} color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 4 }} role="alert">
          <CancelOutlined color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Đã xảy ra lỗi
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/dashboard')} startIcon={<Home />}>
            Về trang chủ
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!result) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 4 }} role="status">
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Không tìm thấy kết quả.
          </Typography>
          <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate('/dashboard')} startIcon={<Home />}>
            Về trang chủ
          </Button>
        </Paper>
      </Container>
    );
  }

  const passed = result.percentage >= 50;

  return (
    <Box sx={{ minHeight: '100vh', pt: 8, pb: 8, bgcolor: '#F3F4F6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Paper elevation={24} sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 4, background: 'white' }}>
            <Box sx={{ mb: 3 }}>
              {passed ? (
                <EmojiEvents sx={{ fontSize: 80, color: '#F59E0B' }} aria-hidden="true" />
              ) : (
                <CancelOutlined sx={{ fontSize: 80, color: '#EF4444' }} aria-hidden="true" />
              )}
            </Box>
            <Typography variant="h3" gutterBottom color={passed ? '#10B981' : '#EF4444'} sx={{ fontWeight: 800 }}>
              {passed ? 'Chúc mừng!' : 'Chưa đạt'}
            </Typography>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1F2937' }}>
              Điểm số của bạn: {result.score} / {result.total_possible}
            </Typography>
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 4 }}>
              Tỷ lệ đúng: <span style={{ fontWeight: 'bold' }}>{result.percentage}%</span>
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-around', my: 4, p: 3, bgcolor: '#F9FAFB', borderRadius: 3 }}>
              <Box>
                <Typography variant="h3" sx={{ color: '#10B981', fontWeight: 'bold', mb: 1 }}>
                  {result.correct_count}
                </Typography>
                <Typography variant="body1" sx={{ color: '#4B5563', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleOutlined fontSize="small" /> Câu đúng
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="h3" sx={{ color: '#EF4444', fontWeight: 'bold', mb: 1 }}>
                  {result.incorrect_count}
                </Typography>
                <Typography variant="body1" sx={{ color: '#4B5563', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CancelOutlined fontSize="small" /> Câu sai
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 600, borderRadius: 2, textTransform: 'none', background: 'linear-gradient(to right, #4F46E5, #3B82F6)' }}
              onClick={() => navigate('/dashboard')}
              startIcon={<Home />}
              aria-label="Trở về màn hình chính"
            >
              Trở về màn hình chính
            </Button>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default ResultSummary;
