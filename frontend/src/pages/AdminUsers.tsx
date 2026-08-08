import { Box, Typography, Button, Skeleton, Alert, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, DialogContentText, Chip } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { adminApi } from '../api/adminApi';
import { People as PeopleIcon, PersonAdd as PersonAddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, id: string | null}>({open: false, id: null});
  
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { name: '', email: '', role: '' }
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data || []);
      setError('');
    } catch (error) {
      console.error('Failed to fetch users', error);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: any) => {
    setUsers([...users, { id: Math.random().toString(), ...data }]);
    setOpen(false);
    reset();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = () => {
    if (deleteDialog.id) {
       setUsers(users.filter(u => u.id !== deleteDialog.id));
    }
    setDeleteDialog({ open: false, id: null });
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 120 },
    { field: 'name', headerName: 'Name', width: 250, flex: 1 },
    { field: 'email', headerName: 'Email', width: 300, flex: 1 },
    { 
      field: 'role', 
      headerName: 'Role', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value?.toLowerCase() === 'admin' ? 'secondary' : 'primary'} 
          size="small" 
          sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="text" color="primary" size="small" sx={{ minWidth: 0, p: 1 }}><EditIcon fontSize="small" /></Button>
          <Button variant="text" color="error" size="small" onClick={() => handleDeleteClick(params.row.id)} sx={{ minWidth: 0, p: 1 }}>
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PeopleIcon sx={{ fontSize: 36, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#2c3e50' }}>
            Users Management
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<PersonAddIcon />}
          onClick={() => setOpen(true)}
          sx={{ 
            borderRadius: 3, 
            textTransform: 'none', 
            fontWeight: 'bold',
            px: 3, py: 1,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
          }}
        >
          Add User
        </Button>
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
            rows={users}
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

      {/* Add User Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add New User</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <form id="edit-user-form" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <TextField {...field} label="Full Name" fullWidth sx={{ mb: 3, mt: 1 }} required />}
            />
            <Controller
              name="email"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <TextField {...field} type="email" label="Email Address" fullWidth sx={{ mb: 3 }} required />}
            />
            <Controller
              name="role"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <TextField {...field} label="Role (Admin/Student)" fullWidth sx={{ mb: 1 }} required />}
            />
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button type="submit" form="edit-user-form" variant="contained" sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}>Save User</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })} slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#e74c3c' }}>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete this user?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers;
