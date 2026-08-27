import { useEffect, useRef, useState } from 'react';
import {
  Card, CardContent, Typography, Box, Button, Chip, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Tooltip,
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Lan as LanIcon,
  Fullscreen as FullscreenIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';
import type { StudentSession } from '../../types/proctoring';
import RiskIndicator from './RiskIndicator';
import apiClient from '../../api/apiClient';

interface StudentCardProps {
  student: StudentSession;
  examId?: string;
  onRequestStream?: (userId: string) => void;
  onStopStream?: (userId: string) => void;
  stream?: MediaStream | null;
}

const StudentCard = ({ student, examId, onRequestStream, onStopStream, stream }: StudentCardProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fullVideoRef = useRef<HTMLVideoElement | null>(null);
  const [watching, setWatching] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  // Form xử lý kỷ luật
  const [actionType, setActionType] = useState<'penalty_score' | 'penalty_time' | 'warning' | 'terminate'>('warning');
  const [penaltyPercent, setPenaltyPercent] = useState(10);
  const [penaltyMinutes, setPenaltyMinutes] = useState(5);
  const [reason, setReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    if (fullVideoRef.current && stream) {
      fullVideoRef.current.srcObject = stream;
    }
  }, [stream, watching, fullscreenOpen]);

  const handleToggle = () => {
    if (watching) {
      onStopStream?.(student.user_id);
      setWatching(false);
    } else {
      onRequestStream?.(student.user_id);
      setWatching(true);
    }
  };

  const handleOpenFullscreen = () => {
    if (!watching) {
      onRequestStream?.(student.user_id);
      setWatching(true);
    }
    setFullscreenOpen(true);
  };

  const handleSendDisciplinaryAction = async () => {
    if (!examId) return;
    setSubmittingAction(true);
    try {
      let actionName = 'warning';
      if (actionType === 'terminate') actionName = 'terminate';
      else if (actionType === 'penalty_time') actionName = 'time_penalty';
      else if (actionType === 'penalty_score') actionName = 'score_penalty';

      await apiClient.post(`/v1/realtime/exams/${examId}/proctor/action`, {
        user_id: student.user_id,
        action: actionName,
        reason: reason || (actionType === 'terminate' ? 'Vi phạm quy chế phòng thi nghiêm trọng' : 'Nhắc nhở tập trung làm bài'),
        penalty_percent: actionType === 'penalty_score' ? penaltyPercent : 0,
        penalty_minutes: actionType === 'penalty_time' ? penaltyMinutes : 0,
      });

      setActionStatus('Đã gửi lệnh xử lý thành công!');
      setTimeout(() => {
        setActionStatus(null);
        setActionDialogOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to send proctor action:', err);
      setActionStatus('Gửi lệnh thất bại.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const displayName = student.full_name || student.username || 'Thí sinh';
  const username = student.username || 'student';
  const clientIp = student.ip || '127.0.0.1';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
      {watching && (
        <Box sx={{ bgcolor: '#000', aspectRatio: '16/9', position: 'relative', borderTopLeftRadius: 6, borderTopRightRadius: 6, overflow: 'hidden' }}>
          {stream ? (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Đang kết nối luồng camera...</Typography>
            </Box>
          )}
          <Tooltip title="Xem toàn màn hình">
            <IconButton
              size="small"
              onClick={handleOpenFullscreen}
              sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' } }}
            >
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <CardContent sx={{ p: 2 }}>
        {/* Header: Avatar, Name, Username, Risk Score */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Avatar sx={{ bgcolor: '#2563EB', color: '#fff', width: 36, height: 36, fontWeight: 700, fontSize: '0.85rem', borderRadius: 1 }}>
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, p: 0.8, px: 1, bgcolor: '#0f172a', borderRadius: 1, border: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#94a3b8' }}>
            <LanIcon sx={{ fontSize: 15, color: '#38bdf8' }} />
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#cbd5e1', fontSize: '0.72rem' }}>
              IP: {clientIp}
            </Typography>
          </Box>
          <Chip
            label={student.is_online ? 'Đang thi' : 'Mất kết nối'}
            size="small"
            color={student.is_online ? 'success' : 'default'}
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, borderRadius: 0.8 }}
          />
        </Box>

        {/* Violations Count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1, borderTop: '1px solid #334155' }}>
          <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
            Số vi phạm:{' '}
            <Box component="span" sx={{ color: student.violations_count > 0 ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>
              {student.violations_count}
            </Box>
          </Typography>
        </Box>

        {/* Action Controls */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          {student.is_online && (
            <Button
              size="small"
              fullWidth
              variant={watching ? 'contained' : 'outlined'}
              color={watching ? 'error' : 'primary'}
              startIcon={watching ? <VideocamOffIcon sx={{ fontSize: 16 }} /> : <VideocamIcon sx={{ fontSize: 16 }} />}
              onClick={handleToggle}
              sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', py: 0.6 }}
            >
              {watching ? 'Tắt cam' : 'Xem cam'}
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<GavelIcon sx={{ fontSize: 16 }} />}
            onClick={() => setActionDialogOpen(true)}
            sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', py: 0.6, whiteSpace: 'nowrap' }}
          >
            Kỷ luật
          </Button>
        </Box>
      </CardContent>

      {/* Fullscreen Video Modal */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { bgcolor: '#0f172a', color: '#fff', borderRadius: 1.5, border: '1px solid #334155' } } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #1e293b' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#2563EB', width: 36, height: 36, fontWeight: 700 }}>
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{displayName} (@{username})</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>IP: {clientIp} • Phòng thi: {examId}</Typography>
            </Box>
          </Box>
          <RiskIndicator score={student.risk_score} />
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000', minHeight: 480 }}>
          {stream ? (
            <video ref={fullVideoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          ) : (
            <Typography sx={{ color: '#94a3b8' }}>Đang nạp luồng video chất lượng cao...</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #1e293b', justifyContent: 'space-between' }}>
          <Button
            color="warning"
            variant="outlined"
            startIcon={<GavelIcon />}
            onClick={() => { setFullscreenOpen(false); setActionDialogOpen(true); }}
            sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 700 }}
          >
            Xử lý kỷ luật thí sinh này
          </Button>
          <Button onClick={() => setFullscreenOpen(false)} variant="contained" sx={{ borderRadius: 1, textTransform: 'none' }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disciplinary Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 1.5 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: '#0F172A' }}>
          <GavelIcon color="warning" /> Xử lý kỷ luật: {displayName}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            select
            label="Hình thức kỷ luật"
            size="small"
            fullWidth
            value={actionType}
            onChange={(e) => setActionType(e.target.value as any)}
          >
            <MenuItem value="warning">🚨 Gửi cảnh cáo trực tiếp lên màn hình</MenuItem>
            <MenuItem value="penalty_time">⏱️ Phạt trừ thời gian làm bài thi</MenuItem>
            <MenuItem value="penalty_score">📉 Trừ % điểm thi trực tiếp vào bài</MenuItem>
            <MenuItem value="terminate" sx={{ color: 'error.main', fontWeight: 700 }}>🚫 Cấm thi / Đuổi khỏi phòng thi</MenuItem>
          </TextField>

          {actionType === 'penalty_score' && (
            <TextField
              select
              label="Số % điểm bị trừ"
              size="small"
              fullWidth
              value={penaltyPercent}
              onChange={(e) => setPenaltyPercent(Number(e.target.value))}
            >
              <MenuItem value={10}>Trừ 10% điểm</MenuItem>
              <MenuItem value={20}>Trừ 20% điểm</MenuItem>
              <MenuItem value={30}>Trừ 30% điểm</MenuItem>
              <MenuItem value={50}>Trừ 50% điểm (Vi phạm nặng)</MenuItem>
              <MenuItem value={100}>Trừ 100% điểm (0 điểm)</MenuItem>
            </TextField>
          )}

          {actionType === 'penalty_time' && (
            <TextField
              select
              label="Số phút bị phạt trừ"
              size="small"
              fullWidth
              value={penaltyMinutes}
              onChange={(e) => setPenaltyMinutes(Number(e.target.value))}
            >
              <MenuItem value={5}>Trừ 5 phút</MenuItem>
              <MenuItem value={10}>Trừ 10 phút</MenuItem>
              <MenuItem value={15}>Trừ 15 phút</MenuItem>
              <MenuItem value={30}>Trừ 30 phút</MenuItem>
            </TextField>
          )}

          <TextField
            label="Lý do xử lý kỷ luật"
            size="small"
            fullWidth
            multiline
            rows={2}
            placeholder="Ví dụ: Rời khỏi tầm camera nhiều lần, sử dụng tài liệu..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          {actionStatus && (
            <Typography variant="body2" sx={{ fontWeight: 700, color: actionStatus.includes('thành công') ? 'success.main' : 'error.main' }}>
              {actionStatus}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setActionDialogOpen(false)} sx={{ borderRadius: 1, textTransform: 'none' }}>Huỷ</Button>
          <Button
            variant="contained"
            color={actionType === 'terminate' ? 'error' : 'warning'}
            onClick={handleSendDisciplinaryAction}
            disabled={submittingAction}
            sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 700 }}
          >
            {actionType === 'terminate' ? 'Xác nhận Đuổi thi' : 'Áp dụng kỷ luật'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default StudentCard;
