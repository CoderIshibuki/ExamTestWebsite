import { Box, Button, Skeleton, Alert, Paper, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, TextField, Snackbar } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { adminApi } from '../api/adminApi';
import { Visibility as VisibilityIcon, Delete as DeleteIcon, Add as AddIcon, Publish as PublishIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ManageExamDialog from '../components/ManageExamDialog';

interface Exam {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
}

interface ExamFormValues {
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  max_attempts: number;
}

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [createOpen, setCreateOpen] = useState(false);
  const [manageDialog, setManageDialog] = useState<{ open: boolean; examId: string | null; title?: string }>({ open: false, examId: null });
  const navigate = useNavigate();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ExamFormValues>({
    defaultValues: { title: '', description: '', duration_minutes: 60, passing_score: 50, max_attempts: 1 },
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getExams();
      setExams(data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch exams', err);
      setError('Không tải được danh sách đề thi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const onCreateSubmit = async (data: ExamFormValues) => {
    try {
      const newExam = await adminApi.createExam({ ...data, is_public: true });
      setCreateOpen(false);
      reset();
      setSnackbar({ open: true, message: 'Đã tạo đề thi. Hãy thêm câu hỏi trước khi công bố.', severity: 'success' });
      fetchExams();
      if (newExam?.id) {
        setManageDialog({ open: true, examId: newExam.id, title: data.title });
      }
    } catch (err: any) {
      console.error('Failed to create exam', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Tạo đề thi thất bại.', severity: 'error' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await adminApi.deleteExam(deleteDialog.id);
      setExams((prev) => prev.filter((e) => e.id !== deleteDialog.id));
      setSnackbar({ open: true, message: 'Đã xoá đề thi.', severity: 'success' });
    } catch (err: any) {
      console.error('Failed to delete exam', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Xoá đề thi thất bại.', severity: 'error' });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await adminApi.publishExam(id);
      setSnackbar({ open: true, message: 'Đã công bố đề thi.', severity: 'success' });
      fetchExams();
    } catch (err: any) {
      console.error('Failed to publish exam', err);
      const detail = err?.response?.data?.detail;
      setSnackbar({ open: true, message: detail || 'Công bố đề thi thất bại.', severity: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Exam ID', width: 220, flex: 1 },
    { field: 'title', headerName: 'Tiêu đề', width: 260, flex: 2 },
    { field: 'duration_minutes', headerName: 'Thời lượng (phút)', width: 150 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      renderCell: (params) => (
        <Box sx={{
          px: 2, py: 0.5,
          borderRadius: 4,
          bgcolor: params.value === 'published' ? '#e8f5e9' : '#f5f5f5',
          color: params.value === 'published' ? '#2e7d32' : '#757575',
          fontWeight: 'bold',
          textTransform: 'capitalize'
        }}>
          {params.value || 'draft'}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 460,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<SettingsIcon />}
            onClick={() => setManageDialog({ open: true, examId: params.row.id, title: params.row.title })}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Quản lý
          </Button>
          {params.row.status !== 'published' && (
            <Button
              variant="outlined"
              color="success"
              size="small"
              startIcon={<PublishIcon />}
              onClick={() => handlePublish(params.row.id)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Publish
            </Button>
          )}
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => navigate(`/proctor/exam/${params.row.id}`)}
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
            Xoá
          </Button>
        </Box>
      )
    },
  ];

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold', px: 3, py: 1 }}>
          Tạo đề thi mới
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
            rows={exams}
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

      {/* Dialog tạo đề thi mới */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Tạo đề thi mới</DialogTitle>
        <form onSubmit={handleSubmit(onCreateSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: 'Vui lòng nhập tiêu đề' }}
              render={({ field }) => (
                <TextField {...field} label="Tiêu đề đề thi" fullWidth error={!!errors.title} helperText={errors.title?.message} />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => <TextField {...field} label="Mô tả" fullWidth multiline rows={3} />}
            />
            <Controller
              name="duration_minutes"
              control={control}
              rules={{ required: true, min: 1 }}
              render={({ field }) => (
                <TextField {...field} label="Thời lượng (phút)" type="number" fullWidth
                  onChange={(e) => field.onChange(Number(e.target.value))} />
              )}
            />
            <Controller
              name="passing_score"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Điểm đạt (%)" type="number" fullWidth
                  onChange={(e) => field.onChange(Number(e.target.value))} />
              )}
            />
            <Controller
              name="max_attempts"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Số lần làm bài tối đa" type="number" fullWidth
                  onChange={(e) => field.onChange(Number(e.target.value))} />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Huỷ</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Tạo đề thi</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })} slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Xoá đề thi</DialogTitle>
        <DialogContent>
          <DialogContentText>Bạn có chắc muốn xoá đề thi này? Hành động này không thể hoàn tác.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ borderRadius: 2, textTransform: 'none' }}>Huỷ</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>Xoá đề thi</Button>
        </DialogActions>
      </Dialog>

      <ManageExamDialog
        open={manageDialog.open}
        onClose={() => setManageDialog({ open: false, examId: null })}
        examId={manageDialog.examId}
        examTitle={manageDialog.title}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminExams;
