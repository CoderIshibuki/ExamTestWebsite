import { Box, Typography, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api/adminApi';
import * as xlsx from 'xlsx';

interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: string;
}

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 200 },
  { field: 'text', headerName: 'Question Text', width: 400 },
  { field: 'category', headerName: 'Category', width: 150 },
  { field: 'difficulty', headerName: 'Difficulty', width: 150 },
];

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchQuestions = async () => {
    try {
      const data = await adminApi.getQuestions();
      setQuestions(data);
    } catch (error) {
      console.error('Failed to fetch questions', error);
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
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) return;
        
        const workbook = xlsx.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        
        await adminApi.importQuestionsBulk(jsonData);
        fetchQuestions();
      } catch (error) {
        console.error('Failed to import questions', error);
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ p: 3, height: 600, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Questions Management
        </Typography>
        <Box>
          <input
            type="file"
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
            Import Excel
          </Button>
        </Box>
      </Box>
      <DataGrid
        rows={questions}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[5, 10, 25]}
        checkboxSelection
      />
    </Box>
  );
};

export default AdminQuestions;
