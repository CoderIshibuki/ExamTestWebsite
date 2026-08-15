import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { Videocam as VideocamIcon, VideocamOff as VideocamOffIcon } from '@mui/icons-material';
import type { StudentSession } from '../../types/proctoring';
import RiskIndicator from './RiskIndicator';

interface StudentCardProps {
  student: StudentSession;
  onRequestStream?: (userId: string) => void;
  onStopStream?: (userId: string) => void;
  stream?: MediaStream | null;
}

const StudentCard = ({ student, onRequestStream, onStopStream, stream }: StudentCardProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleToggle = () => {
    if (watching) {
      onStopStream?.(student.user_id);
      setWatching(false);
    } else {
      onRequestStream?.(student.user_id);
      setWatching(true);
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {watching && (
        <Box sx={{ bgcolor: '#000', aspectRatio: '4/3', position: 'relative' }}>
          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="caption" sx={{ color: '#888' }}>Đang kết nối video...</Typography>
            </Box>
          )}
        </Box>
      )}
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {student.full_name || student.username || student.user_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trạng thái: {student.is_online ? 'Đang trực tuyến' : 'Ngoại tuyến'}
            </Typography>
          </Box>
          <RiskIndicator score={student.risk_score} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography variant="body2">
            Vi phạm: {student.violations_count}
          </Typography>
          {student.is_online && (
            <Button
              size="small"
              variant={watching ? 'contained' : 'outlined'}
              color={watching ? 'error' : 'primary'}
              startIcon={watching ? <VideocamOffIcon /> : <VideocamIcon />}
              onClick={handleToggle}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {watching ? 'Dừng xem' : 'Xem trực tiếp'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StudentCard;
