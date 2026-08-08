import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { Dashboard as DashboardIcon, People as PeopleIcon, Assignment as AssignmentIcon, Assessment as AssessmentIcon, Article as ArticleIcon, ExitToApp as ExitToAppIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ReactNode, useContext } from 'react';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Questions', icon: <ArticleIcon />, path: '/admin/questions' },
  { text: 'Exams', icon: <AssignmentIcon />, path: '/admin/exams' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/admin/reports' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#1e293b',
            color: 'white',
          },
        }}
      >
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Admin Panel
          </Typography>
        </Box>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.1)' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                }}
              >
                <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
              <ListItemIcon sx={{ color: '#ef4444' }}><ExitToAppIcon /></ListItemIcon>
              <ListItemText primary="Logout" sx={{ color: '#ef4444' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${DRAWER_WIDTH}px)` }}>
        {children}
      </Box>
    </Box>
  );
}
