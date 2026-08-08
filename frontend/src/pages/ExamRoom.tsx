import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Paper, Grid } from '@mui/material';
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
      navigate(`/result/${examId}`);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      setStatus('error');
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
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress />
        <Typography>Đang chuẩn bị phòng thi...</Typography>
      </Box>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={1} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0 }}>
        <Timer timeLeft={calculateTimeLeft()} isWarning={isWarning} formattedTime={formattedTime} />
        <Typography variant="h6">
          Câu hỏi {state.currentQuestionIndex + 1} / {state.totalQuestions}
        </Typography>
        <Button variant="contained" color="secondary" onClick={handleFinish} disabled={state.status === 'submitting'}>
          {state.status === 'submitting' ? 'Đang nộp...' : 'Nộp bài'}
        </Button>
      </Paper>

      <Box sx={{ flexGrow: 1, p: 3, display: 'flex', justifyContent: 'center' }}>
        <Grid container spacing={3} sx={{ maxWidth: 1200 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            {currentQuestion ? (
              <QuestionPanel
                question={currentQuestion}
                selectedAnswer={state.answers[currentQuestion.id] || ''}
                onSelectAnswer={handleAnswerSelect}
                questionIndex={state.currentQuestionIndex}
                totalQuestions={state.totalQuestions}
              />
            ) : (
              <Typography>Đang tải câu hỏi...</Typography>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button disabled={state.currentQuestionIndex === 0} onClick={prevQuestion}>Câu trước</Button>
              <Button disabled={state.currentQuestionIndex === state.totalQuestions - 1} onClick={nextQuestion}>Câu tiếp</Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Danh sách câu hỏi</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {state.questions.map((q, idx) => (
                  <Button
                    key={q.id}
                    variant={state.answers[q.id] ? 'contained' : 'outlined'}
                    color={state.currentQuestionIndex === idx ? 'primary' : state.answers[q.id] ? 'success' : 'inherit'}
                    sx={{ minWidth: 40, borderRadius: 2 }}
                    onClick={() => {
                        const distance = idx - state.currentQuestionIndex;
                        if (distance > 0) {
                            for(let i = 0; i < distance; i++) nextQuestion();
                        } else {
                            for(let i = 0; i < Math.abs(distance); i++) prevQuestion();
                        }
                    }}
                  >
                    {idx + 1}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Paper elevation={3} sx={{ p: 1, display: 'flex', justifyContent: 'space-between', borderRadius: 0, position: 'fixed', bottom: 0, width: '100%', zIndex: 10 }}>
        <ProctoringStatus isActive={isActive} violationCount={violationCount} />
      </Paper>
    </Box>
  );
};

export default ExamRoom;
