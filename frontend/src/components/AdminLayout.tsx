import { useContext, type ReactNode } from 'react';
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
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Article as ArticleIcon,
  ExitToApp as ExitToAppIcon,
  RateReview as RateReviewIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DRAWER_WIDTH = 280;

const adminMenuItems = [
  { text: 'Tổng quan', icon: <DashboardIcon />, path: '/admin/dashboard', roles: ['admin'] },
  { text: 'Quản lý tài khoản', icon: <PeopleIcon />, path: '/admin/users', roles: ['admin'] },
  { text: 'Ngân hàng câu hỏi', icon: <ArticleIcon />, path: '/admin/questions', roles: ['admin', 'teacher'] },
  { text: 'Quản lý đề thi', icon: <AssignmentIcon />, path: '/admin/exams', roles: ['admin', 'teacher'] },
  { text: 'Chấm bài tự luận', icon: <RateReviewIcon />, path: '/admin/manual-grading', roles: ['admin', 'teacher'] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext) as any;
  const user = auth?.user;
  const displayName = user?.full_name || user?.username || 'Admin';
  const role = user?.role || 'admin';
  const menuItems = adminMenuItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    if (auth?.logout) auth.logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'primary.main' }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            examsystem — {role === 'teacher' ? 'Giáo viên' : 'Quản trị'}
          </Typography>
          <IconButton color="inherit" size="small" sx={{ mr: 1 }} aria-label="Tài khoản">
            <Avatar sx={{ width: 32, height: 32 }}>{displayName.charAt(0).toUpperCase()}</Avatar>
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
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Avatar sx={{ width: 72, height: 72, mx: 'auto', bgcolor: 'primary.light' }}>
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography sx={{ mt: 1, fontWeight: 600 }}>{displayName}</Typography>
          {user?.email && (
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          )}
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
              <ListItemIcon sx={{ color: 'error.main' }}>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText
                primary="Đăng xuất"
                slotProps={{ primary: { sx: { color: 'error.main' } } }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Luôn render đúng trang con theo route (AdminDashboard, AdminUsers,...) —
          trước đây route /admin/dashboard bị chặn bởi khối UI giả (dữ liệu hard-code),
          khiến trang AdminDashboard.tsx thật (có số liệu/biểu đồ thật) không bao giờ hiển thị. */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${DRAWER_WIDTH}px)` }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
