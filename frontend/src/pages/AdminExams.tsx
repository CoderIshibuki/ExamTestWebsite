import { Box, Typography, Button, Skeleton, Alert, Paper, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import { Visibility as VisibilityIcon, Delete as DeleteIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Exam {
  id: string;
  title: string;
  status: string;
  date: string;
}

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, id: string | null}>({open: false, id: null});
  const navigate = useNavigate();

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getExams();
      setExams(data || []);
      setError('');
    } catch (error) {
      console.error('Failed to fetch exams', error);
      setError('Failed to load exams. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDeleteClick = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    if (deleteDialog.id) {
       setExams(exams.filter(e => e.id !== deleteDialog.id));
    }
    setDeleteDialog({ open: false, id: null });
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Exam ID', width: 220, flex: 1 },
    { field: 'title', headerName: 'Title', width: 300, flex: 2 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ 
          px: 2, py: 0.5, 
          borderRadius: 4, 
          bgcolor: params.value === 'active' ? '#e8f5e9' : '#f5f5f5',
          color: params.value === 'active' ? '#2e7d32' : '#757575',
          fontWeight: 'bold',
          textTransform: 'capitalize'
        }}>
          {params.value || 'Pending'}
        </Box>
      )
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 250,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <Button 
            variant="outlined" 
            color="primary" 
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => navigate(`/proctor/${params.row.id}`)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Proctor
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteClick(params.row.id)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Delete
          </Button>
        </Box>
      )
    },
  ];

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <AssignmentIcon sx={{ fontSize: 36, color: 'primary.main', mr: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#2c3e50' }}>
          Exams Management
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 600, width: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={50} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
          </Box>
        ) : (
          <DataGrid
            rows={exams}
            columns={columns}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 10 } },
            }}
            pageSizeOptions={[5, 10, 25]}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
              '& .MuiDataGrid-row:hover': { bgcolor: '#f5f7fa' }
            }}
          />
        )}
      </Paper>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#e74c3c' }}>Delete Exam</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this exam? This action is permanent and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}>
            Delete Exam
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminExams;
