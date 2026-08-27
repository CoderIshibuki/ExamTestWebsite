import React, { useEffect, useCallback, useState, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Paper, Grid, Container, Snackbar, Alert } from '@mui/material';
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
  const [saveAnswerError, setSaveAnswerError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error('Failed to initialize exam:', err);
      const detail = err?.response?.data?.detail;
      setInitError(typeof detail === 'string' ? detail : 'Không thể tải đề thi hoặc bắt đầu bài làm. Vui lòng kiểm tra lại kết nối.');
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
      } catch (err: any) {
        console.error('Failed to save answer:', err);
        // Trước đây lỗi lưu đáp án chỉ log console — học sinh không hề biết đáp án của
        // mình CHƯA được lưu vào server (VD do mất mạng tạm thời hoặc bài thi đã hết giờ),
        // dễ mất đáp án oan mà không ai cảnh báo gì cả.
        setSaveAnswerError(
          err?.response?.data?.detail || 'Không thể lưu đáp án — kiểm tra kết nối mạng và thử chọn lại đáp án.'
        );
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
    const isCompleted = initError?.toLowerCase().includes('maximum attempts') || initError?.includes('lượt làm bài') || initError?.includes('already');

    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: '#F8FAFC', p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: 4,
            maxWidth: 480,
            width: '100%',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            bgcolor: '#FFFFFF',
          }}
        >
          {isCompleted ? (
            <>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 3,
                  bgcolor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                  border: '2px solid #DBEAFE',
                }}
              >
                <Typography sx={{ fontSize: '2rem' }}>🎓</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                Bạn đã tham gia kỳ thi này rồi
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 4, lineHeight: 1.6 }}>
                Bạn đã sử dụng hết số lượt làm bài cho phép cho đề thi này. Bạn có thể xem lại bảng điểm kết quả hoặc liên hệ giáo viên để được cấp thêm lượt thi lại.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/student/results')}
                  sx={{
                    bgcolor: '#2563EB',
                    color: '#fff',
                    fontWeight: 700,
                    borderRadius: 2.5,
                    py: 1.3,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#1D4ED8' },
                  }}
                >
                  Xem kết quả thi của bạn
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(`/${user?.role || 'student'}/exams`)}
                  sx={{
                    borderColor: '#E2E8F0',
                    color: '#475569',
                    fontWeight: 600,
                    borderRadius: 2.5,
                    py: 1.2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#F8FAFC' },
                  }}
                >
                  Quay lại danh sách kỳ thi
                </Button>
              </Box>
            </>
          ) : (
            <>
              <ErrorOutlined color="error" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" color="error" sx={{ fontWeight: 800, mb: 1 }}>
                Không thể vào phòng thi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                {initError || 'Không thể tải hoặc nộp bài thi. Vui lòng kiểm tra lại kết nối.'}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(`/${user?.role || 'student'}/exams`)}
                sx={{
                  bgcolor: '#2563EB',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  py: 1.2,
                  px: 4,
                  textTransform: 'none',
                }}
              >
                Quay lại danh sách kỳ thi
              </Button>
            </>
          )}
        </Paper>
      </Box>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column', pb: 10 }}>
      {/* Zen Topbar */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          px: 3.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          bgcolor: '#FFFFFF',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: 20 }}>
            <Box sx={{ width: 9, height: 9, bgcolor: '#E53935', borderRadius: '2px' }} />
            <Box sx={{ width: 9, height: 9, bgcolor: '#2563EB', borderRadius: '2px' }} />
            <Box sx={{ width: 9, height: 9, bgcolor: '#FDD835', borderRadius: '2px' }} />
            <Box sx={{ width: 9, height: 9, bgcolor: '#10B981', borderRadius: '2px' }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', display: { xs: 'none', sm: 'block' } }}>
            Phòng thi trực tuyến
          </Typography>
        </Box>

        {/* Center Timer */}
        <Timer timeLeft={timeLeft} isWarning={isWarning} formattedTime={formattedTime} />

        {/* Action Button */}
        <Button
          variant="contained"
          onClick={handleFinish}
          disabled={state.status === 'submitting'}
          aria-label="Nộp bài"
          sx={{
            bgcolor: '#10B981',
            '&:hover': { bgcolor: '#059669' },
            textTransform: 'none',
            borderRadius: 2.5,
            fontWeight: 700,
            px: 3,
            py: 0.9,
            boxShadow: '0 2px 6px rgba(16,185,129,0.2)',
          }}
        >
          {state.status === 'submitting' ? 'Đang nộp...' : 'Nộp bài thi'}
        </Button>
      </Paper>

      {/* Main Workspace */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 4 }}>
        <Grid container spacing={3.5}>
          {/* Question Panel Area */}
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
              <Box sx={{ textAlign: 'center', p: 6 }}><Typography>Đang tải câu hỏi...</Typography></Box>
            )}

            <Box sx={{ mt: 3.5, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                disabled={state.currentQuestionIndex === 0}
                onClick={prevQuestion}
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 3, borderColor: '#CBD5E1', color: '#475569' }}
              >
                ← Câu trước
              </Button>
              <Button
                variant="contained"
                disabled={state.currentQuestionIndex === state.totalQuestions - 1}
                onClick={nextQuestion}
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, px: 3, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
              >
                Câu tiếp theo →
              </Button>
            </Box>
          </Grid>
          
          {/* Bento Matrix Question Navigator */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 1, lg: 2 } }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3.5,
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                position: { lg: 'sticky' },
                top: 85,
                bgcolor: '#FFFFFF',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Mục lục câu hỏi
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Đã làm: {Object.values(state.answers).filter(a => Array.isArray(a) ? a.length > 0 : !!a).length} / {state.totalQuestions}
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 1.2, mb: 3 }} role="group" aria-label="Điều hướng câu hỏi">
                {state.questions.map((q, idx) => {
                  const ans = state.answers[q.id];
                  const answered = Array.isArray(ans) ? ans.length > 0 : !!ans;
                  const isCurrent = state.currentQuestionIndex === idx;
                  
                  let bgColor = '#F8FAFC';
                  let textColor = '#475569';
                  let borderColor = '#E2E8F0';

                  if (isCurrent) {
                    bgColor = '#2563EB';
                    textColor = '#FFFFFF';
                    borderColor = '#2563EB';
                  } else if (answered) {
                    bgColor = '#ECFDF5';
                    textColor = '#059669';
                    borderColor = '#A7F3D0';
                  }

                  return (
                    <Button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      sx={{
                        minWidth: 0,
                        height: 44,
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        p: 0,
                        bgcolor: bgColor,
                        color: textColor,
                        border: `1.5px solid ${borderColor}`,
                        '&:hover': {
                          bgcolor: isCurrent ? '#1D4ED8' : '#EFF6FF',
                          borderColor: '#2563EB',
                        },
                      }}
                      aria-label={`Đi tới câu hỏi ${idx + 1}`}
                      aria-current={isCurrent ? 'true' : 'false'}
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </Box>

              {/* Status Legend */}
              <Box sx={{ pt: 2, borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#2563EB' }} />
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>Đang xem</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }} />
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>Đã chọn đáp án</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>Chưa trả lời</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Floating PIP Camera */}
      <Box sx={{ position: 'fixed', bottom: 70, right: 20, zIndex: 1150, width: 160 }}>
        {cameraError ? (
          <Paper sx={{ p: 1.5, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 2.5, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>{cameraError}</Typography>
          </Paper>
        ) : (
          <Paper sx={{ p: 0.6, borderRadius: 2.5, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', bgcolor: '#FFFFFF' }}>
            <video
              ref={videoRef}
              muted
              playsInline
              aria-label="Camera giám sát thi (chỉ hiển thị cho bạn, không lưu hình ảnh)"
              style={{ width: '100%', borderRadius: 8, display: 'block', transform: 'scaleX(-1)', opacity: cameraReady ? 1 : 0.3 }}
            />
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#64748B', fontWeight: 600, mt: 0.5, fontSize: '0.7rem' }}>
              {cameraReady ? '● AI Giám sát ON' : 'Đang mở camera...'}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Bottom Status Pill */}
      <Paper
        elevation={0}
        sx={{
          p: 1.2,
          display: 'flex',
          justifyContent: 'center',
          borderTop: '1px solid #E2E8F0',
          position: 'fixed',
          bottom: 0,
          width: '100%',
          zIndex: 1200,
          bgcolor: '#FFFFFF',
        }}
      >
        <ProctoringStatus isActive={isActive} violationCount={violationCount} />
      </Paper>

      <Snackbar
        open={!!saveAnswerError}
        autoHideDuration={6000}
        onClose={() => setSaveAnswerError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSaveAnswerError(null)} sx={{ width: '100%' }}>
          {saveAnswerError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExamRoom;
