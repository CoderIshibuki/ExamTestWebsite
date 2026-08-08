import React from 'react';
import {
  Paper,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Box,
} from '@mui/material';
import type { Question } from '../context/ExamContext';

interface QuestionPanelProps {
  question: Question;
  selectedAnswer: string;
  onSelectAnswer: (answer: string) => void;
  questionIndex: number;
  totalQuestions: number;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  questionIndex,

}) => {
  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        Câu {questionIndex + 1}:
      </Typography>
      <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 4 }}>
        {question.content}
      </Typography>
      <FormControl component="fieldset" fullWidth>
        <RadioGroup value={selectedAnswer} onChange={(e) => onSelectAnswer(e.target.value)}>
          {question.options.map((option) => (
            <Box
              key={option.id}
              sx={{
                mb: 2,
                p: 1,
                border: '1px solid',
                borderColor: selectedAnswer === option.id ? 'primary.main' : 'divider',
                borderRadius: 1,
                bgcolor: selectedAnswer === option.id ? 'primary.light' : 'transparent',
                transition: '0.2s',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <FormControlLabel
                value={option.id}
                control={<Radio />}
                label={<Typography sx={{ fontSize: '1.05rem' }}>{option.text}</Typography>}
                sx={{ width: '100%', m: 0 }}
              />
            </Box>
          ))}
        </RadioGroup>
      </FormControl>
    </Paper>
  );
};

export default QuestionPanel;
