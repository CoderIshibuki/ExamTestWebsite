import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Container, Typography, Box, Button, Card, CardContent, Grid } from '@mui/material';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button variant="outlined" color="secondary" onClick={logout}>
          Logout
        </Button>
      </Box>

      {user && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>User Information</Typography>
            <Typography><strong>Username:</strong> {user.username}</Typography>
            <Typography><strong>Email:</strong> {user.email}</Typography>
            <Typography><strong>Full Name:</strong> {user.full_name || 'N/A'}</Typography>
            <Typography><strong>Role:</strong> {user.role}</Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">My Exams</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>View available exams and start taking tests.</Typography>
              <Button variant="contained" size="small" onClick={() => navigate('/exams')}>
                Xem danh sách kỳ thi
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Recent Results</Typography>
              <Typography variant="body2" color="text.secondary">Placeholder for future features.</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Proctoring Status</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Test tính năng giám sát bằng camera.
              </Typography>
              <Button variant="contained" size="small" onClick={() => navigate('/camera-test')}>
                Mở Camera Test
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
