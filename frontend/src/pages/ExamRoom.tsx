import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Paper, Grid, Container } from '@mui/material';
import { ErrorOutlined } from '@mui/icons-material';
import { useTimer } from '../hooks/useTimer';
import { useProctoring } from '../hooks/useProctoring';
import { useExamContext } from '../context/ExamContext';
import QuestionPanel from '../components/QuestionPanel';
import Timer from '../components/Timer';
import ProctoringStatus from '../components/ProctoringStatus';
import { examApi } from '../api/examApi';

const ExamRoom: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { state, setStatus, setQuestions, setAnswer, nextQuestion, prevQuestion, setExamId, setAttemptId } = useExamContext();
  const { isActive, violationCount } = useProctoring(examId || '', state.attemptId || '');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const initExam = useCallback(async () => {
    try {
      setStatus('joining');
      setExamId(examId || '');
      
      const [questions, attempt] = await Promise.all([
        examApi.getExamQuestions(examId || ''),
        examApi.startExam(examId || '')
      ]);
      
      setQuestions(questions as any);
      setAttemptId(attempt.id);
      setExpiresAt(new Date(attempt.expires_at));
      setStatus('in_progress');
    } catch (err) {
      console.error('Failed to initialize exam:', err);
      setStatus('error');
    }
  }, [examId, setStatus, setExamId, setQuestions, setAttemptId]);

  useEffect(() => {
    if (examId) {
      initExam();
    }
  }, [examId, initExam]);

  const submitExam = useCallback(async () => {
    if (!state.attemptId) return;
    setStatus('submitting');
    try {
      await examApi.submitExam(state.attemptId);
      navigate(`/result/${state.attemptId}`);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      setStatus('error');
      alert('Không thể nộp bài. Vui lòng thử lại!');
    }
  }, [state.attemptId, setStatus, navigate, examId]);

  // Calculate remaining time
  const calculateTimeLeft = () => {
    if (!expiresAt) return 0;
    const now = new Date();
    const diff = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
    return diff > 0 ? diff : 0;
  };

  const { formattedTime, isWarning } = useTimer(calculateTimeLeft(), submitExam);

  const handleAnswerSelect = async (answer: string) => {
    const currentQ = state.questions[state.currentQuestionIndex];
    if (currentQ && state.attemptId) {
      setAnswer(currentQ.id, answer);
      try {
        await examApi.saveAnswer(state.attemptId, currentQ.id, answer);
      } catch (err) {
        console.error('Failed to save answer:', err);
      }
    }
  };

  const handleFinish = () => {
    if (window.confirm('Bạn có chắc chắn muốn nộp bài?')) {
      submitExam();
    }
  };

  if (state.status === 'joining' || state.status === 'idle') {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 2, bgcolor: 'background.default' }} role="status" aria-busy="true">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">Đang chuẩn bị phòng thi...</Typography>
      </Box>
    );
  }

  if (state.status === 'error') {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: 'background.default' }}>
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 4, maxWidth: 400 }}>
          <ErrorOutlined color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>Đã xảy ra lỗi</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Không thể tải hoặc nộp bài thi. Vui lòng kiểm tra lại kết nối.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/exams')}>
            Quay lại danh sách
          </Button>
        </Paper>
      </Box>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', display: 'flex', flexDirection: 'column', pb: 8 }}>
      <Paper elevation={2} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0, position: 'sticky', top: 0, zIndex: 1100 }}>
        <Timer timeLeft={calculateTimeLeft()} isWarning={isWarning} formattedTime={formattedTime} />
        <Typography variant="h6" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
          Câu hỏi {state.currentQuestionIndex + 1} / {state.totalQuestions}
        </Typography>
        <Button variant="contained" color="secondary" onClick={handleFinish} disabled={state.status === 'submitting'} aria-label="Nộp bài">
          {state.status === 'submitting' ? 'Đang nộp...' : 'Nộp bài'}
        </Button>
      </Paper>

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 4 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 2, lg: 1 } }}>
            {currentQuestion ? (
              <QuestionPanel
                question={currentQuestion}
                selectedAnswer={state.answers[currentQuestion.id] || ''}
                onSelectAnswer={handleAnswerSelect}
                questionIndex={state.currentQuestionIndex}
                totalQuestions={state.totalQuestions}
              />
            ) : (
              <Box sx={{ textAlign: 'center', p: 4 }}><Typography>Đang tải câu hỏi...</Typography></Box>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" disabled={state.currentQuestionIndex === 0} onClick={prevQuestion} aria-label="Câu trước">Câu trước</Button>
              <Button variant="outlined" disabled={state.currentQuestionIndex === state.totalQuestions - 1} onClick={nextQuestion} aria-label="Câu tiếp theo">Câu tiếp</Button>
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 1, lg: 2 } }}>
            <Paper sx={{ p: 3, borderRadius: 3, position: { lg: 'sticky' }, top: 100 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Danh sách câu hỏi</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: 1.5, mt: 2 }} role="group" aria-label="Điều hướng câu hỏi">
                {state.questions.map((q, idx) => (
                  <Button
                    key={q.id}
                    variant={state.answers[q.id] ? 'contained' : 'outlined'}
                    color={state.currentQuestionIndex === idx ? 'primary' : state.answers[q.id] ? 'success' : 'inherit'}
                    sx={{ minWidth: 0, height: 48, borderRadius: 2, fontWeight: 600, p: 0 }}
                    onClick={() => {
                        const distance = idx - state.currentQuestionIndex;
                        if (distance > 0) {
                            for(let i = 0; i < distance; i++) nextQuestion();
                        } else {
                            for(let i = 0; i < Math.abs(distance); i++) prevQuestion();
                        }
                    }}
                    aria-label={`Đi tới câu hỏi ${idx + 1}`}
                    aria-current={state.currentQuestionIndex === idx ? 'true' : 'false'}
                  >
                    {idx + 1}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Paper elevation={4} sx={{ p: 1.5, display: 'flex', justifyContent: 'center', borderRadius: 0, position: 'fixed', bottom: 0, width: '100%', zIndex: 1200, bgcolor: 'white' }}>
        <ProctoringStatus isActive={isActive} violationCount={violationCount} />
      </Paper>
    </Box>
  );
};

export default ExamRoom;
