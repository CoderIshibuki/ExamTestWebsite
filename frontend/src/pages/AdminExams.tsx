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

import { Button } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const columns = (navigate: any): GridColDef[] => [
  { field: 'id', headerName: 'ID', width: 220 },
  { field: 'title', headerName: 'Title', width: 300 },
  { field: 'status', headerName: 'Status', width: 120 },
  { 
    field: 'actions', 
    headerName: 'Actions', 
    width: 150,
    renderCell: (params) => (
      <Button 
        variant="contained" 
        color="error" 
        size="small"
        startIcon={<VisibilityIcon />}
        onClick={() => navigate(`/proctor/${params.row.id}`)}
      >
        Proctor
      </Button>
    )
  },
];

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const navigate = useNavigate();

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
        columns={columns(navigate)}
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
