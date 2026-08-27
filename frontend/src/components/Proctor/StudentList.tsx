import { Grid } from '@mui/material';
import StudentCard from './StudentCard';
import type { StudentSession } from '../../types/proctoring';
import { Box, Typography } from '@mui/material';

interface StudentListProps {
  students: StudentSession[];
  examId?: string;
  onRequestStream?: (userId: string) => void;
  onStopStream?: (userId: string) => void;
  streams?: Record<string, MediaStream>;
}

const StudentList = ({ students, examId, onRequestStream, onStopStream, streams }: StudentListProps) => {
  if (students.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography color="text.secondary">Không có học sinh nào trong phiên thi này.</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2.5}>
      {students.map((student) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={student.user_id}>
          <StudentCard
            student={student}
            examId={examId}
            onRequestStream={onRequestStream}
            onStopStream={onStopStream}
            stream={streams?.[student.user_id]}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default StudentList;
