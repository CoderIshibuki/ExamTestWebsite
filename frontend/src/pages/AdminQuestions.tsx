import { Box, Button, Typography, Skeleton, Alert, Paper, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Chip, Snackbar } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api/adminApi';
import * as xlsx from 'xlsx';
import { transformExcelRowsToQuestions } from '../utils/excelQuestionTransform';
import { CloudUpload, Delete as DeleteIcon, Add as AddIcon, Download as DownloadIcon } from '@mui/icons-material';
import ManualQuestionDialog from '../components/ManualQuestionDialog';

// Shape thật trả về từ question_service (QuestionModel), không phải {text, category, difficulty} phẳng.
interface Question {
  id: string;
  content: { text: string };
  type: string;
  metadata: { subject: string; difficulty: string };
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm 1 đáp án',
  multiple_select: 'Trắc nghiệm nhiều đáp án',
  true_false: 'Đúng/Sai',
  matching: 'Nối cột',
  essay: 'Tự luận',
};

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [createOpen, setCreateOpen] = useState(false);
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

        // Chuyển từ bảng Excel phẳng sang đúng cấu trúc JSON backend yêu cầu — trước đây
        // gửi thẳng dữ liệu thô nên luôn bị từ chối (trừ khi file có sẵn cấu trúc JSON lồng
        // nhau, không thực tế với 1 file Excel bình thường).
        const { payloads, errors } = transformExcelRowsToQuestions(rows as any[]);

        if (payloads.length === 0) {
          setError(`Không có dòng nào hợp lệ để import.${errors.length ? ' Chi tiết: ' + errors.slice(0, 3).join(' ') : ''}`);
          setLoading(false);
          return;
        }

        await adminApi.importQuestionsBulk(payloads);
        await fetchQuestions();

        if (errors.length > 0) {
          setSnackbar({ open: true, message: `Đã import ${payloads.length} câu hỏi, bỏ qua ${errors.length} dòng lỗi (xem console để biết chi tiết).`, severity: 'error' });
          console.warn('Các dòng Excel bị bỏ qua khi import:', errors);
        } else {
          setSnackbar({ open: true, message: `Đã import ${payloads.length} câu hỏi từ Excel.`, severity: 'success' });
        }
      } catch (err) {
        console.error('Failed to import questions', err);
        setError('Import thất bại. Kiểm tra lại định dạng file (dùng nút "Xuất Excel" để lấy file mẫu đúng định dạng).');
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

  const handleCreateQuestion = async (payload: any) => {
    await adminApi.createQuestion(payload);
    setCreateOpen(false);
    setSnackbar({ open: true, message: 'Đã tạo câu hỏi mới.', severity: 'success' });
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
      headerName: 'Nội dung câu hỏi',
      flex: 3.5,
      minWidth: 320,
      valueGetter: (_value, row) => row.content?.text || '',
    },
    {
      field: 'type',
      headerName: 'Loại câu hỏi',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Chip label={TYPE_LABELS[params.value] || params.value} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: 'subject',
      headerName: 'Môn học / Danh mục',
      flex: 1.5,
      minWidth: 150,
      valueGetter: (_value, row) => row.metadata?.subject || '',
      renderCell: (params) => (
        <Box sx={{ bgcolor: '#e3f2fd', color: '#1976d2', px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.85rem', fontWeight: 600 }}>
          {params.value || 'Chung'}
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => handleDeleteClick(params.row.id || params.row._id)}
          sx={{ borderRadius: 2, minWidth: 0, p: 1 }}
        >
          <DeleteIcon fontSize="small" />
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Ngân hàng câu hỏi trắc nghiệm & tự luận. Hỗ trợ import/export Excel mẫu nhanh chóng.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <input
            type="file"
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 2.5, py: 0.9, borderColor: '#CBD5E1', color: '#475569' }}
          >
            Import Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 2.5, py: 0.9, borderColor: '#CBD5E1', color: '#475569' }}
          >
            Xuất Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{
              bgcolor: '#2563EB',
              '&:hover': { bgcolor: '#1D4ED8' },
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 0.9,
              boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
            }}
          >
            Tạo câu hỏi
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Paper
        sx={{
          height: 600,
          width: '100%',
          borderRadius: 3.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 700 },
            }}
          />
        )}
      </Paper>

      <ManualQuestionDialog open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreateQuestion} />

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Xoá câu hỏi</DialogTitle>
        <DialogContent>
          <DialogContentText>Bạn có chắc muốn xoá câu hỏi này? Hành động này không thể hoàn tác.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ borderRadius: 2, textTransform: 'none' }}>Huỷ</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Xoá
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminQuestions;
