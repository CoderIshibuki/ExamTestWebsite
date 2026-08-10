import { useRef, useState } from 'react';
import {
  Paper, Typography, RadioGroup, FormControlLabel, Radio,
  Checkbox, FormGroup, TextField, Button, Box, Chip,
  Select, MenuItem, Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { PhotoCamera, Delete as DeleteIcon } from '@mui/icons-material';
import type { Question, AnswerValue } from '../context/ExamContext';

interface QuestionPanelProps {
  question: Question;
  selectedAnswer: AnswerValue;
  onSelectAnswer: (answer: AnswerValue) => void;
  questionIndex: number;
  totalQuestions?: number;
}

// Nén & resize ảnh trước khi encode base64, tránh payload quá nặng khi thí sinh chụp
// ảnh bài làm tay bằng điện thoại (ảnh gốc có thể vài MB, resize xuống còn vài trăm KB).
function compressImageToDataUrl(file: File, maxDim = 1600, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  questionIndex,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderByType = () => {
    switch (question.type) {
      case 'true_false':
      case 'multiple_choice': {
        const value = typeof selectedAnswer === 'string' ? selectedAnswer : '';
        return (
          <RadioGroup value={value} onChange={(e) => onSelectAnswer(e.target.value)}>
            {question.options.map((option) => (
              <FormControlLabel
                key={option.id}
                value={option.id}
                control={<Radio />}
                label={option.text}
                sx={{
                  border: '1px solid', borderColor: value === option.id ? 'primary.main' : 'divider',
                  borderRadius: 2, mb: 1.5, mx: 0, py: 1, px: 2,
                  bgcolor: value === option.id ? '#EEF2FF' : 'transparent',
                }}
              />
            ))}
          </RadioGroup>
        );
      }

      case 'multiple_select': {
        const selected = Array.isArray(selectedAnswer) ? (selectedAnswer as string[]) : [];
        const toggle = (optionId: string) => {
          const next = selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId];
          onSelectAnswer(next);
        };
        return (
          <>
            <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
              Câu này có thể có nhiều đáp án đúng — chọn tất cả đáp án bạn cho là đúng.
            </Alert>
            <FormGroup>
              {question.options.map((option) => (
                <FormControlLabel
                  key={option.id}
                  control={<Checkbox checked={selected.includes(option.id)} onChange={() => toggle(option.id)} />}
                  label={option.text}
                  sx={{
                    border: '1px solid', borderColor: selected.includes(option.id) ? 'primary.main' : 'divider',
                    borderRadius: 2, mb: 1.5, mx: 0, py: 1, px: 2,
                    bgcolor: selected.includes(option.id) ? '#EEF2FF' : 'transparent',
                  }}
                />
              ))}
            </FormGroup>
          </>
        );
      }

      case 'matching': {
        const pairs = Array.isArray(selectedAnswer) ? (selectedAnswer as [string, string][]) : [];
        const pairMap = new Map(pairs);
        const left = question.matching?.left || [];
        const right = question.matching?.right || [];

        const handleChange = (leftId: string) => (e: SelectChangeEvent) => {
          const rightId = e.target.value;
          const nextMap = new Map(pairMap);
          if (rightId) nextMap.set(leftId, rightId);
          else nextMap.delete(leftId);
          onSelectAnswer(Array.from(nextMap.entries()) as [string, string][]);
        };

        return (
          <>
            <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
              Nối mỗi ý ở cột trái với ý tương ứng ở cột phải.
            </Alert>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {left.map((item, idx) => (
                <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                  <Chip label={idx + 1} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  <Typography sx={{ flex: 1 }}>{item.text}</Typography>
                  <Select
                    size="small"
                    displayEmpty
                    value={pairMap.get(item.id) || ''}
                    onChange={handleChange(item.id)}
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value=""><em>-- Chọn --</em></MenuItem>
                    {right.map((r) => (
                      <MenuItem key={r.id} value={r.id}>{r.text}</MenuItem>
                    ))}
                  </Select>
                </Box>
              ))}
            </Box>
          </>
        );
      }

      case 'essay': {
        const currentValue = typeof selectedAnswer === 'string' ? selectedAnswer : '';
        const isImage = currentValue.startsWith('data:image');

        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          try {
            const dataUrl = await compressImageToDataUrl(file);
            onSelectAnswer(dataUrl);
          } catch (err) {
            console.error('Failed to process image', err);
          } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };

        return (
          <Box>
            {isImage ? (
              <Box sx={{ mb: 2 }}>
                <img src={currentValue} alt="Bài làm đã chụp" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                <Button startIcon={<DeleteIcon />} color="error" size="small" sx={{ mt: 1 }} onClick={() => onSelectAnswer('')}>
                  Xoá ảnh, làm lại
                </Button>
              </Box>
            ) : (
              <TextField
                fullWidth
                multiline
                minRows={8}
                placeholder="Nhập câu trả lời của bạn tại đây..."
                value={currentValue}
                onChange={(e) => onSelectAnswer(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? 'Đang xử lý ảnh...' : 'Chụp / tải ảnh bài làm tay'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Câu tự luận sẽ được giáo viên chấm điểm thủ công sau khi bạn nộp bài.
            </Typography>
          </Box>
        );
      }

      default:
        return <Alert severity="warning">Loại câu hỏi này chưa được hỗ trợ hiển thị.</Alert>;
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        Câu {questionIndex + 1}:
      </Typography>
      <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 4, whiteSpace: 'pre-wrap' }}>
        {question.content}
      </Typography>
      {renderByType()}
    </Paper>
  );
};

export default QuestionPanel;
