import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Tabs, Tab, List, ListItem, ListItemText, IconButton, TextField, MenuItem,
  Chip, Alert, Autocomplete, Divider, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, RestartAlt as RestartAltIcon } from '@mui/icons-material';
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

  // Tab Lịch thi
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  // Tab Thí sinh & Lượt thi (Attempts)
  const [attempts, setAttempts] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const loadSchedulesTab = async () => {
    if (!examId) return;
    setLoadingSchedules(true);
    try {
      const s = await adminApi.listExamSchedules(examId);
      setSchedules(s || []);
    } catch (err) {
      console.error('Failed to load schedules', err);
      setError('Không tải được lịch thi.');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const loadAttemptsTab = async () => {
    if (!examId) return;
    setLoadingAttempts(true);
    try {
      const [attList, users] = await Promise.all([
        adminApi.getExamAttempts(examId).catch(() => []),
        adminApi.getUsers().catch(() => []),
      ]);
      setAttempts(attList || []);
      const uMap: Record<string, any> = {};
      (users || []).forEach((u: any) => {
        uMap[String(u.id)] = u;
      });
      setUsersMap(uMap);
    } catch (err) {
      console.error('Failed to load attempts', err);
      setError('Không tải được danh sách lượt thi của thí sinh.');
    } finally {
      setLoadingAttempts(false);
    }
  };

  useEffect(() => {
    if (open && examId) {
      setError('');
      setSuccessMsg('');
      loadQuestionsTab();
      loadProctorsTab();
      loadSchedulesTab();
      loadAttemptsTab();
    }
  }, [open, examId]);

  const handleDeleteAttempt = async (attemptId: string, studentName: string) => {
    if (!examId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xoá lượt thi này của thí sinh "${studentName}" để cho phép thí sinh vào thi lại?`)) return;
    try {
      await adminApi.deleteExamAttempt(examId, attemptId);
      setSuccessMsg(`Đã xoá lượt thi của "${studentName}". Thí sinh có thể vào thi lại ngay.`);
      loadAttemptsTab();
    } catch (err: any) {
      console.error('Failed to delete attempt', err);
      setError(err?.response?.data?.detail || 'Xoá lượt thi thất bại.');
    }
  };

  const handleResetAllAttempts = async (userId: string, studentName: string) => {
    if (!examId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xoá TẤT CẢ lượt thi của "${studentName}" trong đề thi này?`)) return;
    try {
      await adminApi.resetStudentAttempts(examId, userId);
      setSuccessMsg(`Đã reset toàn bộ lượt thi cho "${studentName}". Thí sinh có thể vào thi lại.`);
      loadAttemptsTab();
    } catch (err: any) {
      console.error('Failed to reset student attempts', err);
      setError(err?.response?.data?.detail || 'Reset lượt thi thất bại.');
    }
  };

  const existingIds = new Set(examQuestions.map((q) => q.question_id));
  const availableBank = bank.filter((q) => !existingIds.has(q.id || q._id));

  const handleAddManual = async () => {
    if (!examId || !manualAdd) return;
    try {
      await adminApi.addExamQuestion(examId, { question_id: manualAdd.id || manualAdd._id, point_value: 1 });
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

  const handleAddSchedule = async () => {
    if (!examId || !newStart || !newEnd) {
      setError('Vui lòng chọn đủ thời gian bắt đầu và kết thúc.');
      return;
    }
    if (new Date(newStart) >= new Date(newEnd)) {
      setError('Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }
    try {
      await adminApi.addExamSchedule(examId, {
        start_time: new Date(newStart).toISOString(),
        end_time: new Date(newEnd).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setNewStart('');
      setNewEnd('');
      loadSchedulesTab();
    } catch (err) {
      console.error('Failed to add schedule', err);
      setError('Thêm lịch thi thất bại.');
    }
  };

  const handleRemoveSchedule = async (scheduleId: string) => {
    if (!examId) return;
    try {
      await adminApi.removeExamSchedule(examId, scheduleId);
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch (err) {
      console.error('Failed to remove schedule', err);
      setError('Xoá lịch thi thất bại.');
    }
  };

  const formatDT = (iso: string) => new Date(iso).toLocaleString('vi-VN');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1 }}>
        Quản lý đề thi{examTitle ? `: ${examTitle}` : ''}
      </DialogTitle>
      <DialogContent sx={{ minHeight: 450 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Câu hỏi trong đề" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="Giám thị coi thi" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="Lịch thi" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label={`Thí sinh & Lượt thi (${attempts.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>

        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

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

        <TabPanel value={tab} index={2}>
          {loadingSchedules ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                Nếu không đặt lịch nào, đề thi được mở bất cứ lúc nào (sau khi công bố). Nếu đặt ít nhất 1 khung giờ,
                học sinh chỉ có thể bắt đầu làm bài trong các khung giờ đó.
              </Alert>
              <List dense sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                {schedules.length === 0 && (
                  <ListItem><ListItemText primary="Chưa đặt khung giờ nào — đề thi đang mở tự do." /></ListItem>
                )}
                {schedules.map((s) => (
                  <ListItem
                    key={s.id}
                    secondaryAction={
                      <IconButton edge="end" color="error" onClick={() => handleRemoveSchedule(s.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={`${formatDT(s.start_time)} → ${formatDT(s.end_time)}`} />
                  </ListItem>
                ))}
              </List>

              <Typography sx={{ fontWeight: 600, mb: 1 }}>Thêm khung giờ mới</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  label="Bắt đầu" type="datetime-local" size="small" value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Kết thúc" type="datetime-local" size="small" value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Button variant="contained" onClick={handleAddSchedule} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Thêm khung giờ
                </Button>
              </Box>
            </>
          )}
        </TabPanel>

        <TabPanel value={tab} index={3}>
          {loadingAttempts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              <Alert severity="info" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
                Danh sách thí sinh đã tham gia làm bài thi. Bạn có thể bấm <b>"Cho phép thi lại"</b> để xoá lượt thi cũ, giúp học sinh vào thi lại từ đầu.
              </Alert>
              {attempts.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                  <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Chưa có thí sinh nào tham gia làm bài thi này.</Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, maxHeight: 360 }}>
                  <Table size="medium" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC', width: '32%' }}>Thí sinh</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#F8FAFC', width: '12%' }}>Lần thi</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#F8FAFC', width: '16%' }}>Trạng thái</TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC', width: '20%' }}>Thời gian</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#F8FAFC', width: '20%' }}>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attempts.map((att) => {
                        const student = usersMap[att.user_id];
                        const studentName = student?.full_name || student?.username || `@${att.user_id}`;
                        const isSubmitted = att.status === 'submitted' || att.status === 'auto_submitted';
                        return (
                          <TableRow key={att.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ width: '32%' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                {studentName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                {student?.email ? `${student.email} • ` : ''}@{student?.username || att.user_id}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ width: '12%' }}>
                              <Chip label={`Lần ${att.attempt_number || 1}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                            </TableCell>
                            <TableCell align="center" sx={{ width: '16%' }}>
                              <Chip
                                label={isSubmitted ? 'Đã nộp bài' : att.status === 'in_progress' ? 'Đang làm' : att.status}
                                size="small"
                                color={isSubmitted ? 'success' : 'warning'}
                                sx={{ fontWeight: 700, fontSize: '0.75rem', px: 0.5 }}
                              />
                            </TableCell>
                            <TableCell sx={{ width: '20%' }}>
                              <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontWeight: 500 }}>
                                {att.submitted_at ? formatDT(att.submitted_at) : (att.started_at ? `Bắt đầu: ${formatDT(att.started_at)}` : '—')}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ width: '20%' }}>
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                <Tooltip title="Xoá lượt thi này để thí sinh vào làm bài lại">
                                  <Button
                                    variant="outlined"
                                    color="warning"
                                    size="small"
                                    startIcon={<RestartAltIcon />}
                                    onClick={() => handleDeleteAttempt(att.id, studentName)}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                                  >
                                    Cho phép thi lại
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Xoá toàn bộ lượt thi của thí sinh này">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleResetAllAttempts(att.user_id, studentName)}
                                    sx={{ border: '1px solid #FEE2E2', borderRadius: 2, p: 0.7 }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 700 }}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
