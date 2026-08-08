import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Grid } from '@mui/material';
import { useProctoringData } from '../hooks/useProctoringData';
import StudentList from '../components/Proctor/StudentList';
import ViolationFeed from '../components/Proctor/ViolationFeed';
import AlertBanner from '../components/Proctor/AlertBanner';

const ProctorDashboard = () => {
  const { examId } = useParams<{ examId: string }>();
  const { students, violations, alerts, clearAlerts, loading } = useProctoringData(examId || '');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Proctor Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Exam Session: {examId}
        </Typography>
      </Box>
      
      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Grid size={{ xs: 12, md: 8, lg: 9 }} sx={{ height: '100%', overflowY: 'auto', p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Active Students ({students.length})
            </Typography>
            <StudentList students={students} />
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4, lg: 3 }} sx={{ height: '100%' }}>
          <ViolationFeed violations={violations} />
        </Grid>
      </Grid>
      
      <AlertBanner alerts={alerts} onClearAlerts={clearAlerts} />
    </Box>
  );
};

export default ProctorDashboard;
