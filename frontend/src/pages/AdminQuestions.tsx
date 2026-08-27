import { Box, Button, Typography, Skeleton, Alert, Paper, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Chip, Snackbar, IconButton, Tooltip, Grid, Avatar } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect, useRef, useMemo } from 'react';
import { adminApi } from '../api/adminApi';
import * as xlsx from 'xlsx';
import { transformExcelRowsToQuestions } from '../utils/excelQuestionTransform';
import {
  CloudUpload, Delete as DeleteIcon, Add as AddIcon,
  Download as DownloadIcon, Edit as EditIcon, Quiz,
  CheckCircleOutlined, EditNote, LinearScale,
} from '@mui/icons-material';
import ManualQuestionDialog from '../components/ManualQuestionDialog';

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

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  multiple_choice: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  multiple_select: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  true_false: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  matching: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  essay: { bg: '#FDF2F8', color: '#DB2777', border: '#FBCFE8' },
};

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [createOpen, setCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const rows = xlsx.utils.sheet_to_json(worksheet);

        const { payloads, errors } = transformExcelRowsToQuestions(rows as any[]);

        if (payloads.length === 0) {
          setError(`Không có dòng nào hợp lệ để import.${errors.length ? ' Chi tiết: ' + errors.slice(0, 3).join(' ') : ''}`);
          setLoading(false);
          return;
        }

        await adminApi.importQuestionsBulk(payloads);
        await fetchQuestions();

        if (errors.length > 0) {
          setSnackbar({ open: true, message: `Đã import ${payloads.length} câu hỏi, bỏ qua ${errors.length} dòng lỗi.`, severity: 'error' });
          console.warn('Các dòng Excel bị bỏ qua khi import:', errors);
        } else {
          setSnackbar({ open: true, message: `Đã import thành công ${payloads.length} câu hỏi từ Excel.`, severity: 'success' });
        }
      } catch (err) {
        console.error('Failed to import questions', err);
        setError('Import thất bại. Kiểm tra lại định dạng file (dùng nút "Xuất Excel" để lấy file mẫu).');
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const blob = await adminApi.exportQuestions();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ngan_hang_cau_hoi_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export questions', err);
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Xuất Excel thất bại.', severity: 'error' });
    }
  };

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
      valueGetter: (_value, row) => row.content?.text || '',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'type',
      headerName: 'LOẠI CÂU HỎI',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => {
        const theme = TYPE_COLORS[params.value] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
        return (
          <Box sx={{ bgcolor: theme.bg, color: theme.color, border: `1px solid ${theme.border}`, px: 1.2, py: 0.4, borderRadius: 1, fontSize: '0.75rem', fontWeight: 700 }}>
            {TYPE_LABELS[params.value] || params.value}
          </Box>
        );
      },
    },
    {
      field: 'subject',
      headerName: 'MÔN HỌC / DANH MỤC',
      flex: 1.5,
      minWidth: 160,
      valueGetter: (_value, row) => row.metadata?.subject || '',
      renderCell: (params) => (
        <Chip
          label={params.value || 'Chung'}
          size="small"
          sx={{ bgcolor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', fontWeight: 600, fontSize: '0.75rem', borderRadius: 1 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'HÀNH ĐỘNG',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title="Chỉnh sửa câu hỏi">
            <IconButton
              size="small"
              onClick={() => handleEditClick(params.row)}
              sx={{ bgcolor: '#EFF6FF', color: '#2563EB', borderRadius: 1, p: 0.7, '&:hover': { bgcolor: '#DBEAFE' } }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xoá câu hỏi">
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(params.row.id || params.row._id)}
              sx={{ bgcolor: '#FEF2F2', color: '#EF4444', borderRadius: 1, p: 0.7, '&:hover': { bgcolor: '#FEE2E2' } }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
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
          <input
            type="file"
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExport}
            sx={{ borderRadius: 1.2, textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#334155' }}
          >
            Xuất Excel
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
            onClick={() => fileInputRef.current?.click()}
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
            getRowId={(row) => row.id || row._id}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
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

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 1.5 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminQuestions;
