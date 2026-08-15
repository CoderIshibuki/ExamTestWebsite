import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Box, Typography, Button, Paper, CircularProgress, Divider, Container, Fade, Alert,
  Accordion, AccordionSummary, AccordionDetails, Chip,
} from '@mui/material';
import { CheckCircleOutlined, CancelOutlined, EmojiEvents, Home, ExpandMore, HourglassEmpty } from '@mui/icons-material';
import { gradingApi } from '../api/gradingApi';
import type { ExamResult } from '../api/gradingApi';
import { getExamById, getExamQuestions } from '../api/examApi';
import type { ExamQuestionDetail } from '../api/examApi';

const ResultSummary: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [passingScore, setPassingScore] = useState<number>(50);
  const [questionsMap, setQuestionsMap] = useState<Record<string, ExamQuestionDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (attemptId) {
      setLoading(true);
      setError(null);
      gradingApi
        .getExamResult(attemptId)
        .then(async (res) => {
          setResult(res);
          // Lấy đúng ngưỡng đạt thật của đề thi thay vì mặc định 50% —
          // mỗi đề có thể có passing_score khác nhau (VD: 60%, 70%,...).
          try {
            const [exam, questions] = await Promise.all([
              getExamById(res.exam_id),
              getExamQuestions(res.exam_id),
            ]);
            setPassingScore(exam.passing_score ?? 50);
            const map: Record<string, ExamQuestionDetail> = {};
            questions.forEach((q) => { map[q.question_id] = q; });
            setQuestionsMap(map);
          } catch {
            // Không lấy được passing_score/nội dung câu hỏi thật thì vẫn hiển thị điểm số tổng,
            // chỉ là không có phần "chi tiết từng câu".
          }
        })
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
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px solid', borderColor: 'divider' }} role="alert">
          <CancelOutlined color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Đã xảy ra lỗi
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => navigate(`/${user?.role}/dashboard`)} startIcon={<Home />}>
            Về trang chủ
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!result) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px solid', borderColor: 'divider' }} role="status">
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Không tìm thấy kết quả.
          </Typography>
          <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate(`/${user?.role}/dashboard`)} startIcon={<Home />}>
            Về trang chủ
          </Button>
        </Paper>
      </Container>
    );
  }

  // Chuyển đáp án thô (id đáp án, hoặc JSON string với câu chọn-nhiều/nối cột) thành
  // text dễ đọc bằng cách tra cứu lại options thật của câu hỏi — trước đây hiện thẳng
  // chuỗi thô kiểu ["opt_1","opt_3"] hoặc [["L_1","R_2"]], không ai đọc hiểu được.
  const formatUserAnswer = (qr: { question_id: string; user_answer: string }): string => {
    const q = questionsMap[qr.question_id];
    if (!qr.user_answer) return '(không trả lời)';
    if (!q) return qr.user_answer;

    const optionText = (id: string) => q.options.find((o) => o.id === id)?.text || id;

    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      return optionText(qr.user_answer);
    }

    if (q.type === 'multiple_select') {
      try {
        const ids: string[] = JSON.parse(qr.user_answer);
        return ids.map(optionText).join(', ');
      } catch {
        return qr.user_answer;
      }
    }

    if (q.type === 'matching') {
      try {
        const pairs: [string, string][] = JSON.parse(qr.user_answer);
        return pairs.map(([l, r]) => `${optionText(l)} → ${optionText(r)}`).join('; ');
      } catch {
        return qr.user_answer;
      }
    }

    // essay: text thô hoặc ảnh base64 (ảnh thì hiện ghi chú thay vì in cả chuỗi base64 dài)
    if (qr.user_answer.startsWith('data:image')) return '(đã nộp ảnh chụp bài làm)';
    return qr.user_answer;
  };

  const isEssayImageAnswer = (qr: { question_id: string; user_answer: string }) => {
    const q = questionsMap[qr.question_id];
    return q?.type === 'essay' && qr.user_answer?.startsWith('data:image');
  };

  const passed = result.percentage >= passingScore;

  return (
    <Box sx={{ minHeight: '100vh', pt: 8, pb: 8, bgcolor: '#F3F4F6', display: 'flex', justifyContent: 'center' }}>
      <Container maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 4, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}>
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
              Tỷ lệ đúng: <span style={{ fontWeight: 'bold' }}>{result.percentage}%</span> (Ngưỡng đạt: {passingScore}%)
            </Typography>

            {result.has_pending_manual_grading && (
              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                Bài thi có câu tự luận đang chờ giáo viên chấm điểm — điểm số ở trên là điểm tạm tính,
                có thể thay đổi sau khi giáo viên chấm xong.
              </Alert>
            )}

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
              sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 600, borderRadius: 2, textTransform: 'none' }}
              onClick={() => navigate(`/${user?.role}/dashboard`)}
              startIcon={<Home />}
              aria-label="Trở về màn hình chính"
            >
              Trở về màn hình chính
            </Button>
          </Paper>
        </Fade>

        {/* Chi tiết từng câu — chỉ hiện được khi có dữ liệu question_results + nội dung câu hỏi thật */}
        {result.question_results && result.question_results.length > 0 && Object.keys(questionsMap).length > 0 && (
          <Fade in={true} timeout={1000}>
            <Paper sx={{ mt: 3, p: { xs: 2, md: 3 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'left' }}>
                Chi tiết từng câu
              </Typography>
              {result.question_results.map((qr, idx) => {
                const q = questionsMap[qr.question_id];
                return (
                  <Accordion key={qr.question_id} disableGutters sx={{ mb: 1, '&:before': { display: 'none' }, border: '1px solid #eee', borderRadius: '8px !important' }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', textAlign: 'left' }}>
                        {qr.needs_manual_grading ? (
                          <HourglassEmpty sx={{ color: '#F59E0B' }} fontSize="small" />
                        ) : qr.is_correct ? (
                          <CheckCircleOutlined sx={{ color: '#10B981' }} fontSize="small" />
                        ) : (
                          <CancelOutlined sx={{ color: '#EF4444' }} fontSize="small" />
                        )}
                        <Typography sx={{ flex: 1, fontWeight: 600 }}>
                          Câu {idx + 1}: {q?.content?.text ? (q.content.text.length > 60 ? q.content.text.slice(0, 60) + '…' : q.content.text) : '(không có nội dung)'}
                        </Typography>
                        <Chip
                          size="small"
                          label={qr.needs_manual_grading ? 'Chờ chấm' : `${qr.point_earned}/${qr.point_possible} điểm`}
                          color={qr.needs_manual_grading ? 'warning' : qr.is_correct ? 'success' : 'error'}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ textAlign: 'left' }}>
                      <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{q?.content?.text}</Typography>
                      {isEssayImageAnswer(qr) ? (
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ảnh bài làm đã nộp:</Typography>
                          <img src={qr.user_answer} alt="Bài làm đã nộp" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Đáp án của bạn: <strong>{formatUserAnswer(qr)}</strong>
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Paper>
          </Fade>
        )}
      </Container>
    </Box>
  );
};

export default ResultSummary;
