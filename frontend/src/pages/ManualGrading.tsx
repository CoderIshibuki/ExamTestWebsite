import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Skeleton, Alert, Card, CardContent,
  TextField, Button, Chip, Snackbar, Avatar,
} from '@mui/material';
import { RateReview, AssignmentTurnedIn, EditNote } from '@mui/icons-material';
import { gradingApi } from '../api/gradingApi';
import type { PendingManualGradeItem } from '../api/gradingApi';

export default function ManualGrading() {
  const [items, setItems] = useState<PendingManualGradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await gradingApi.getPendingManualGrading();
      setItems(data || []);
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '1px solid #F1F5F9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#EFF6FF', color: '#2563EB', borderRadius: 1 }}>
                        <EditNote sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        Bài làm thí sinh (Mã #{item.user_id?.slice(0, 8)})
                      </Typography>
                    </Box>

                    <Chip
                      label={`Thang điểm: 0 - ${item.point_possible} điểm`}
                      size="small"
                      sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700, borderRadius: 1 }}
                    />
                  </Box>

                  {/* Student Answer Box */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                      Câu trả lời của thí sinh:
                    </Typography>
                    {isImageAnswer(item.user_answer) ? (
                      <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 1.2, border: '1px solid #E2E8F0', display: 'inline-block', maxWidth: '100%' }}>
                        <img
                          src={item.user_answer as string}
                          alt="Bài làm tự luận của học sinh"
                          style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 6, display: 'block' }}
                        />
                      </Box>
                    ) : (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          bgcolor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: 1.2,
                          color: '#0F172A',
                          fontFamily: 'inherit',
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.9rem',
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
