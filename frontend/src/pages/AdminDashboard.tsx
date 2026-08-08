import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Alert, Skeleton, Paper } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminApi } from '../api/adminApi';
import DashboardIcon from '@mui/icons-material/Dashboard';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total_users: 0, total_exams: 0, total_questions: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.getUsers().catch(() => []),
      adminApi.getExams().catch(() => []),
      adminApi.getQuestions().catch(() => []),
      adminApi.getOverviewStats().catch(() => null)
    ])
      .then(([users, exams, questions, statsData]) => {
        setStats({
          total_users: users?.length || 0,
          total_exams: exams?.length || 0,
          total_questions: questions?.length || 0
        });
        if (statsData && statsData.chart) {
           setChartData(statsData.chart);
        } else {
           setChartData([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching stats:', err);
        setError('Failed to load dashboard statistics.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" height={60} width="30%" />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e4ebf5 100%)', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <DashboardIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#2c3e50' }}>
          Admin Dashboard
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Users', value: stats.total_users, color: '#3498db' },
          { label: 'Total Exams', value: stats.total_exams, color: '#2ecc71' },
          { label: 'Total Questions', value: stats.total_questions, color: '#9b59b6' }
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography sx={{ color: '#7f8c8d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }} gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#34495e' }}>Activity Overview</Typography>
      <Paper sx={{ height: 400, width: '100%', p: 3, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecf0f1" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#7f8c8d'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#7f8c8d'}} />
              <Tooltip 
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              <Line type="monotone" dataKey="users" stroke="#3498db" strokeWidth={3} activeDot={{ r: 8, fill: '#3498db', stroke: '#fff', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="exams" stroke="#2ecc71" strokeWidth={3} activeDot={{ r: 8, fill: '#2ecc71', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#95a5a6' }}>
            <Typography variant="h6">No Activity Data Available</Typography>
            <Typography variant="body2">API did not return chart stats. (Note: API endpoint missing or empty)</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
