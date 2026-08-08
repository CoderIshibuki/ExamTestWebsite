import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';

interface Exam {
  id: string;
  title: string;
  status: string;
  date: string;
}

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 200 },
  { field: 'title', headerName: 'Title', width: 300 },
  { field: 'status', headerName: 'Status', width: 150 },
  { field: 'date', headerName: 'Date', width: 200 },
];

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);

  const fetchExams = async () => {
    try {
      const data = await adminApi.getExams();
      setExams(data);
    } catch (error) {
      console.error('Failed to fetch exams', error);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <Box sx={{ p: 3, height: 600, width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Exams Management
      </Typography>
      <DataGrid
        rows={exams}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[5, 10, 25]}
        checkboxSelection
      />
    </Box>
  );
};

export default AdminExams;
