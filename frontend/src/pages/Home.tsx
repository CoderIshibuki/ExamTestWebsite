import {
  Box, Typography, Container, Toolbar, Skeleton,
  Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow, Link as MuiLink, Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CampaignIcon from '@mui/icons-material/Campaign';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { AuthContext } from '../context/AuthContext';
import { getPublishedExams } from '../api/examApi';
import type { Exam } from '../api/examApi';

// Bảng màu/kiểu chữ lấy cảm hứng từ giao diện VNOI Online Judge (oj.vnoi.info):
// navbar tối màu, chữ hoa dãn cách, layout dạng feed 2 cột + sidebar bảng xếp hạng.
const NAVBAR_BG = '#161819';
const LINK_BLUE = '#3d3d99';

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    let mounted = true;
    getPublishedExams()
      .then((data) => {
        if (mounted) setExams(data);
      })
      .catch((err) => console.error('Không thể tải danh sách kỳ thi:', err))
      .finally(() => {
        if (mounted) setLoadingExams(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { label: 'ĐỀ THI', path: isAuthenticated ? '/dashboard' : '/login' },
    { label: 'KẾT QUẢ', path: isAuthenticated ? '/dashboard' : '/login' },
    { label: 'NGƯỜI DÙNG', path: isAuthenticated ? '/admin/users' : '/login' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Navbar tối màu kiểu VNOJ */}
      <Box sx={{ bgcolor: NAVBAR_BG, color: '#fff' }}>
        <Toolbar sx={{ maxWidth: 1200, mx: 'auto', width: '100%', gap: 3, flexWrap: 'wrap', minHeight: '56px !important', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 2 }} onClick={() => navigate('/')}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: 22 }}>
              <Box sx={{ width: 10, height: 10, bgcolor: '#E53935', borderRadius: '2px' }} />
              <Box sx={{ width: 10, height: 10, bgcolor: '#1E88E5', borderRadius: '2px' }} />
              <Box sx={{ width: 10, height: 10, bgcolor: '#FDD835', borderRadius: '2px' }} />
              <Box sx={{ width: 10, height: 10, bgcolor: '#43A047', borderRadius: '2px' }} />
            </Box>
            <Box sx={{ lineHeight: 1.1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>exam</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', mt: '-4px' }}>system</Typography>
            </Box>
          </Box>

          {navItems.map((item) => (
            <Typography
              key={item.label}
              onClick={() => navigate(item.path)}
              sx={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px', cursor: 'pointer', color: '#ccc', '&:hover': { color: '#fff' } }}
            >
              {item.label}
            </Typography>
          ))}

          <Box sx={{ flexGrow: 1 }} />

          <SettingsIcon fontSize="small" sx={{ color: '#aaa', cursor: 'pointer' }} />

          {!isAuthenticated ? (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <MuiLink component="button" onClick={() => navigate('/login')} sx={{ color: '#ddd', fontSize: '0.85rem', fontWeight: 600 }} underline="hover">
                Đăng nhập
              </MuiLink>
              <Typography sx={{ color: '#666' }}>hoặc</Typography>
              <MuiLink component="button" onClick={() => navigate('/register')} sx={{ color: '#ddd', fontSize: '0.85rem', fontWeight: 600 }} underline="hover">
                Đăng ký
              </MuiLink>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <MuiLink component="button" onClick={() => navigate('/dashboard')} sx={{ color: '#ddd', fontSize: '0.85rem', fontWeight: 600 }} underline="hover">
                {user?.full_name || user?.username}
              </MuiLink>
              <MuiLink component="button" onClick={handleLogout} sx={{ color: '#888', fontSize: '0.85rem' }} underline="hover">
                Đăng xuất
              </MuiLink>
            </Box>
          )}
        </Toolbar>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 6 }}>
        {/* Banner thông báo xám nhạt kiểu VNOJ */}
        <Box sx={{ bgcolor: '#f4f4f4', border: '1px solid #e0e0e0', borderRadius: '2px', p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#333' }}>
            Chào mừng bạn đến với <strong>ExamSystem</strong>!
          </Typography>
          <CampaignIcon sx={{ color: '#888' }} />
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
          {/* Cột chính: feed đề thi kiểu Newsfeed */}
          <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
            <Tabs
              value={tab}
              onChange={(_e, v) => setTab(v)}
              sx={{ borderBottom: '1px solid #e0e0e0', mb: 2, minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' } }}
            >
              <Tab label="Kỳ thi đang mở" />
              <Tab label="Giới thiệu" />
            </Tabs>

            {tab === 0 && (
              <Box>
                {loadingExams ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={90} sx={{ mb: 2 }} />)
                ) : exams.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 4 }}>Hiện chưa có kỳ thi nào được công bố.</Typography>
                ) : (
                  exams.map((exam, idx) => (
                    <Box key={exam.id} sx={{ display: 'flex', gap: 2, py: 2.5, borderBottom: idx < exams.length - 1 ? '1px solid #eee' : 'none' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#999', minWidth: 32, pt: 0.5 }}>
                        <ArrowDropUpIcon />
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{exam.duration_minutes}p</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <MuiLink
                          component="button"
                          onClick={() => navigate('/login')}
                          sx={{ color: LINK_BLUE, fontWeight: 700, fontSize: '1.05rem', textAlign: 'left', display: 'block', mb: 0.5 }}
                          underline="hover"
                        >
                          {exam.title}
                        </MuiLink>
                        <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1 }}>
                          Số lần làm bài tối đa: {exam.max_attempts} · Trạng thái: {exam.status === 'published' ? 'Đang mở' : exam.status}
                        </Typography>
                        <Typography sx={{ color: '#444', fontSize: '0.9rem' }}>
                          {exam.description || 'Chưa có mô tả cho kỳ thi này.'}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ py: 2 }}>
                <Typography sx={{ mb: 2, lineHeight: 1.8, color: '#333' }}>
                  <strong>ExamSystem</strong> là hệ thống thi trực tuyến hỗ trợ đầy đủ các loại câu hỏi: trắc nghiệm một/nhiều
                  đáp án, đúng/sai, nối cột và tự luận (gõ text hoặc chụp ảnh bài làm tay). Hệ thống tích hợp giám sát chống
                  gian lận thời gian thực và chấm điểm tự động.
                </Typography>
                <Typography sx={{ lineHeight: 1.8, color: '#333' }}>
                  Giáo viên có thể tạo đề thi, quản lý ngân hàng câu hỏi, gán giám thị coi thi và chấm tay các câu tự luận
                  ngay trên hệ thống.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Sidebar phải: widget kiểu "Top users" của VNOJ */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: '2px', mb: 3 }}>
              <Box sx={{ bgcolor: '#f4f4f4', px: 2, py: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#333' }}>Kỳ thi nổi bật</Typography>
                <EmojiEventsIcon fontSize="small" sx={{ color: '#c9a227' }} />
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#666' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#666' }}>Tên đề thi</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#666' }} align="right">Phút</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exams.slice(0, 5).map((exam, i) => (
                    <TableRow key={exam.id}>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{i + 1}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        <MuiLink component="button" onClick={() => navigate('/login')} sx={{ color: LINK_BLUE, fontWeight: 600, textAlign: 'left' }} underline="hover">
                          {exam.title.length > 22 ? exam.title.slice(0, 22) + '…' : exam.title}
                        </MuiLink>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }} align="right">{exam.duration_minutes}</TableCell>
                    </TableRow>
                  ))}
                  {exams.length === 0 && !loadingExams && (
                    <TableRow><TableCell colSpan={3} sx={{ color: '#999', fontSize: '0.85rem' }}>Chưa có dữ liệu</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <Box sx={{ textAlign: 'center', py: 1, borderTop: '1px solid #eee' }}>
                <MuiLink component="button" onClick={() => navigate('/login')} sx={{ color: LINK_BLUE, fontSize: '0.8rem', fontWeight: 600 }} underline="hover">
                  Xem tất cả &gt;&gt;&gt;
                </MuiLink>
              </Box>
            </Box>

            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: '2px' }}>
              <Box sx={{ bgcolor: '#f4f4f4', px: 2, py: 1.2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#333' }}>Liên kết nhanh</Typography>
              </Box>
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <MuiLink component="button" onClick={() => navigate('/login')} sx={{ color: LINK_BLUE, fontSize: '0.85rem', textAlign: 'left' }} underline="hover">Đăng nhập</MuiLink>
                <MuiLink component="button" onClick={() => navigate('/register')} sx={{ color: LINK_BLUE, fontSize: '0.85rem', textAlign: 'left' }} underline="hover">Đăng ký tài khoản mới</MuiLink>
                <Divider sx={{ my: 0.5 }} />
                <MuiLink component="button" onClick={() => navigate('/teacher/exams')} sx={{ color: LINK_BLUE, fontSize: '0.85rem', textAlign: 'left' }} underline="hover">Trang giáo viên</MuiLink>
                <MuiLink component="button" onClick={() => navigate('/admin/dashboard')} sx={{ color: LINK_BLUE, fontSize: '0.85rem', textAlign: 'left' }} underline="hover">Trang quản trị</MuiLink>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
