import { useEffect, useState } from 'react';
import {
  Box, Button, Paper, Skeleton, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, TextField, List, ListItem, ListItemText, IconButton, Snackbar, Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { adminApi } from '../api/adminApi';

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCategories();
      setCategories(data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setError('Không tải được danh mục câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setName('');
    setDescription('');
    setDialog({ open: true, editing: null });
  };

  const openEdit = (cat: Category) => {
    setName(cat.name);
    setDescription(cat.description || '');
    setDialog({ open: true, editing: cat });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập tên danh mục.', severity: 'error' });
      return;
    }
    try {
      if (dialog.editing) {
        await adminApi.updateCategory(dialog.editing.id, { name, description });
        setSnackbar({ open: true, message: 'Đã cập nhật danh mục.', severity: 'success' });
      } else {
        await adminApi.createCategory({ name, description });
        setSnackbar({ open: true, message: 'Đã tạo danh mục mới.', severity: 'success' });
      }
      setDialog({ open: false, editing: null });
      fetchCategories();
    } catch (err: any) {
      console.error('Failed to save category', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Lưu danh mục thất bại.', severity: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await adminApi.deleteCategory(deleteDialog.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteDialog.id));
      setSnackbar({ open: true, message: 'Đã xoá danh mục.', severity: 'success' });
    } catch (err: any) {
      console.error('Failed to delete category', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Xoá danh mục thất bại.', severity: 'error' });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Tổ chức ngân hàng câu hỏi theo từng chủ đề hoặc môn học cụ thể.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{
            bgcolor: '#2563EB',
            '&:hover': { bgcolor: '#1D4ED8' },
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            py: 1,
            boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
          }}
        >
          Thêm danh mục
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Paper
        sx={{
          borderRadius: 3.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          bgcolor: '#FFFFFF',
        }}
      >
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          </Box>
        ) : categories.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography sx={{ color: '#64748B' }}>Chưa có danh mục nào. Bấm "Thêm danh mục" để tạo mới.</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {categories.map((cat) => (
              <ListItem
                key={cat.id}
                divider
                sx={{ py: 2, px: 3 }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => openEdit(cat)} sx={{ color: '#2563EB' }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton color="error" onClick={() => setDeleteDialog({ open: true, id: cat.id })}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{cat.name}</Typography>}
                  secondary={<Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{cat.description || 'Không có mô tả'}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, editing: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{dialog.editing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Tên danh mục" value={name} onChange={(e) => setName(e.target.value)} fullWidth required autoFocus />
          <TextField label="Mô tả (tuỳ chọn)" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialog({ open: false, editing: null })} sx={{ borderRadius: 2, textTransform: 'none' }}>Huỷ</Button>
          <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2, textTransform: 'none' }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Xoá danh mục</DialogTitle>
        <DialogContent>
          <DialogContentText>Bạn có chắc muốn xoá danh mục này? Các câu hỏi đã gán danh mục này sẽ không bị xoá.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ borderRadius: 2, textTransform: 'none' }}>Huỷ</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Xoá</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
