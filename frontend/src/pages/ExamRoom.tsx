import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Paper, Grid } from '@mui/material';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTimer } from '../hooks/useTimer';
import { useProctoring } from '../hooks/useProctoring';
import { useExamContext } from '../context/ExamContext';
import QuestionPanel from '../components/QuestionPanel';
import Timer from '../components/Timer';
import ProctoringStatus from '../components/ProctoringStatus';
import WebSocketStatus from '../components/WebSocketStatus';

const ExamRoom: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token') || '';
  const userId = 'current_user_id';
  
  const { state, setStatus, setQuestions, setAnswer, nextQuestion, prevQuestion, setExamId } = useExamContext();
  const { isActive, violationCount } = useProctoring(examId || '', userId);

  const handleExamSubmit = useCallback(() => {
    navigate(`/result/${examId}`);
  }, [examId, navigate]);

  const { status: wsStatus, joinExam, startExam, submitAnswer, submitExam } = useWebSocket({
    examId: examId || '',
    token,
    onQuestion: (data) => {
      if (Array.isArray(data)) {
        setQuestions(data);
      }
    },
    onAnswerSaved: (data) => {
      // confirm answer saved
    },
    onExamSubmitted: handleExamSubmit,
    onError: (err) => {
      console.error('WS Error:', err);
      setStatus('error');
    }
  });

  const { formattedTime, isWarning } = useTimer(60, () => {
    submitExam();
  });

  useEffect(() => {
    if (examId) {
      setExamId(examId);
      setStatus('joining');
      joinExam();
    }
  }, [examId, joinExam, setExamId, setStatus]);

  useEffect(() => {
    if (wsStatus === 'connected' && state.status === 'joining') {
      startExam();
      setStatus('in_progress');
    }
  }, [wsStatus, state.status, startExam, setStatus]);

  const handleAnswerSelect = (answer: string) => {
    const currentQ = state.questions[state.currentQuestionIndex];
    if (currentQ) {
      setAnswer(currentQ.id, answer);
      submitAnswer(currentQ.id, answer);
    }
  };

  const handleFinish = () => {
    setStatus('submitting');
    submitExam();
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
      <Paper elevation={3} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0 }}>
        <Timer timeLeft={60} isWarning={isWarning} formattedTime={formattedTime} />
        <Typography variant="h6">
          Câu hỏi {state.currentQuestionIndex + 1} / {state.totalQuestions}
        </Typography>
        <Button variant="contained" color="secondary" onClick={handleFinish}>
          Nộp bài
        </Button>
      </Paper>

      <Box sx={{ flexGrow: 1, p: 3, display: 'flex', justifyContent: 'center' }}>
        <Grid container spacing={3} maxWidth={1200}>
          <Grid item xs={12} md={8}>
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
              <Button disabled={state.currentQuestionIndex === 0} onClick={prevQuestion}>
                Câu trước
              </Button>
              <Button disabled={state.currentQuestionIndex === state.totalQuestions - 1} onClick={nextQuestion}>
                Câu tiếp
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Danh sách câu hỏi</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {state.questions.map((q, idx) => (
                  <Button 
                    key={q.id} 
                    variant={state.answers[q.id] ? "contained" : "outlined"}
                    color={state.currentQuestionIndex === idx ? "primary" : (state.answers[q.id] ? "success" : "inherit")}
                    sx={{ minWidth: 40 }}
                  >
                    {idx + 1}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Paper elevation={3} sx={{ p: 1, display: 'flex', justifyContent: 'space-between', borderRadius: 0 }}>
        <ProctoringStatus isActive={isActive} violationCount={violationCount} />
        <WebSocketStatus status={wsStatus} />
      </Paper>
    </Box>
  );
};

export default ExamRoom;
