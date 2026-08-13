import { useContext, type ReactNode } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Badge,
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
  NotificationsNone as NotificationsIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Giao diện lấy cảm hứng từ cổng thông tin đào tạo online.hcmue.edu.vn:
// header 2 tầng (dải trắng có logo + dải xanh navy đậm), sidebar trắng có
// card hồ sơ người dùng + menu nhóm theo mục viết hoa, nội dung nền xám nhạt
// với tiêu đề trang dạng breadcrumb (chevron xanh + chữ đậm navy).
const NAVY = '#1B4870';
const NAVY_DARK = '#153a5c';
const SIDEBAR_W = 260;

const menuGroups = [
  {
    label: 'TRANG CÁ NHÂN',
    items: [
      { text: 'Tổng quan', icon: <DashboardIcon fontSize="small" />, path: '/admin/dashboard', roles: ['admin'] },
      { text: 'Quản lý tài khoản', icon: <PeopleIcon fontSize="small" />, path: '/admin/users', roles: ['admin'] },
      { text: 'Báo cáo & Thống kê', icon: <AssessmentIcon fontSize="small" />, path: '/admin/reports', roles: ['admin'] },
    ],
  },
  {
    label: 'GIẢNG DẠY & THI CỬ',
    items: [
      { text: 'Ngân hàng câu hỏi', icon: <ArticleIcon fontSize="small" />, path: '/admin/questions', roles: ['admin', 'teacher'] },
      { text: 'Danh mục câu hỏi', icon: <CategoryIcon fontSize="small" />, path: '/admin/categories', roles: ['admin', 'teacher'] },
      { text: 'Quản lý đề thi', icon: <AssignmentIcon fontSize="small" />, path: '/admin/exams', roles: ['admin', 'teacher'] },
      { text: 'Chấm bài tự luận', icon: <RateReviewIcon fontSize="small" />, path: '/admin/manual-grading', roles: ['admin', 'teacher'] },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext) as any;
  const user = auth?.user;
  const displayName = user?.full_name || user?.username || 'Người dùng';
  const role = user?.role || 'admin';

  const handleLogout = () => {
    if (auth?.logout) auth.logout();
    navigate('/login');
  };

  const currentTitle =
    menuGroups.flatMap((g) => g.items).find((i) => i.path === location.pathname)?.text || 'Trang quản lý';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#EEF1F4' }}>
      {/* Dải trắng trên cùng: logo */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e2e2', px: 3, py: 1.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', width: 'fit-content' }} onClick={() => navigate('/')}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: 22 }}>
            <Box sx={{ width: 10, height: 10, bgcolor: '#E53935', borderRadius: '2px' }} />
            <Box sx={{ width: 10, height: 10, bgcolor: NAVY, borderRadius: '2px' }} />
            <Box sx={{ width: 10, height: 10, bgcolor: '#FDD835', borderRadius: '2px' }} />
            <Box sx={{ width: 10, height: 10, bgcolor: '#43A047', borderRadius: '2px' }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#222' }}>examsystem</Typography>
        </Box>
      </Box>

      {/* Dải xanh navy: tiêu đề hệ thống + thông báo/avatar */}
      <Box sx={{ bgcolor: NAVY, px: 3, py: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.3px' }}>
          HỆ THỐNG QUẢN LÝ THI TRỰC TUYẾN
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge color="error" variant="dot">
            <NotificationsIcon sx={{ color: '#fff' }} />
          </Badge>
          <Avatar sx={{ width: 30, height: 30, bgcolor: '#fff', color: NAVY, fontWeight: 700, fontSize: '0.85rem' }}>
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
      </Box>

      <Box sx={{ display: 'flex' }}>
        {/* Sidebar trắng */}
        <Box sx={{ width: SIDEBAR_W, flexShrink: 0, bgcolor: '#fff', borderRight: '1px solid #e2e2e2', minHeight: 'calc(100vh - 96px)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2.5, borderBottom: '1px solid #eee' }}>
            <Avatar sx={{ width: 44, height: 44, bgcolor: '#e0e0e0', color: '#666' }}>
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>
                {role === 'teacher' ? 'Giáo viên' : 'Quản trị viên'}
              </Typography>
            </Box>
          </Box>

          {menuGroups.map((group) => {
            const items = group.items.filter((i) => i.roles.includes(role));
            if (items.length === 0) return null;
            return (
              <Box key={group.label} sx={{ pt: 2 }}>
                <Typography sx={{ px: 2.5, pb: 0.8, fontSize: '0.72rem', fontWeight: 700, color: '#9aa5b1', letterSpacing: '0.5px' }}>
                  {group.label}
                </Typography>
                <List dense disablePadding>
                  {items.map((item) => {
                    const selected = location.pathname === item.path;
                    return (
                      <ListItemButton
                        key={item.path}
                        selected={selected}
                        onClick={() => navigate(item.path)}
                        sx={{
                          px: 2.5, py: 1,
                          borderLeft: selected ? `3px solid ${NAVY}` : '3px solid transparent',
                          bgcolor: selected ? '#EAF1F8' : 'transparent',
                          '&:hover': { bgcolor: '#F3F6F9' },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 34, color: selected ? NAVY : '#6b7280' }}>{item.icon}</ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          slotProps={{ primary: { sx: { fontSize: '0.85rem', fontWeight: selected ? 700 : 500, color: selected ? NAVY : '#374151' } } }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            );
          })}

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
            <ListItemButton onClick={handleLogout} sx={{ px: 2.5, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 34, color: '#c0392b' }}>
                <ExitToAppIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Đăng xuất" slotProps={{ primary: { sx: { fontSize: '0.85rem', fontWeight: 600, color: '#c0392b' } } }} />
            </ListItemButton>
          </Box>
        </Box>

        {/* Nội dung */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3.5, pt: 3 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRightIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', color: NAVY_DARK }}>{currentTitle}</Typography>
          </Box>
          <Box sx={{ p: 3.5, pt: 2 }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
