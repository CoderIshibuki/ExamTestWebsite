import { Box, Button, Typography, Skeleton, Alert, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, DialogContentText, Chip, MenuItem, FormControlLabel, Switch, Snackbar } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { adminApi } from '../api/adminApi';
import { PersonAdd as PersonAddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
}

interface CreateFormValues {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: string;
}

interface EditFormValues {
  role: string;
  is_active: boolean;
}

const ROLES = ['student', 'teacher', 'admin'];

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [tempPasswordDialog, setTempPasswordDialog] = useState<{ open: boolean; username: string; password: string }>({ open: false, username: '', password: '' });

  const { control, handleSubmit, reset } = useForm<CreateFormValues>({
    defaultValues: { username: '', email: '', full_name: '', password: '', role: 'student' },
  });

  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEdit } = useForm<EditFormValues>({
    defaultValues: { role: 'student', is_active: true },
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError('Không tải được danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: CreateFormValues) => {
    try {
      const newUser = await adminApi.createUser(data);
      setOpen(false);
      reset();
      if (newUser?.temp_password) {
        // Mật khẩu tạm sinh ngẫu nhiên (không phải "123456" cố định như trước) — chỉ
        // hiện được 1 LẦN DUY NHẤT ngay lúc này, sau đó chỉ có bản hash trong DB.
        setTempPasswordDialog({ open: true, username: newUser.username, password: newUser.temp_password });
      } else {
        setSnackbar({ open: true, message: 'Đã tạo tài khoản mới.', severity: 'success' });
      }
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to create user', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Tạo tài khoản thất bại.', severity: 'error' });
    }
  };

  const openEditDialog = (user: User) => {
    setEditUser(user);
    resetEdit({ role: user.role, is_active: user.is_active });
  };

  const onEditSubmit = async (data: EditFormValues) => {
    if (!editUser) return;
    try {
      await adminApi.updateUser(editUser.id, data);
      setEditUser(null);
      setSnackbar({ open: true, message: 'Đã cập nhật tài khoản.', severity: 'success' });
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to update user', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Cập nhật thất bại.', severity: 'error' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await adminApi.deleteUser(deleteDialog.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteDialog.id));
      setSnackbar({ open: true, message: 'Đã xoá tài khoản.', severity: 'success' });
    } catch (err: any) {
      console.error('Failed to delete user', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Xoá tài khoản thất bại.', severity: 'error' });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'Tên đăng nhập', width: 180 },
    { field: 'full_name', headerName: 'Họ tên', width: 200, flex: 1 },
    { field: 'email', headerName: 'Email', width: 260, flex: 1 },
    {
      field: 'role',
      headerName: 'Vai trò',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'admin' ? 'secondary' : params.value === 'teacher' ? 'info' : 'primary'}
          size="small"
          sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
        />
      )
    },
    {
      field: 'is_active',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value ? 'Active' : 'Disabled'} color={params.value ? 'success' : 'default'} size="small" />
      )
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="text" color="primary" size="small" sx={{ minWidth: 0, p: 1 }} onClick={() => openEditDialog(params.row)}>
            <EditIcon fontSize="small" />
          </Button>
          <Button variant="text" color="error" size="small" onClick={() => handleDeleteClick(params.row.id)} sx={{ minWidth: 0, p: 1 }}>
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold', px: 3, py: 1 }}
        >
          Thêm người dùng
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 600, width: '100%', borderRadius: 3, overflow: 'hidden' }}>
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
            slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{ border: 'none', '& .MuiDataGrid-cell:focus': { outline: 'none' } }}
          />
        )}
      </Paper>

      {/* Dialog thêm người dùng */}
      <Dialog open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Thêm người dùng mới</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <form id="create-user-form" onSubmit={handleSubmit(onSubmit)}>
            <Controller name="username" control={control} rules={{ required: true }}
              render={({ field }) => <TextField {...field} label="Tên đăng nhập" fullWidth sx={{ mb: 3, mt: 1 }} required />} />
            <Controller name="full_name" control={control}
              render={({ field }) => <TextField {...field} label="Họ tên" fullWidth sx={{ mb: 3 }} />} />
            <Controller name="email" control={control} rules={{ required: true }}
              render={({ field }) => <TextField {...field} type="email" label="Email" fullWidth sx={{ mb: 3 }} required />} />
            <Controller name="password" control={control}
              render={({ field }) => <TextField {...field} type="password" label="Mật khẩu (để trống = mật khẩu mặc định, bắt buộc đổi khi đăng nhập)" fullWidth sx={{ mb: 3 }} />} />
            <Controller name="role" control={control} rules={{ required: true }}
              render={({ field }) => (
                <TextField {...field} select label="Vai trò" fullWidth required>
                  {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              )} />
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Huỷ</Button>
          <Button type="submit" form="create-user-form" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Tạo</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog sửa vai trò / trạng thái */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 380 } } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Sửa: {editUser?.username}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <form id="edit-user-form" onSubmit={handleEditSubmit(onEditSubmit)}>
            <Controller name="role" control={editControl}
              render={({ field }) => (
                <TextField {...field} select label="Vai trò" fullWidth sx={{ mb: 2, mt: 1 }}>
                  {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              )} />
            <Controller name="is_active" control={editControl}
              render={({ field }) => (
                <FormControlLabel control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Tài khoản đang hoạt động" />
              )} />
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setEditUser(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>Huỷ</Button>
          <Button type="submit" form="edit-user-form" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Xác nhận xoá */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })} slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Xoá người dùng</DialogTitle>
        <DialogContent>
          <DialogContentText>Bạn có chắc muốn xoá vĩnh viễn người dùng này?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ borderRadius: 2, textTransform: 'none' }}>Huỷ</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Xoá</Button>
        </DialogActions>
      </Dialog>

      {/* Mật khẩu tạm chỉ hiện được 1 lần duy nhất ngay sau khi tạo — không lưu lại được
          sau đó vì server chỉ giữ bản hash, không giữ mật khẩu gốc. */}
      <Dialog open={tempPasswordDialog.open} onClose={() => setTempPasswordDialog({ open: false, username: '', password: '' })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Đã tạo tài khoản thành công</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Gửi lại thông tin sau cho <strong>{tempPasswordDialog.username}</strong> — mật khẩu tạm chỉ hiện được 1 lần, hãy sao chép ngay:
          </DialogContentText>
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, letterSpacing: 1 }}>
              {tempPasswordDialog.password}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Người dùng sẽ được yêu cầu đổi mật khẩu ngay khi đăng nhập lần đầu.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              navigator.clipboard?.writeText(tempPasswordDialog.password);
              setSnackbar({ open: true, message: 'Đã sao chép mật khẩu.', severity: 'success' });
            }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Sao chép
          </Button>
          <Button onClick={() => setTempPasswordDialog({ open: false, username: '', password: '' })} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminUsers;
