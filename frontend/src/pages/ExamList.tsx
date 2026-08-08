import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Grid, Skeleton, AppBar, Toolbar } from '@mui/material';
import { examApi, Exam } from '../api/examApi';
import { useNavigate } from 'react-router-dom';

const ExamList: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examApi.getPublishedExams();
        setExams(data);
      } catch (error) {
        console.error('Failed to fetch exams', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Hệ thống thi trắc nghiệm
          </Typography>
          <Button color="inherit" onClick={() => {
            localStorage.removeItem('access_token');
            navigate('/login');
          }}>Đăng xuất</Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Các bài thi hiện có
        </Typography>
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((n) => (
              <Grid item xs={12} md={4} key={n}>
                <Skeleton variant="rectangular" height={200} />
              </Grid>
            ))}
          </Grid>
        ) : exams.length === 0 ? (
          <Typography>Không có bài thi nào.</Typography>
        ) : (
          <Grid container spacing={3}>
            {exams.map((exam) => (
              <Grid item xs={12} md={4} key={exam.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="div" gutterBottom color="primary">
                      {exam.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {exam.description}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Thời gian: {exam.duration_minutes} phút
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      Số lần làm tối đa: {exam.max_attempts}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button variant="contained" fullWidth onClick={() => navigate(`/exam/${exam.id}`)}>
                      Tham gia thi
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ExamList;
