import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, CircularProgress, Divider } from '@mui/material';
import { gradingApi } from '../api/gradingApi';
import type { ExamResult } from '../api/gradingApi';

const ResultSummary: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = 'current_user_id';

  useEffect(() => {
    if (examId) {
      gradingApi
        .getExamResult(examId, userId)
        .then(setResult)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [examId]);

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!result) {
    return <Typography sx={{ p: 3 }}>Không tìm thấy kết quả.</Typography>;
  }

  const passed = result.percentage >= 50;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={4}
        sx={{ p: 5, maxWidth: 600, width: '100%', textAlign: 'center', borderRadius: 3 }}
      >
        <Typography
          variant="h3"
          gutterBottom
          color={passed ? 'success.main' : 'error.main'} sx={{ fontWeight: "bold" }}
        >
          {passed ? 'Chúc mừng!' : 'Chưa đạt'}
        </Typography>
        <Typography variant="h5" gutterBottom>
          Điểm số của bạn: {result.score} / {result.total_possible}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Tỷ lệ đúng: {result.percentage}%
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-around', my: 4 }}>
          <Box>
            <Typography variant="h4" color="success.main">
              {result.correct_count}
            </Typography>
            <Typography>Câu đúng</Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="error.main">
              {result.incorrect_count}
            </Typography>
            <Typography>Câu sai</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Button variant="contained" size="large" onClick={() => navigate('/dashboard')}>
          Trở về trang chủ
        </Button>
      </Paper>
    </Box>
  );
};

export default ResultSummary;
