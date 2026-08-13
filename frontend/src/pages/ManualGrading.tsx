import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Skeleton, Alert, Card, CardContent,
  TextField, Button, Chip, Snackbar,
} from '@mui/material';
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
      setSnackbar({ open: true, message: 'Đã lưu điểm chấm tay.', severity: 'success' });
    } catch (err) {
      console.error('Failed to submit manual grade', err);
      setSnackbar({ open: true, message: 'Lưu điểm thất bại.', severity: 'error' });
    } finally {
      setSubmitting(null);
    }
  };

  const isImageAnswer = (answer: string | null) => !!answer && answer.startsWith('data:image');

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 3 }}>
        <Chip label={`${items.length} bài chờ chấm`} color={items.length > 0 ? 'warning' : 'success'} sx={{ fontWeight: 700 }} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box>
          <Skeleton variant="rectangular" height={180} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
        </Box>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">Không có bài tự luận nào đang chờ chấm.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map((item) => {
            const k = key(item);
            return (
              <Card key={k} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Câu hỏi: {item.question_id} · Học sinh: {item.user_id} · Điểm tối đa: {item.point_possible}
                    </Typography>
                  </Box>

                  {isImageAnswer(item.user_answer) ? (
                    <img
                      src={item.user_answer as string}
                      alt="Bài làm tự luận"
                      style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}
                    />
                  ) : (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, whiteSpace: 'pre-wrap', bgcolor: '#F8FAFC' }}>
                      {item.user_answer || <em>(Không có nội dung trả lời)</em>}
                    </Paper>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <TextField
                      label={`Điểm (0 - ${item.point_possible})`}
                      type="number"
                      size="small"
                      value={scores[k] ?? ''}
                      onChange={(e) => setScores({ ...scores, [k]: e.target.value })}
                      sx={{ width: 180 }}
                      slotProps={{ htmlInput: { min: 0, max: item.point_possible, step: 0.5 } }}
                    />
                    <TextField
                      label="Nhận xét (tuỳ chọn)"
                      size="small"
                      fullWidth
                      value={notes[k] ?? ''}
                      onChange={(e) => setNotes({ ...notes, [k]: e.target.value })}
                      sx={{ minWidth: 240, flex: 1 }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleSubmit(item)}
                      disabled={submitting === k}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', height: 40 }}
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
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
