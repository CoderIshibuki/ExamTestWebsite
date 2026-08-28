import { Box, Button, Typography, Skeleton, Alert, Paper, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Snackbar, IconButton, Tooltip, Grid, Avatar } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../api/adminApi';
import {
  Delete as DeleteIcon, Add as AddIcon,
  Edit as EditIcon, Quiz,
  CheckCircleOutlined, EditNote, LinearScale, CloudUpload,
} from '@mui/icons-material';
import ManualQuestionDialog from '../components/ManualQuestionDialog';
import ExcelImportDialog from '../components/ExcelImportDialog';

// Shape thật trả về từ question_service (QuestionModel)
interface Question {
  id: string;
  content: { text: string };
  type: string;
  metadata: { subject: string; difficulty: string };
  options?: any[];
  correct_answer?: any;
  category_id?: string;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm 1 đáp án',
  multiple_select: 'Trắc nghiệm nhiều đáp án',
  true_false: 'Đúng / Sai',
  matching: 'Nối cột',
  essay: 'Tự luận',
};

const TYPE_COLORS: Record<string, string> = {
  multiple_choice: '#2563EB',
  multiple_select: '#7C3AED',
  true_false: '#059669',
  matching: '#D97706',
  essay: '#E11D48',
};

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [createOpen, setCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getQuestions();
      setQuestions(data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch questions', err);
      setError('Không tải được ngân hàng câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const stats = useMemo(() => {
    const total = questions.length;
    const mc = questions.filter((q) => q.type === 'multiple_choice' || q.type === 'multiple_select').length;
    const essay = questions.filter((q) => q.type === 'essay').length;
    const other = total - mc - essay;
    return { total, mc, essay, other };
  }, [questions]);

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setCreateOpen(true);
  };

  const handleEditClick = (question: any) => {
    setEditingQuestion(question);
    setCreateOpen(true);
  };

  const handleSaveQuestion = async (payload: any) => {
    const qId = editingQuestion?.id || editingQuestion?._id;
    if (qId) {
      await adminApi.updateQuestion(qId, payload);
      setSnackbar({ open: true, message: 'Đã cập nhật câu hỏi thành công.', severity: 'success' });
    } else {
      await adminApi.createQuestion(payload);
      setSnackbar({ open: true, message: 'Đã thêm câu hỏi mới vào ngân hàng.', severity: 'success' });
    }
    setCreateOpen(false);
    setEditingQuestion(null);
    fetchQuestions();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await adminApi.deleteQuestion(deleteDialog.id);
      setQuestions((prev) => prev.filter((q: any) => (q.id || q._id) !== deleteDialog.id));
      setSnackbar({ open: true, message: 'Đã xoá câu hỏi.', severity: 'success' });
    } catch (err: any) {
      console.error('Failed to delete question', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Xoá câu hỏi thất bại.', severity: 'error' });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'content',
      headerName: 'NỘI DUNG CÂU HỎI',
      flex: 3.5,
      minWidth: 320,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {params.row.content?.text || ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'LOẠI CÂU HỎI',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => {
        const color = TYPE_COLORS[params.value] || '#475569';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ color: color, fontWeight: 700, fontSize: '0.85rem' }}>
              {TYPE_LABELS[params.value] || params.value}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'subject',
      headerName: 'MÔN HỌC / DANH MỤC',
      flex: 1.5,
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
            {params.row.metadata?.subject || 'Chung'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'HÀNH ĐỘNG',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Tooltip title="Chỉnh sửa câu hỏi">
            <IconButton
              size="medium"
              onClick={() => handleEditClick(params.row)}
              sx={{ bgcolor: '#EFF6FF', color: '#2563EB', borderRadius: 1.5, p: 1, '&:hover': { bgcolor: '#DBEAFE' } }}
            >
              <EditIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xoá câu hỏi">
            <IconButton
              size="medium"
              onClick={() => handleDeleteClick(params.row.id || params.row._id)}
              sx={{ bgcolor: '#FEF2F2', color: '#EF4444', borderRadius: 1.5, p: 1, '&:hover': { bgcolor: '#FEE2E2' } }}
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            Ngân hàng Câu hỏi
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Kho lưu trữ câu hỏi trắc nghiệm, tự luận, đúng/sai và nối cột. Hỗ trợ nhập/xuất file Excel mẫu.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ borderRadius: 1.2, textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#334155' }}
          >
            Nhập từ Excel
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={handleOpenCreate}
            sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, borderRadius: 1.2, textTransform: 'none', fontWeight: 700, px: 2 }}
          >
            Thêm câu hỏi mới
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#EFF6FF', color: '#2563EB', width: 40, height: 40, borderRadius: 1 }}>
              <Quiz />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>TỔNG SỐ CÂU HỎI</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>{stats.total}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#ECFDF5', color: '#059669', width: 40, height: 40, borderRadius: 1 }}>
              <CheckCircleOutlined />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>TRẮC NGHIỆM</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669' }}>{stats.mc}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#FDF2F8', color: '#DB2777', width: 40, height: 40, borderRadius: 1 }}>
              <EditNote />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>TỰ LUẬN</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#DB2777' }}>{stats.essay}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#FFFBEB', color: '#D97706', width: 40, height: 40, borderRadius: 1 }}>
              <LinearScale />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>ĐÚNG/SAI & NỐI CỘT</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#D97706' }}>{stats.other}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert>}

      <Paper
        elevation={0}
        sx={{
          height: 600,
          width: '100%',
          borderRadius: 1.5,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          bgcolor: '#FFFFFF',
        }}
      >
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={50} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
          </Box>
        ) : (
          <DataGrid
            rows={questions}
            columns={columns}
            rowHeight={60}
            getRowId={(row) => row.id || row._id}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 800, fontSize: '0.8rem', color: '#475569' },
            }}
          />
        )}
      </Paper>

      <ManualQuestionDialog
        open={createOpen}
        onClose={() => { setCreateOpen(false); setEditingQuestion(null); }}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        slotProps={{ paper: { sx: { borderRadius: 1.5, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Xác nhận xoá câu hỏi</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá câu hỏi này khỏi ngân hàng câu hỏi? Câu hỏi sẽ không còn xuất hiện trong các đề thi tạo mới.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}>
            Huỷ
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 700 }}>
            Xác nhận xoá
          </Button>
        </DialogActions>
      </Dialog>

      <ExcelImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImportApi={adminApi.importQuestionsBulk}
        onImportSuccess={(count) => {
          setImportDialogOpen(false);
          fetchQuestions();
          setSnackbar({ open: true, message: `Đã nhập thành công ${count} câu hỏi từ Excel vào ngân hàng.`, severity: 'success' });
        }}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 1.5 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminQuestions;
