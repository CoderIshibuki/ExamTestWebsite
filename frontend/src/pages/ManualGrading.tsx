import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Skeleton, Alert, Card, CardContent,
  TextField, Button, Chip, Snackbar, Avatar,
} from '@mui/material';
import { RateReview, AssignmentTurnedIn, School, Quiz } from '@mui/icons-material';
import { gradingApi } from '../api/gradingApi';
import type { PendingManualGradeItem } from '../api/gradingApi';
import { adminApi } from '../api/adminApi';

export default function ManualGrading() {
  const [items, setItems] = useState<PendingManualGradeItem[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [examsMap, setExamsMap] = useState<Record<string, any>>({});
  const [questionsMap, setQuestionsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchPending = async () => {
    try {
      setLoading(true);
      const [data, users, exams, questions] = await Promise.all([
        gradingApi.getPendingManualGrading().catch(() => []),
        adminApi.getUsers().catch(() => []),
        adminApi.getExams().catch(() => []),
        adminApi.getQuestions().catch(() => []),
      ]);
      setItems(data || []);

      const uMap: Record<string, any> = {};
      (users || []).forEach((u: any) => { uMap[String(u.id)] = u; });
      setUsersMap(uMap);

      const eMap: Record<string, any> = {};
      (exams || []).forEach((e: any) => { eMap[String(e.id)] = e; });
      setExamsMap(eMap);

      const qMap: Record<string, any> = {};
      (questions || []).forEach((q: any) => { qMap[String(q.id || q._id)] = q; });
      setQuestionsMap(qMap);

      setError('');
    } catch (err) {
      console.error('Failed to fetch pending manual grading', err);
      setError('Không tải được danh sách bài chờ chấm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const key = (item: PendingManualGradeItem) => `${item.result_id}:${item.question_id}`;

  const handleSubmit = async (item: PendingManualGradeItem) => {
    const k = key(item);
    const scoreStr = scores[k];
    const score = Number(scoreStr);
    if (scoreStr === undefined || scoreStr === '' || isNaN(score)) {
      setSnackbar({ open: true, message: 'Vui lòng nhập điểm hợp lệ.', severity: 'error' });
      return;
    }
    if (score < 0 || score > item.point_possible) {
      setSnackbar({ open: true, message: `Điểm phải trong khoảng 0 - ${item.point_possible}.`, severity: 'error' });
      return;
    }
    setSubmitting(k);
    try {
      await gradingApi.manualGradeQuestion(item.result_id, item.question_id, score, notes[k]);
      setItems((prev) => prev.filter((it) => key(it) !== k));
      setSnackbar({ open: true, message: 'Đã lưu kết quả chấm bài thành công.', severity: 'success' });
    } catch (err: any) {
      console.error('Failed to submit manual grade', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Lưu điểm thất bại.', severity: 'error' });
    } finally {
      setSubmitting(null);
    }
  };

  const isImageAnswer = (answer: string | null) => !!answer && answer.startsWith('data:image');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            Chấm bài Tự luận
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Xem lại câu trả lời tự luận của thí sinh, cho điểm trực tiếp và gửi phản hồi nhận xét.
          </Typography>
        </Box>

        <Chip
          icon={<RateReview sx={{ fontSize: '15px !important' }} />}
          label={`${items.length} bài chờ chấm`}
          color={items.length > 0 ? 'warning' : 'success'}
          sx={{ fontWeight: 700, borderRadius: 1.2, px: 1 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1.5 }} />
          <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1.5 }} />
        </Box>
      ) : items.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 1.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
          <AssignmentTurnedIn sx={{ fontSize: 48, color: '#10B981', mb: 1 }} />
          <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.1rem' }}>Tất cả bài thi đã được chấm xong!</Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>Không có bài làm tự luận nào đang chờ bạn chấm điểm.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map((item) => {
            const k = key(item);
            const student = usersMap[item.user_id];
            const exam = examsMap[item.exam_id];
            const question = questionsMap[item.question_id];
            const displayName = student?.full_name || student?.username || `Thí sinh #${item.user_id?.slice(0, 8)}`;
            const username = student?.username || '';
            const email = student?.email || '';

            return (
              <Card
                key={k}
                elevation={0}
                sx={{
                  borderRadius: 1.5,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header: Student Info & Exam Badge */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2.5, pb: 2, borderBottom: '1px solid #F1F5F9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 42, height: 42, bgcolor: '#2563EB', color: '#fff', fontWeight: 800, fontSize: '1rem', borderRadius: 1.5 }}>
                        {displayName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                          {displayName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                          {email ? `${email} • ` : ''}@{username || item.user_id?.slice(0, 8)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<School sx={{ fontSize: '15px !important' }} />}
                        label={exam?.title || `Đề thi #${item.exam_id?.slice(0, 8)}`}
                        size="small"
                        sx={{ bgcolor: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', fontWeight: 700, borderRadius: 1 }}
                      />
                      <Chip
                        label={`Thang điểm: 0 - ${item.point_possible} đ`}
                        size="small"
                        sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700, borderRadius: 1 }}
                      />
                    </Box>
                  </Box>

                  {/* Question Prompt */}
                  <Box sx={{ mb: 2.5, p: 2, bgcolor: '#F8FAFC', borderRadius: 1.2, border: '1px solid #E2E8F0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8, color: '#2563EB' }}>
                      <Quiz sx={{ fontSize: 18 }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Đề bài / Câu hỏi tự luận:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 600, whiteSpace: 'pre-wrap' }}>
                      {question?.content?.text || '(Nội dung câu hỏi)'}
                    </Typography>
                  </Box>

                  {/* Student Answer Box */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                      Bài làm của thí sinh:
                    </Typography>
                    {isImageAnswer(item.user_answer) ? (
                      <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: 1.2, border: '1px solid #E2E8F0', display: 'inline-block', maxWidth: '100%' }}>
                        <img
                          src={item.user_answer as string}
                          alt="Ảnh chụp bài làm của thí sinh"
                          style={{ maxWidth: '100%', maxHeight: 450, borderRadius: 6, display: 'block' }}
                        />
                      </Box>
                    ) : (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          bgcolor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: 1.2,
                          color: '#0F172A',
                          fontFamily: 'inherit',
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.92rem',
                          lineHeight: 1.6,
                        }}
                      >
                        {item.user_answer || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Thí sinh không nhập câu trả lời</span>}
                      </Paper>
                    )}
                  </Box>

                  {/* Grading Inputs */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', pt: 2, borderTop: '1px solid #F1F5F9' }}>
                    <TextField
                      label={`Điểm (tối đa ${item.point_possible})`}
                      type="number"
                      size="small"
                      value={scores[k] ?? ''}
                      onChange={(e) => setScores({ ...scores, [k]: e.target.value })}
                      slotProps={{ htmlInput: { min: 0, max: item.point_possible, step: 0.25 } }}
                      sx={{ width: 200, '& .MuiOutlinedInput-root': { borderRadius: 1.2 } }}
                    />

                    <TextField
                      label="Nhận xét / Lời phê của giáo viên"
                      size="small"
                      fullWidth
                      value={notes[k] ?? ''}
                      onChange={(e) => setNotes({ ...notes, [k]: e.target.value })}
                      sx={{ flex: 1, minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: 1.2 } }}
                    />

                    <Button
                      variant="contained"
                      disabled={submitting === k}
                      onClick={() => handleSubmit(item)}
                      sx={{
                        bgcolor: '#2563EB',
                        '&:hover': { bgcolor: '#1D4ED8' },
                        borderRadius: 1.2,
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 3,
                        py: 0.9,
                      }}
                    >
                      {submitting === k ? 'Đang lưu...' : 'Lưu điểm'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 1.5 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
