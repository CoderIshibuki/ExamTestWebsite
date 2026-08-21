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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold' }}>
          Thêm danh mục
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Danh mục giúp tổ chức ngân hàng câu hỏi theo chủ đề (VD: "Toán 10 - Đại số", "Lịch sử thế giới"), thay vì chỉ gõ tay
        tên môn học tự do khi tạo câu hỏi.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          </Box>
        ) : categories.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">Chưa có danh mục nào. Bấm "Thêm danh mục" để tạo mới.</Typography>
          </Box>
        ) : (
          <List>
            {categories.map((cat) => (
              <ListItem
                key={cat.id}
                divider
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => openEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton color="error" onClick={() => setDeleteDialog({ open: true, id: cat.id })}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                }
              >
                <ListItemText primary={cat.name} secondary={cat.description} />
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
