import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Tabs, Tab, List, ListItem, ListItemText, IconButton, TextField, MenuItem,
  Chip, Alert, Autocomplete, Divider, CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { adminApi } from '../api/adminApi';

interface ManageExamDialogProps {
  open: boolean;
  onClose: () => void;
  examId: string | null;
  examTitle?: string;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm 1 đáp án',
  multiple_select: 'Trắc nghiệm nhiều đáp án',
  true_false: 'Đúng/Sai',
  matching: 'Nối cột',
  essay: 'Tự luận',
};

function TabPanel({ value, index, children }: { value: number; index: number; children: React.ReactNode }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function ManageExamDialog({ open, onClose, examId, examTitle }: ManageExamDialogProps) {
  const [tab, setTab] = useState(0);

  // Tab Câu hỏi
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [bank, setBank] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [genSubject, setGenSubject] = useState('');
  const [genDifficulty, setGenDifficulty] = useState('medium');
  const [genCount, setGenCount] = useState(5);
  const [genTypes, setGenTypes] = useState<string[]>(['multiple_choice']);
  const [generating, setGenerating] = useState(false);
  const [manualAdd, setManualAdd] = useState<any>(null);

  // Tab Giám thị
  const [proctors, setProctors] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [loadingProctors, setLoadingProctors] = useState(false);

  const [error, setError] = useState('');

  const loadQuestionsTab = async () => {
    if (!examId) return;
    setLoadingQuestions(true);
    try {
      const [eq, bankData] = await Promise.all([
        adminApi.getExamQuestions(examId),
        adminApi.getQuestions(),
      ]);
      setExamQuestions(eq || []);
      setBank(bankData || []);
    } catch (err) {
      console.error('Failed to load exam questions', err);
      setError('Không tải được danh sách câu hỏi.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadProctorsTab = async () => {
    if (!examId) return;
    setLoadingProctors(true);
    try {
      const [p, users] = await Promise.all([
        adminApi.listExamProctors(examId),
        adminApi.getUsers(),
      ]);
      setProctors(p || []);
      setTeachers((users || []).filter((u: any) => u.role === 'teacher' || u.role === 'admin'));
    } catch (err) {
      console.error('Failed to load proctors', err);
      setError('Không tải được danh sách giám thị.');
    } finally {
      setLoadingProctors(false);
    }
  };

  useEffect(() => {
    if (open && examId) {
      setError('');
      loadQuestionsTab();
      loadProctorsTab();
    }
  }, [open, examId]);

  const existingIds = new Set(examQuestions.map((q) => q.question_id));
  const availableBank = bank.filter((q) => !existingIds.has(q.id));

  const handleAddManual = async () => {
    if (!examId || !manualAdd) return;
    try {
      await adminApi.addExamQuestion(examId, { question_id: manualAdd.id, point_value: 1 });
      setManualAdd(null);
      loadQuestionsTab();
    } catch (err) {
      console.error('Failed to add question', err);
      setError('Thêm câu hỏi thất bại.');
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!examId) return;
    try {
      await adminApi.removeExamQuestion(examId, questionId);
      setExamQuestions((prev) => prev.filter((q) => q.question_id !== questionId));
    } catch (err) {
      console.error('Failed to remove question', err);
      setError('Xoá câu hỏi khỏi đề thất bại.');
    }
  };

  const handleGenerate = async () => {
    if (!examId || !genSubject.trim()) {
      setError('Vui lòng nhập môn học để tự động chọn câu hỏi.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      await adminApi.generateExamQuestions(examId, {
        subject: genSubject,
        difficulty: genDifficulty,
        num_questions: genCount,
        question_types: genTypes,
      });
      loadQuestionsTab();
    } catch (err) {
      console.error('Failed to generate questions', err);
      setError('Tự động chọn câu hỏi thất bại — có thể ngân hàng câu hỏi không đủ số lượng phù hợp.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddProctor = async () => {
    if (!examId || !selectedTeacher) return;
    try {
      await adminApi.addExamProctor(examId, selectedTeacher.id);
      setSelectedTeacher(null);
      loadProctorsTab();
    } catch (err) {
      console.error('Failed to add proctor', err);
      setError('Gán giám thị thất bại.');
    }
  };

  const handleRemoveProctor = async (userId: string) => {
    if (!examId) return;
    try {
      await adminApi.removeExamProctor(examId, userId);
      setProctors((prev) => prev.filter((p) => p.user_id !== userId));
    } catch (err) {
      console.error('Failed to remove proctor', err);
      setError('Gỡ giám thị thất bại.');
    }
  };

  const teacherName = (userId: string) => {
    const t = teachers.find((u) => u.id === userId);
    return t ? `${t.full_name || t.username} (${t.email})` : userId;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Quản lý đề thi{examTitle ? `: ${examTitle}` : ''}
      </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Câu hỏi trong đề" />
          <Tab label="Giám thị coi thi" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <TabPanel value={tab} index={0}>
          {loadingQuestions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Câu hỏi hiện có ({examQuestions.length})
              </Typography>
              <List dense sx={{ maxHeight: 220, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                {examQuestions.length === 0 && (
                  <ListItem><ListItemText primary="Đề thi chưa có câu hỏi nào." /></ListItem>
                )}
                {examQuestions.map((q) => (
                  <ListItem
                    key={q.question_id}
                    secondaryAction={
                      <IconButton edge="end" color="error" onClick={() => handleRemoveQuestion(q.question_id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={q.content?.text || '(không có nội dung)'}
                      secondary={<Chip label={TYPE_LABELS[q.type] || q.type} size="small" sx={{ mt: 0.5 }} />}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ mb: 3 }} />

              <Typography sx={{ fontWeight: 600, mb: 1 }}>Thêm câu hỏi thủ công từ ngân hàng</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Autocomplete
                  options={availableBank}
                  getOptionLabel={(o) => o.content?.text || ''}
                  value={manualAdd}
                  onChange={(_e, v) => setManualAdd(v)}
                  sx={{ flex: 1 }}
                  renderInput={(params) => <TextField {...params} label="Chọn câu hỏi" size="small" />}
                />
                <Button variant="contained" onClick={handleAddManual} disabled={!manualAdd} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Thêm
                </Button>
              </Box>

              <Typography sx={{ fontWeight: 600, mb: 1 }}>Tự động chọn ngẫu nhiên từ ngân hàng</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField label="Môn học" size="small" value={genSubject} onChange={(e) => setGenSubject(e.target.value)} sx={{ width: 160 }} />
                <TextField select label="Độ khó" size="small" value={genDifficulty} onChange={(e) => setGenDifficulty(e.target.value)} sx={{ width: 140 }}>
                  <MenuItem value="easy">Dễ</MenuItem>
                  <MenuItem value="medium">Trung bình</MenuItem>
                  <MenuItem value="hard">Khó</MenuItem>
                </TextField>
                <TextField
                  select label="Loại câu hỏi" size="small" sx={{ width: 200 }}
                  value={genTypes[0] || 'multiple_choice'}
                  onChange={(e) => setGenTypes([e.target.value])}
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </TextField>
                <TextField
                  label="Số lượng" type="number" size="small" sx={{ width: 100 }}
                  value={genCount} onChange={(e) => setGenCount(Number(e.target.value))}
                />
                <Button variant="outlined" onClick={handleGenerate} disabled={generating} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  {generating ? 'Đang chọn...' : 'Tự động chọn'}
                </Button>
              </Box>
            </>
          )}
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {loadingProctors ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Giám thị đang được gán ({proctors.length})</Typography>
              <List dense sx={{ maxHeight: 220, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                {proctors.length === 0 && (
                  <ListItem><ListItemText primary="Chưa gán giám thị nào cho đề thi này." /></ListItem>
                )}
                {proctors.map((p) => (
                  <ListItem
                    key={p.user_id}
                    secondaryAction={
                      <IconButton edge="end" color="error" onClick={() => handleRemoveProctor(p.user_id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={teacherName(p.user_id)} />
                  </ListItem>
                ))}
              </List>

              <Typography sx={{ fontWeight: 600, mb: 1 }}>Gán thêm giám thị</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Autocomplete
                  options={teachers.filter((t) => !proctors.some((p) => p.user_id === t.id))}
                  getOptionLabel={(o) => `${o.full_name || o.username} (${o.email})`}
                  value={selectedTeacher}
                  onChange={(_e, v) => setSelectedTeacher(v)}
                  sx={{ flex: 1 }}
                  renderInput={(params) => <TextField {...params} label="Chọn giáo viên" size="small" />}
                />
                <Button variant="contained" onClick={handleAddProctor} disabled={!selectedTeacher} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Gán
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Giáo viên được gán sẽ có quyền xem dashboard giám sát thi thời gian thực của đề này.
              </Typography>
            </>
          )}
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
