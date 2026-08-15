import { Box, Typography, Paper, Alert, Skeleton, Grid } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect, useContext } from 'react';
import { adminApi } from '../api/adminApi';
import { AuthContext } from '../context/AuthContext';

const AdminReports = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    adminApi.getReports()
      .then(res => {
        setData((res && res.data) || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Không tải được dữ liệu báo cáo.');
        setLoading(false);
      });
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton variant="text" height={60} width="40%" />
        <Skeleton variant="rectangular" height={500} sx={{ mt: 3, borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {user?.role === 'teacher'
          ? 'Chỉ hiện thống kê các đề thi do bạn tạo.'
          : 'Thống kê toàn bộ đề thi trong hệ thống.'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {data.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">
            Chưa có dữ liệu báo cáo — cần ít nhất 1 đề thi đã có học sinh nộp bài và được chấm điểm.
          </Typography>
        </Paper>
      ) : (
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ height: 500, width: '100%', p: 4, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#34495e' }}>Pass/Fail Ratio per Subject</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecf0f1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f5f7fa'}} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar dataKey="pass" stackId="a" fill="#2ecc71" radius={[0, 0, 4, 4]} />
                <Bar dataKey="fail" stackId="a" fill="#e74c3c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ height: 500, width: '100%', p: 4, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#34495e' }}>Subject Popularity</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="pass" nameKey="name" cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
      )}
    </Box>
  );
};

export default AdminReports;
