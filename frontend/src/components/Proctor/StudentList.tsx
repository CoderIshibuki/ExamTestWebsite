import { Grid } from '@mui/material';
import StudentCard from './StudentCard';
import type { StudentSession } from '../../types/proctoring';
import { Box, Typography } from '@mui/material';

interface StudentListProps {
  students: StudentSession[];
}

const StudentList = ({ students }: StudentListProps) => {
  if (students.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography color="text.secondary">No students in this session.</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {students.map((student) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={student.user_id}>
          <StudentCard student={student} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StudentList;
