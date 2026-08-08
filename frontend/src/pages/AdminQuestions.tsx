import { Box, Typography, Button, Skeleton, Alert, Paper, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api/adminApi';
import * as xlsx from 'xlsx';
import { CloudUpload, Delete as DeleteIcon, HelpOutline as HelpIcon } from '@mui/icons-material';

interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: string;
}

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, id: string | null}>({open: false, id: null});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getQuestions();
      setQuestions(data || []);
      setError('');
    } catch (error) {
      console.error('Failed to fetch questions', error);
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) return;
        
        const workbook = xlsx.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        
        await adminApi.importQuestionsBulk(jsonData);
        await fetchQuestions();
      } catch (error) {
        console.error('Failed to import questions', error);
        setError('Failed to import questions. Ensure file format is correct.');
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = () => {
    if (deleteDialog.id) {
       setQuestions(questions.filter(q => q.id !== deleteDialog.id));
    }
    setDeleteDialog({ open: false, id: null });
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 200 },
    { field: 'text', headerName: 'Question Text', flex: 1, minWidth: 300 },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ bgcolor: '#e3f2fd', color: '#1976d2', px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.85rem', fontWeight: 600 }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: 'difficulty', 
      headerName: 'Difficulty', 
      width: 150,
      renderCell: (params) => {
        let color = '#757575';
        let bg = '#f5f5f5';
        if (params.value?.toLowerCase() === 'easy') { color = '#2e7d32'; bg = '#e8f5e9'; }
        else if (params.value?.toLowerCase() === 'medium') { color = '#ed6c02'; bg = '#fff3e0'; }
        else if (params.value?.toLowerCase() === 'hard') { color = '#d32f2f'; bg = '#ffebee'; }
        return (
          <Box sx={{ bgcolor: bg, color: color, px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>
            {params.value}
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button 
          variant="outlined" 
          color="error" 
          size="small"
          onClick={() => handleDeleteClick(params.row.id)}
          sx={{ borderRadius: 2, minWidth: 0, p: 1 }}
        >
          <DeleteIcon fontSize="small" />
        </Button>
      )
    }
  ];

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HelpIcon sx={{ fontSize: 36, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#2c3e50' }}>
            Questions Bank
          </Typography>
        </Box>
        <Box>
          <input
            type="file"
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button 
            variant="contained" 
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ 
              borderRadius: 3, 
              textTransform: 'none', 
              fontWeight: 'bold',
              px: 3, py: 1,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
            }}
          >
            Import Excel
          </Button>
        </Box>
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
            rows={questions}
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
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#e74c3c' }}>Delete Question</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this question? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminQuestions;
