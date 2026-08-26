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
        const reportList = Array.isArray(res) ? res : (res?.data || []);
        setData(reportList);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Không tải được dữ liệu báo cáo.');
        setLoading(false);
      });
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const totalPass = data.reduce((acc, curr) => acc + (curr.pass || 0), 0);
  const totalFail = data.reduce((acc, curr) => acc + (curr.fail || 0), 0);
  const totalAttempts = totalPass + totalFail;
  const passRate = totalAttempts > 0 ? Math.round((totalPass / totalAttempts) * 100) : 0;

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" height={60} width="40%" />
        <Skeleton variant="rectangular" height={500} sx={{ mt: 3, borderRadius: 3.5 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
        {user?.role === 'teacher'
          ? 'Thống kê kết quả thi của các bài thi do bạn quản lý.'
          : 'Thống kê kết quả toàn bộ kỳ thi và lượt làm bài trong hệ thống.'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tổng lượt làm bài</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mt: 1 }}>{totalAttempts}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Lượt thi Đạt</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981', mt: 1 }}>{totalPass}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Lượt thi Chưa đạt</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ef4444', mt: 1 }}>{totalFail}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tỉ lệ Đạt chung</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#3b82f6', mt: 1 }}>{passRate}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      {data.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <Typography color="text.secondary">
            Chưa có dữ liệu bài nộp nào để thống kê — học sinh làm bài thi và nộp bài xong dữ liệu sẽ hiển thị tại đây.
          </Typography>
        </Paper>
      ) : (
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ height: 450, width: '100%', p: 3.5, borderRadius: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1e293b' }}>Tỉ lệ Đạt / Chưa đạt theo đề thi</Typography>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar name="Đạt" dataKey="pass" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar name="Chưa đạt" dataKey="fail" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ height: 450, width: '100%', p: 3.5, borderRadius: 3, display: 'flex', flexDirection: 'column', bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1e293b' }}>Phân bố lượt làm bài</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="pass" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
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
