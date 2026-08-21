import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, IconButton, Typography,
  FormControlLabel, Checkbox, RadioGroup, Radio, Alert
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { adminApi } from '../api/adminApi';

interface ManualQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (question: any) => Promise<void>;
}

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Trắc nghiệm (1 đáp án)' },
  { value: 'multiple_select', label: 'Trắc nghiệm (Nhiều đáp án)' },
  { value: 'true_false', label: 'Đúng/Sai' },
  { value: 'matching', label: 'Nối cột' },
  { value: 'essay', label: 'Tự luận / Chụp ảnh' },
];

let optionIdCounter = 0;
const genId = (prefix: string) => `${prefix}${Date.now()}_${optionIdCounter++}`;

export default function ManualQuestionDialog({ open, onClose, onSave }: ManualQuestionDialogProps) {
  const [type, setType] = useState('multiple_choice');
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      adminApi.getCategories().then(setCategories).catch((err) => console.error('Failed to load categories', err));
    }
  }, [open]);

  // multiple_choice / multiple_select
  const [options, setOptions] = useState([
    { id: genId('opt_'), text: '', isCorrect: false },
    { id: genId('opt_'), text: '', isCorrect: false },
  ]);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState('true');

  // matching: 2 cột độc lập
  const [leftItems, setLeftItems] = useState([{ id: genId('L_'), text: '' }, { id: genId('L_'), text: '' }]);
  const [rightItems, setRightItems] = useState([{ id: genId('R_'), text: '' }, { id: genId('R_'), text: '' }]);
  const [pairs, setPairs] = useState<Record<string, string>>({}); // leftId -> rightId (đáp án đúng)

  const resetForm = () => {
    setText('');
    setSubject('');
    setCategoryId('');
    setType('multiple_choice');
    setError('');
    setOptions([{ id: genId('opt_'), text: '', isCorrect: false }, { id: genId('opt_'), text: '', isCorrect: false }]);
    setLeftItems([{ id: genId('L_'), text: '' }, { id: genId('L_'), text: '' }]);
    setRightItems([{ id: genId('R_'), text: '' }, { id: genId('R_'), text: '' }]);
    setPairs({});
  };

  const handleAddOption = () => setOptions([...options, { id: genId('opt_'), text: '', isCorrect: false }]);
  const handleRemoveOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const handleOptionTextChange = (index: number, val: string) => {
    const next = [...options];
    next[index] = { ...next[index], text: val };
    setOptions(next);
  };
  const handleOptionCorrectChange = (index: number, isCorrect: boolean) => {
    const next = [...options];
    if (type === 'multiple_choice') next.forEach((o) => (o.isCorrect = false));
    next[index] = { ...next[index], isCorrect };
    setOptions(next);
  };

  const validate = (): string | null => {
    if (!text.trim()) return 'Vui lòng nhập nội dung câu hỏi.';
    if (!subject.trim()) return 'Vui lòng nhập môn học.';
    if (type === 'multiple_choice' || type === 'multiple_select') {
      if (options.some((o) => !o.text.trim())) return 'Vui lòng điền đủ nội dung các đáp án.';
      if (!options.some((o) => o.isCorrect)) return 'Vui lòng chọn ít nhất 1 đáp án đúng.';
    }
    if (type === 'matching') {
      if (leftItems.some((i) => !i.text.trim()) || rightItems.some((i) => !i.text.trim())) {
        return 'Vui lòng điền đủ nội dung 2 cột.';
      }
      if (leftItems.some((i) => !pairs[i.id])) return 'Vui lòng nối đủ cặp đáp án đúng cho mọi ý ở cột trái.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSaving(true);

    let payloadOptions: { id: string; text: string; is_correct: boolean }[] = [];
    let correctAnswer: string | string[] = '';

    if (type === 'multiple_choice' || type === 'multiple_select') {
      payloadOptions = options.map((o) => ({ id: o.id, text: o.text, is_correct: o.isCorrect }));
      correctAnswer = options.filter((o) => o.isCorrect).map((o) => o.id);
    } else if (type === 'true_false') {
      const trueId = 'opt_true';
      const falseId = 'opt_false';
      payloadOptions = [
        { id: trueId, text: 'Đúng', is_correct: trueFalseAnswer === 'true' },
        { id: falseId, text: 'Sai', is_correct: trueFalseAnswer === 'false' },
      ];
      correctAnswer = trueFalseAnswer === 'true' ? trueId : falseId;
    } else if (type === 'matching') {
      payloadOptions = [
        ...leftItems.map((i) => ({ id: i.id, text: i.text, is_correct: true })),
        ...rightItems.map((i) => ({ id: i.id, text: i.text, is_correct: true })),
      ];
      correctAnswer = Object.entries(pairs).map(([l, r]) => `${l}:${r}`);
    } else {
      // essay: không có options, chấm tay
      payloadOptions = [];
      correctAnswer = '';
    }

    const payload = {
      content: { text },
      type,
      options: payloadOptions,
      correct_answer: correctAnswer,
      metadata: { subject, difficulty, tags: [] },
      category_id: categoryId || null,
    };

    try {
      await onSave(payload);
      resetForm();
    } catch (err: any) {
      console.error('Failed to save question', err);
      setError(err.response?.data?.detail || 'Lưu câu hỏi thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Tạo câu hỏi thủ công</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Nội dung câu hỏi"
            multiline
            rows={3}
            variant="filled"
            fullWidth
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Loại câu hỏi" variant="filled" fullWidth value={type} onChange={(e) => setType(e.target.value)}>
              {QUESTION_TYPES.map((qt) => (
                <MenuItem key={qt.value} value={qt.value}>{qt.label}</MenuItem>
              ))}
            </TextField>
            <TextField label="Môn học" variant="filled" fullWidth required value={subject} onChange={(e) => setSubject(e.target.value)} />
            <TextField select label="Độ khó" variant="filled" fullWidth value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <MenuItem value="easy">Dễ</MenuItem>
              <MenuItem value="medium">Trung bình</MenuItem>
              <MenuItem value="hard">Khó</MenuItem>
            </TextField>
          </Box>

          <TextField select label="Danh mục (tuỳ chọn)" variant="filled" fullWidth value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <MenuItem value=""><em>-- Không thuộc danh mục nào --</em></MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>

          <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold' }}>Cấu hình đáp án</Typography>

          {(type === 'multiple_choice' || type === 'multiple_select') && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {options.map((opt, idx) => (
                <Box key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {type === 'multiple_select' ? (
                    <Checkbox checked={opt.isCorrect} onChange={(e) => handleOptionCorrectChange(idx, e.target.checked)} />
                  ) : (
                    <Radio checked={opt.isCorrect} onChange={(e) => handleOptionCorrectChange(idx, e.target.checked)} />
                  )}
                  <TextField size="small" fullWidth label={`Đáp án ${idx + 1}`} value={opt.text} onChange={(e) => handleOptionTextChange(idx, e.target.value)} />
                  <IconButton color="error" onClick={() => handleRemoveOption(idx)} disabled={options.length <= 2}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button startIcon={<AddIcon />} variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={handleAddOption}>
                Thêm đáp án
              </Button>
            </Box>
          )}

          {type === 'true_false' && (
            <RadioGroup row value={trueFalseAnswer} onChange={(e) => setTrueFalseAnswer(e.target.value)}>
              <FormControlLabel value="true" control={<Radio />} label="Đúng" />
              <FormControlLabel value="false" control={<Radio />} label="Sai" />
            </RadioGroup>
          )}

          {type === 'matching' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Nhập nội dung 2 cột, sau đó chọn đáp án đúng (ý cột trái nối với ý nào ở cột phải) bên dưới.
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Cột trái</Typography>
                  {leftItems.map((item, idx) => (
                    <Box key={item.id} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                      <TextField size="small" fullWidth label={`Vế trái ${idx + 1}`} value={item.text}
                        onChange={(e) => setLeftItems(leftItems.map((it) => it.id === item.id ? { ...it, text: e.target.value } : it))} />
                      <IconButton color="error" size="small" disabled={leftItems.length <= 2}
                        onClick={() => setLeftItems(leftItems.filter((it) => it.id !== item.id))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button size="small" startIcon={<AddIcon />} onClick={() => setLeftItems([...leftItems, { id: genId('L_'), text: '' }])}>Thêm</Button>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Cột phải</Typography>
                  {rightItems.map((item, idx) => (
                    <Box key={item.id} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                      <TextField size="small" fullWidth label={`Vế phải ${idx + 1}`} value={item.text}
                        onChange={(e) => setRightItems(rightItems.map((it) => it.id === item.id ? { ...it, text: e.target.value } : it))} />
                      <IconButton color="error" size="small" disabled={rightItems.length <= 2}
                        onClick={() => setRightItems(rightItems.filter((it) => it.id !== item.id))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button size="small" startIcon={<AddIcon />} onClick={() => setRightItems([...rightItems, { id: genId('R_'), text: '' }])}>Thêm</Button>
                </Box>
              </Box>

              <Typography sx={{ fontWeight: 600 }}>Đáp án đúng (nối cặp)</Typography>
              {leftItems.map((item, idx) => (
                <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ minWidth: 140 }}>{item.text || `Vế trái ${idx + 1}`}</Typography>
                  <Typography>→</Typography>
                  <TextField select size="small" sx={{ minWidth: 200 }} value={pairs[item.id] || ''}
                    onChange={(e) => setPairs({ ...pairs, [item.id]: e.target.value })}>
                    <MenuItem value=""><em>-- Chọn --</em></MenuItem>
                    {rightItems.map((r, i) => <MenuItem key={r.id} value={r.id}>{r.text || `Vế phải ${i + 1}`}</MenuItem>)}
                  </TextField>
                </Box>
              ))}
            </Box>
          )}

          {type === 'essay' && (
            <Alert severity="info">
              Học sinh sẽ gõ trực tiếp câu trả lời hoặc chụp/tải ảnh bài làm tay. Câu tự luận cần giáo viên chấm điểm thủ công sau khi thí sinh nộp bài.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={() => { resetForm(); onClose(); }} sx={{ textTransform: 'none', fontWeight: 'bold' }}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}>
          {saving ? 'Đang lưu...' : 'Tạo câu hỏi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
