import React from 'react';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface TimerProps {
  timeLeft: number;
  isWarning: boolean;
  formattedTime: string;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, isWarning, formattedTime }) => {
  let color = 'success.main';
  if (timeLeft <= 60) color = 'error.main';
  else if (isWarning) color = 'warning.main';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', color, gap: 1 }}>
      <AccessTimeIcon sx={{ animation: isWarning ? 'pulse 1s infinite' : 'none' }} />
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {formattedTime}
      </Typography>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default Timer;
