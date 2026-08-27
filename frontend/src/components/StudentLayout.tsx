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
  Assignment as AssignmentIcon,
  HistoryEdu as HistoryEduIcon,
  Videocam as VideocamIcon,
  Lock as LockIcon,
  ExitToApp as ExitToAppIcon,
  Home as HomeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const SIDEBAR_W = 260;

const menuGroups = [
  {
    label: 'TỔNG QUAN',
    items: [
      { text: 'Trang cá nhân', icon: <DashboardIcon fontSize="small" />, path: '/dashboard' },
    ],
  },
  {
    label: 'HỌC TẬP & THI CỬ',
    items: [
      { text: 'Danh sách kỳ thi', icon: <AssignmentIcon fontSize="small" />, path: '/student/exams' },
      { text: 'Kết quả & Lịch sử', icon: <HistoryEduIcon fontSize="small" />, path: '/student/results' },
    ],
  },
  {
    label: 'CÔNG CỤ & TÀI KHOẢN',
    items: [
      { text: 'Kiểm tra Camera', icon: <VideocamIcon fontSize="small" />, path: '/student/camera-test' },
      { text: 'Đổi mật khẩu', icon: <LockIcon fontSize="small" />, path: '/change-password' },
    ],
  },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext) as any;
  const user = auth?.user;
  const displayName = user?.full_name || user?.username || 'Học sinh';

  const handleLogout = () => {
    if (auth?.logout) auth.logout();
    navigate('/login');
  };

  const currentItem = menuGroups.flatMap((g) => g.items).find((i) => i.path === location.pathname);
  const currentTitle = currentItem?.text || 'Khu vực Học sinh';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Sidebar */}
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
          {/* Brand Logo */}
          <Box
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              borderBottom: '1px solid #1E293B',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                bgcolor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
              }}
            >
              E
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#F8FAFC', lineHeight: 1.2 }}>
                ExamPortal
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>
                Học sinh
              </Typography>
            </Box>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ p: 1.5 }}>
            {menuGroups.map((group) => (
              <Box key={group.label} sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#64748B',
                    textTransform: 'uppercase',
                  }}
                >
                  {group.label}
                </Typography>
                <List dense disablePadding>
                  {group.items.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <ListItemButton
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          px: 1.5,
                          py: 1,
                          bgcolor: active ? '#2563EB' : 'transparent',
                          color: active ? '#FFFFFF' : '#94A3B8',
                          fontWeight: active ? 700 : 500,
                          '&:hover': {
                            bgcolor: active ? '#1D4ED8' : '#1E293B',
                            color: '#F8FAFC',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 32,
                            color: active ? '#FFFFFF' : '#64748B',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: active ? 700 : 500, color: 'inherit' }}>
                              {item.text}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            ))}
          </Box>
        </Box>

        {/* User Card & Logout in Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid #1E293B', bgcolor: '#0B1120' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#2563EB', fontSize: '0.85rem', fontWeight: 700 }}>
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {displayName}
              </Typography>
              <Chip label="Học sinh" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#1E293B', color: '#93C5FD', fontWeight: 600 }} />
            </Box>
          </Box>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<ExitToAppIcon fontSize="small" />}
            onClick={handleLogout}
            sx={{
              borderColor: '#334155',
              color: '#EF4444',
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#EF4444',
                bgcolor: 'rgba(239, 68, 68, 0.08)',
              },
            }}
          >
            Đăng xuất
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Header */}
        <Box
          component="header"
          sx={{
            height: 64,
            px: 4,
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>
            {currentTitle}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#E2E8F0',
                color: '#475569',
                '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' },
              }}
            >
              Trang chủ
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, bgcolor: '#F1F5F9', borderRadius: 2 }}>
              <PersonIcon sx={{ fontSize: 18, color: '#64748B' }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                {user?.username || 'student'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content Body */}
        <Box sx={{ p: 4, flex: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
