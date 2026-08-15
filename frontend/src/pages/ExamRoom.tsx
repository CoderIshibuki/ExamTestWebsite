import React, { useEffect, useCallback, useState, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Paper, Grid, Container } from '@mui/material';
import { ErrorOutlined } from '@mui/icons-material';
import { useTimer } from '../hooks/useTimer';
import { useProctoring } from '../hooks/useProctoring';
import { useProctorStreamBroadcaster } from '../hooks/useProctorStreamBroadcaster';
import { useExamContext } from '../context/ExamContext';
import type { AnswerValue, Question } from '../context/ExamContext';
import QuestionPanel from '../components/QuestionPanel';
import Timer from '../components/Timer';
import ProctoringStatus from '../components/ProctoringStatus';
import { examApi } from '../api/examApi';
import { AuthContext } from '../context/AuthContext';

const ExamRoom: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  
  const { state, setStatus, setQuestions, setAnswer, nextQuestion, prevQuestion, goToQuestion, setExamId, setAttemptId } = useExamContext();
  const { isActive, violationCount, videoRef, cameraReady, cameraError, cameraStream } = useProctoring(examId || '', state.attemptId || '');
  useProctorStreamBroadcaster(examId || '', cameraStream);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const initExam = useCallback(async () => {
    try {
      setStatus('joining');
      setExamId(examId || '');
      
      const [rawQuestions, attempt] = await Promise.all([
        examApi.getExamQuestions(examId || ''),
        examApi.startExam(examId || '')
      ]);

      // Chuyển shape backend (ExamQuestionDetail) sang shape dùng trong phòng thi (Question).
      // Với câu nối cột: quy ước option id bắt đầu "L_" là cột trái, "R_" là cột phải.
      const questions: Question[] = rawQuestions.map((q) => {
        const isMatching = q.type === 'matching';
        return {
          id: q.question_id,
          content: q.content?.text || '',
          type: q.type,
          options: isMatching ? [] : q.options.map((o) => ({ id: o.id, text: o.text })),
          matching: isMatching
            ? {
                left: q.options.filter((o) => o.id.startsWith('L_')).map((o) => ({ id: o.id, text: o.text })),
                right: q.options.filter((o) => o.id.startsWith('R_')).map((o) => ({ id: o.id, text: o.text })),
              }
            : undefined,
          essayMode: q.type === 'essay' ? 'both' : undefined,
        };
      });

      setQuestions(questions);
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
      navigate(`/${user?.role}/result/${state.attemptId}`);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      setStatus('error');
      alert('Không thể nộp bài. Vui lòng thử lại!');
    }
  }, [state.attemptId, setStatus, navigate, examId]);

  // Số giây còn lại tính từ thời điểm hết hạn (expires_at), chỉ cần tính khi
  // expiresAt thay đổi (tức là khi bài thi vừa load xong), không tính lại mỗi render.
  const initialSecondsLeft = useMemo(() => {
    if (!expiresAt) return 0;
    const diff = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  }, [expiresAt]);

  const { timeLeft, formattedTime, isWarning } = useTimer(initialSecondsLeft, submitExam);

  const handleAnswerSelect = async (answer: AnswerValue) => {
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
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, maxWidth: 400, border: '1px solid', borderColor: 'divider' }}>
          <ErrorOutlined color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>Đã xảy ra lỗi</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Không thể tải hoặc nộp bài thi. Vui lòng kiểm tra lại kết nối.
          </Typography>
          <Button variant="contained" onClick={() => navigate(`/${user?.role}/exams`)}>
            Quay lại danh sách
          </Button>
        </Paper>
      </Box>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', display: 'flex', flexDirection: 'column', pb: 8 }}>
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, zIndex: 1100, bgcolor: 'white' }}>
        <Timer timeLeft={timeLeft} isWarning={isWarning} formattedTime={formattedTime} />
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
                selectedAnswer={state.answers[currentQuestion.id] ?? (currentQuestion.type === 'multiple_select' || currentQuestion.type === 'matching' ? [] : '')}
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
                {state.questions.map((q, idx) => {
                  const ans = state.answers[q.id];
                  const answered = Array.isArray(ans) ? ans.length > 0 : !!ans;
                  return (
                  <Button
                    key={q.id}
                    variant={answered ? 'contained' : 'outlined'}
                    color={state.currentQuestionIndex === idx ? 'primary' : answered ? 'success' : 'inherit'}
                    sx={{ minWidth: 0, height: 48, borderRadius: 2, fontWeight: 600, p: 0 }}
                    onClick={() => goToQuestion(idx)}
                    aria-label={`Đi tới câu hỏi ${idx + 1}`}
                    aria-current={state.currentQuestionIndex === idx ? 'true' : 'false'}
                  >
                    {idx + 1}
                  </Button>
                  );
                })}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Khung camera nhỏ nổi góc màn hình — minh bạch cho thí sinh biết đang được giám sát
          qua camera (Face Mesh + phát hiện vật thể chạy hoàn toàn trong trình duyệt máy
          thí sinh, không có hình ảnh nào được gửi lên server, chỉ gửi sự kiện vi phạm). */}
      <Box sx={{ position: 'fixed', bottom: 90, right: 16, zIndex: 1150, width: 160 }}>
        {cameraError ? (
          <Paper sx={{ p: 1.5, bgcolor: '#FEF2F2', border: '1px solid', borderColor: 'error.light', borderRadius: 2 }}>
            <Typography variant="caption" color="error.main">{cameraError}</Typography>
          </Paper>
        ) : (
          <Paper sx={{ p: 0.5, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <video
              ref={videoRef}
              muted
              playsInline
              aria-label="Camera giám sát thi (chỉ hiển thị cho bạn, không lưu hình ảnh)"
              style={{ width: '100%', borderRadius: 6, display: 'block', transform: 'scaleX(-1)', opacity: cameraReady ? 1 : 0.3 }}
            />
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mt: 0.5 }}>
              {cameraReady ? 'Đang giám sát' : 'Đang kết nối camera...'}
            </Typography>
          </Paper>
        )}
      </Box>

      <Paper sx={{ p: 1.5, display: 'flex', justifyContent: 'center', borderRadius: 0, borderTop: '1px solid', borderColor: 'divider', position: 'fixed', bottom: 0, width: '100%', zIndex: 1200, bgcolor: 'white' }}>
        <ProctoringStatus isActive={isActive} violationCount={violationCount} />
      </Paper>
    </Box>
  );
};

export default ExamRoom;
