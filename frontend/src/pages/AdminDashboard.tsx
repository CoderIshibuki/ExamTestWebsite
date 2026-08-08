import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminApi } from '../api/adminApi';

const data = [
  { name: 'Mon', users: 4000, exams: 2400 },
  { name: 'Tue', users: 3000, exams: 1398 },
  { name: 'Wed', users: 2000, exams: 9800 },
  { name: 'Thu', users: 2780, exams: 3908 },
  { name: 'Fri', users: 1890, exams: 4800 },
  { name: 'Sat', users: 2390, exams: 3800 },
  { name: 'Sun', users: 3490, exams: 4300 },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total_users: 0, total_exams: 0, total_questions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getUsers(),
      adminApi.getExams(),
      adminApi.getQuestions()
    ])
      .then(([users, exams, questions]) => {
        setStats({
          total_users: users.length || 0,
          total_exams: exams.length || 0,
          total_questions: questions.length || 0
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Users</Typography>
              <Typography variant="h5">{stats.total_users}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Exams</Typography>
              <Typography variant="h5">{stats.total_exams}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Questions</Typography>
              <Typography variant="h5">{stats.total_questions}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>Activity Overview</Typography>
      <Box sx={{ height: 400, width: '100%', bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="exams" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
