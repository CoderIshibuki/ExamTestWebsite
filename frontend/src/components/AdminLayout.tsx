import { useContext, type ReactNode } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Chip,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Article as ArticleIcon,
  ExitToApp as ExitToAppIcon,
  RateReview as RateReviewIcon,
  Assessment as AssessmentIcon,
  Category as CategoryIcon,
  Home as HomeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const SIDEBAR_W = 260;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  proctor: 'Giám thị',
  student: 'Học sinh',
};

const menuGroups = [
  {
    label: 'TỔNG QUAN',
    items: [
      { text: 'Bảng điều khiển', icon: <DashboardIcon fontSize="small" />, path: '/admin/dashboard', roles: ['admin'] },
      { text: 'Quản lý tài khoản', icon: <PeopleIcon fontSize="small" />, path: '/admin/users', roles: ['admin'] },
      { text: 'Báo cáo & Thống kê', icon: <AssessmentIcon fontSize="small" />, path: '/admin/reports', roles: ['admin', 'teacher'] },
    ],
  },
  {
    label: 'QUẢN LÝ THI CỬ',
    items: [
      { text: 'Quản lý đề thi', icon: <AssignmentIcon fontSize="small" />, path: '/admin/exams', roles: ['admin', 'teacher'] },
      { text: 'Ngân hàng câu hỏi', icon: <ArticleIcon fontSize="small" />, path: '/admin/questions', roles: ['admin', 'teacher'] },
      { text: 'Danh mục câu hỏi', icon: <CategoryIcon fontSize="small" />, path: '/admin/categories', roles: ['admin', 'teacher'] },
      { text: 'Chấm bài tự luận', icon: <RateReviewIcon fontSize="small" />, path: '/admin/manual-grading', roles: ['admin', 'teacher'] },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext) as any;
  const user = auth?.user;
  const displayName = user?.full_name || user?.username || 'Quản trị viên';
  const role = user?.role || 'admin';

  const handleLogout = () => {
    if (auth?.logout) auth.logout();
    navigate('/login');
  };

  const currentItem = menuGroups.flatMap((g) => g.items).find((i) => i.path === location.pathname);
  const currentTitle = currentItem?.text || 'Trang quản lý';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Sidebar - Modern Slate Theme */}
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_W,
          flexShrink: 0,
          bgcolor: '#0F172A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #1E293B',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <Box>
          {/* Logo Header */}
          <Box
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              borderBottom: '1px solid #1E293B',
            }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37,99,235,0.3)',
              }}
            >
              <Typography sx={{ color: '#fff', fontSize: '0.9rem', fontWeight: 900 }}>✦</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
              Exam<span style={{ color: '#38BDF8' }}>System</span>
            </Typography>
          </Box>

          {/* User Brief Card */}
          <Box sx={{ p: 2, mx: 1.5, my: 2, bgcolor: '#1E293B', borderRadius: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: '#2563EB', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </Typography>
              <Chip
                label={ROLE_LABELS[role] || role}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: role === 'admin' ? '#4F46E5' : '#059669',
                  color: '#fff',
                  mt: 0.3,
                }}
              />
            </Box>
          </Box>

          {/* Navigation Links */}
          {menuGroups.map((group) => {
            const items = group.items.filter((i) => i.roles.includes(role));
            if (items.length === 0) return null;
            return (
              <Box key={group.label} sx={{ px: 1.5, mb: 2 }}>
                <Typography sx={{ px: 1.5, pb: 0.8, fontSize: '0.68rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.8px' }}>
                  {group.label}
                </Typography>
                <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {items.map((item) => {
                    const selected = location.pathname === item.path;
                    return (
                      <ListItemButton
                        key={item.path}
                        selected={selected}
                        onClick={() => navigate(item.path)}
                        sx={{
                          px: 1.5,
                          py: 0.9,
                          borderRadius: 2,
                          color: selected ? '#FFFFFF' : '#94A3B8',
                          bgcolor: selected ? '#2563EB !important' : 'transparent',
                          '&:hover': { bgcolor: selected ? '#1D4ED8' : '#1E293B', color: '#FFFFFF' },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32, color: selected ? '#FFFFFF' : '#94A3B8' }}>{item.icon}</ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          slotProps={{
                            primary: {
                              sx: { fontSize: '0.84rem', fontWeight: selected ? 700 : 500 },
                            },
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            );
          })}
        </Box>

        {/* Sidebar Footer: Quick navigation & Logout */}
        <Box sx={{ p: 1.5, borderTop: '1px solid #1E293B' }}>
          <ListItemButton
            onClick={() => navigate('/dashboard')}
            sx={{ px: 1.5, py: 0.8, borderRadius: 2, color: '#94A3B8', mb: 0.5, '&:hover': { bgcolor: '#1E293B', color: '#fff' } }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: '#94A3B8' }}><PersonIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Trang cá nhân" slotProps={{ primary: { sx: { fontSize: '0.82rem', fontWeight: 500 } } }} />
          </ListItemButton>

          <ListItemButton
            onClick={handleLogout}
            sx={{ px: 1.5, py: 0.8, borderRadius: 2, color: '#F87171', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' } }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: '#F87171' }}><ExitToAppIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Đăng xuất" slotProps={{ primary: { sx: { fontSize: '0.82rem', fontWeight: 600 } } }} />
          </ListItemButton>
        </Box>
      </Box>

      {/* Main Panel */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header Bar */}
        <Box
          sx={{
            height: 64,
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            px: 3.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.15rem' }}>
              {currentTitle}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="text"
              size="small"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600, borderRadius: 2 }}
            >
              Trang chủ
            </Button>
          </Box>
        </Box>

        {/* Content Body */}
        <Box sx={{ p: 3.5, flexGrow: 1, overflowY: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

