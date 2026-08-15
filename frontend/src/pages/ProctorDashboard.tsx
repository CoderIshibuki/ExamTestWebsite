import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Grid, Paper, Alert } from '@mui/material';
import { useProctoringData } from '../hooks/useProctoringData';
import { useProctorStreamViewer } from '../hooks/useProctorWebSocket';
import StudentList from '../components/Proctor/StudentList';
import ViolationFeed from '../components/Proctor/ViolationFeed';
import AlertBanner from '../components/Proctor/AlertBanner';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

const ProctorDashboard = () => {
  const { examId } = useParams<{ examId: string }>();
  const { students, violations, alerts, clearAlerts, loading, unauthorized, error, socket } = useProctoringData(examId || '');
  const { streams, requestStream, stopStream } = useProctorStreamViewer(socket);

  if (unauthorized) {
    return (
      <Box sx={{ p: 4, height: '100vh', bgcolor: '#0f172a' }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          Unauthorized
          You are not assigned as a proctor for this exam, or the exam does not exist.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f172a' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#38bdf8', mb: 3 }} />
        <Typography variant="h6" sx={{ color: '#94a3b8' }}>Initializing Proctoring Session...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, height: '100vh', bgcolor: '#0f172a' }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          Connection Error
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: '#f8fafc' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', bgcolor: '#0f172a' }}>
        <VisibilityIcon sx={{ fontSize: 32, color: '#38bdf8', mr: 2 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
            Live Proctoring Center
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e', display: 'inline-block' }} />
            Session ID: {examId}
          </Typography>
        </Box>
      </Box>
      
      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Grid size={{ xs: 12, md: 8, lg: 9 }} sx={{ height: '100%', overflowY: 'auto', p: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e2e8f0' }}>
              Monitoring {students.length} Student{students.length !== 1 && 's'}
            </Typography>
          </Box>
          
          {students.length > 0 ? (
            <StudentList
              students={students}
              onRequestStream={(userId) => requestStream(examId || '', userId)}
              onStopStream={stopStream}
              streams={streams}
            />
          ) : (
            <Paper sx={{ p: 8, textAlign: 'center', bgcolor: '#1e293b', border: '1px dashed #334155', borderRadius: 3 }}>
              <VideocamOffIcon sx={{ fontSize: 64, color: '#475569', mb: 2 }} />
              <Typography variant="h5" sx={{ color: '#94a3b8', fontWeight: 600, mb: 1 }}>No Students Online</Typography>
              <Typography sx={{ color: '#64748b' }}>Waiting for students to join the examination session...</Typography>
            </Paper>
          )}
        </Grid>
        
        <Grid size={{ xs: 12, md: 4, lg: 3 }} sx={{ height: '100%', borderLeft: '1px solid #1e293b', bgcolor: '#162032' }}>
          <ViolationFeed violations={violations} />
        </Grid>
      </Grid>
      
      <AlertBanner alerts={alerts} onClearAlerts={clearAlerts} />
    </Box>
  );
};

export default ProctorDashboard;
