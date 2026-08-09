import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Box, IconButton, Typography,
  FormControlLabel, Checkbox, RadioGroup, Radio
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

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

export default function ManualQuestionDialog({ open, onClose, onSave }: ManualQuestionDialogProps) {
  const [type, setType] = useState('multiple_choice');
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  
  // Options state
  const [options, setOptions] = useState([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState('true');

  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionTextChange = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index].text = val;
    setOptions(newOptions);
  };

  const handleOptionCorrectChange = (index: number, isCorrect: boolean) => {
    const newOptions = [...options];
    if (type === 'multiple_choice') {
      newOptions.forEach(opt => opt.isCorrect = false);
    }
    newOptions[index].isCorrect = isCorrect;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    let finalOptions = [];
    if (type === 'multiple_choice' || type === 'multiple_select') {
      finalOptions = options;
    } else if (type === 'true_false') {
      finalOptions = [
        { text: 'Đúng', isCorrect: trueFalseAnswer === 'true' },
        { text: 'Sai', isCorrect: trueFalseAnswer === 'false' }
      ];
    } else {
      // essay doesn't have predefined options in the same way
      finalOptions = [];
    }

    const payload = {
      text,
      category,
      difficulty,
      type,
      options: finalOptions
    };

    await onSave(payload);
    // reset form
    setText('');
    setCategory('');
    setType('multiple_choice');
    setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Tạo câu hỏi thủ công</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
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
            <TextField 
              select 
              label="Loại câu hỏi" 
              variant="filled" 
              fullWidth 
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {QUESTION_TYPES.map(qt => (
                <MenuItem key={qt.value} value={qt.value}>{qt.label}</MenuItem>
              ))}
            </TextField>
            <TextField 
              label="Danh mục (Môn học)" 
              variant="filled" 
              fullWidth 
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <TextField 
              select 
              label="Độ khó" 
              variant="filled" 
              fullWidth 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <MenuItem value="easy">Dễ</MenuItem>
              <MenuItem value="medium">Trung bình</MenuItem>
              <MenuItem value="hard">Khó</MenuItem>
            </TextField>
          </Box>

          <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold' }}>Cấu hình đáp án</Typography>
          
          {(type === 'multiple_choice' || type === 'multiple_select') && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {options.map((opt, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {type === 'multiple_select' ? (
                    <Checkbox 
                      checked={opt.isCorrect} 
                      onChange={(e) => handleOptionCorrectChange(idx, e.target.checked)} 
                    />
                  ) : (
                    <Radio 
                      checked={opt.isCorrect}
                      onChange={(e) => handleOptionCorrectChange(idx, e.target.checked)}
                    />
                  )}
                  <TextField 
                    size="small" 
                    fullWidth 
                    label={`Đáp án ${idx + 1}`} 
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                  />
                  <IconButton color="error" onClick={() => handleRemoveOption(idx)}>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Nhập cặp Vế trái - Vế phải tương ứng với nhau.
              </Typography>
              {options.map((opt, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField 
                    size="small" 
                    fullWidth 
                    label={`Vế trái ${idx + 1}`} 
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                  />
                  <Typography variant="body1">-</Typography>
                  <TextField 
                    size="small" 
                    fullWidth 
                    label={`Vế phải ${idx + 1} (Đáp án)`} 
                    value={opt.isCorrect ? 'true' : ''} // basic mock for right side text
                    onChange={(e) => handleOptionCorrectChange(idx, e.target.value === 'true')}
                  />
                  <IconButton color="error" onClick={() => handleRemoveOption(idx)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button startIcon={<AddIcon />} variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={handleAddOption}>
                Thêm cặp nối
              </Button>
            </Box>
          )}

          {type === 'essay' && (
            <Typography variant="body2" color="text.secondary">
              Học sinh sẽ gõ trực tiếp câu trả lời hoặc chụp ảnh đính kèm bài làm đối với câu hỏi tự luận.
            </Typography>
          )}

        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 'bold' }}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}>
          Tạo câu hỏi
        </Button>
      </DialogActions>
    </Dialog>
  );
}
