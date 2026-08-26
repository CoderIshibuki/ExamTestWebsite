import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Chip, Avatar } from '@mui/material';
import { Videocam as VideocamIcon, VideocamOff as VideocamOffIcon, Lan as LanIcon } from '@mui/icons-material';
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

  const displayName = student.full_name || student.username || 'Thí sinh';
  const username = student.username || 'student';
  const clientIp = student.ip || '127.0.0.1';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
      {watching && (
        <Box sx={{ bgcolor: '#000', aspectRatio: '4/3', position: 'relative', borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' }}>
          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Đang kết nối video...</Typography>
            </Box>
          )}
        </Box>
      )}
      <CardContent sx={{ p: 2.5 }}>
        {/* Header: Avatar, Name, Username, Risk Score */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#2563EB', color: '#fff', width: 40, height: 40, fontWeight: 700, fontSize: '0.9rem' }}>
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 600, display: 'block' }}>
                @{username}
              </Typography>
            </Box>
          </Box>
          <RiskIndicator score={student.risk_score} />
        </Box>

        {/* IP Address & Network status badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, p: 1, bgcolor: '#0f172a', borderRadius: 2, border: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#94a3b8' }}>
            <LanIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#cbd5e1' }}>
              IP: {clientIp}
            </Typography>
          </Box>
          <Chip
            label={student.is_online ? 'Đang thi' : 'Mất kết nối'}
            size="small"
            color={student.is_online ? 'success' : 'default'}
            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
          />
        </Box>

        {/* Footer: Violations count and Video toggle button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid #334155' }}>
          <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 500 }}>
            Vi phạm:{' '}
            <Box component="span" sx={{ color: student.violations_count > 0 ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>
              {student.violations_count}
            </Box>
          </Typography>
          {student.is_online && (
            <Button
              size="small"
              variant={watching ? 'contained' : 'outlined'}
              color={watching ? 'error' : 'primary'}
              startIcon={watching ? <VideocamOffIcon /> : <VideocamIcon />}
              onClick={handleToggle}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
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
