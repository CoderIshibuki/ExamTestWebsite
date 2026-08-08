import { Card, CardContent, Typography, Box } from '@mui/material';
import type { StudentSession } from '../../types/proctoring';
import RiskIndicator from './RiskIndicator';

interface StudentCardProps {
  student: StudentSession;
}

const StudentCard = ({ student }: StudentCardProps) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {student.full_name || student.username || student.user_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status: {student.is_online ? 'Online' : 'Offline'}
            </Typography>
          </Box>
          <RiskIndicator score={student.risk_score} />
        </Box>
        
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="body2">
            Violations: {student.violations_count}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StudentCard;
