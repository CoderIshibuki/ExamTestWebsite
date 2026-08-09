import React, { useContext, type ReactNode } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  AppBar,
  Toolbar,
  Avatar,
  Card,
  CardContent,
  Grid,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Article as ArticleIcon,
  ExitToApp as ExitToAppIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DRAWER_WIDTH = 280;

const menuItems = [
  { text: 'Tổng quan', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Quản lý tài khoản', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Ngân hàng câu hỏi', icon: <ArticleIcon />, path: '/admin/questions' },
  { text: 'Quản lý đề thi', icon: <AssignmentIcon />, path: '/admin/exams' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext) as any;
  const user = auth?.user ?? { name: 'Trần Vũ Hòa Phát', id: '51.01.104.072' };

  const handleLogout = () => {
    if (auth?.logout) auth.logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f3f4f6' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#0b4d72' }}
      >
        <Toolbar>
          <Box
            component="img"
            src="/logo192.png"
            alt="logo"
            sx={{ height: 36, mr: 2, display: { xs: 'none', sm: 'block' } }}
          />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            TRƯỜNG ĐẠI HỌC SƯ PHẠM THÀNH PHỐ HỒ CHÍ MINH
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" size="small" sx={{ mr: 1 }}>
            <Avatar sx={{ width: 32, height: 32 }}>{user.name?.charAt(0)}</Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid rgba(0,0,0,0.06)',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Avatar sx={{ width: 72, height: 72, mx: 'auto', bgcolor: '#c7d2fe' }}>
            {user.name?.charAt(0)}
          </Avatar>
          <Typography sx={{ mt: 1, fontWeight: 600 }}>{user.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user.id}
          </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />

        <Box sx={{ px: 1 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon sx={{ color: '#374151' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon sx={{ color: '#ef4444' }}>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText
                primary="Đăng xuất"
                primaryTypographyProps={{ sx: { color: '#ef4444' } }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${DRAWER_WIDTH}px)` }}>
        <Toolbar />
        {location.pathname === '/admin/dashboard' ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar sx={{ width: 80, height: 80, mx: 'auto', bgcolor: '#e2e8f0' }}>
                    {user.name?.charAt(0)}
                  </Avatar>
                  <Typography sx={{ mt: 1, fontWeight: 600 }}>{user.name}</Typography>
                </Box>
              </Paper>

              <Paper sx={{ p: 0 }}>
                <CardContent sx={{ bgcolor: '#0b4d72', color: 'white' }}>
                  <Typography variant="subtitle1">Thông tin sinh viên</Typography>
                </CardContent>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Mã sinh viên
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">{user.id}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Họ tên
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">{user.name}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, minHeight: 420 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Kết quả học tập
                </Typography>
                <Box
                  sx={{
                    height: 340,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <Typography>Kết quả học tập không có dữ liệu để hiển thị</Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, minHeight: 420 }}>
                <Typography variant="h6">Tiến độ học tập</Typography>
                <Box
                  sx={{
                    height: 340,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ width: 150, height: 150, borderRadius: '50%', bgcolor: '#ef4444' }} />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Thông tin liên lạc</Typography>
                <Box sx={{ mt: 1 }}>
                  Nơi ở, địa chỉ liên hệ và các thông tin bổ sung hiển thị ở đây.
                </Box>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}
