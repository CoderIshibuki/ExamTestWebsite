import { Box, Typography, Container, Button, AppBar, Toolbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab, Grid, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';
import StarIcon from '@mui/icons-material/Star';
import PushPinIcon from '@mui/icons-material/PushPin';
import InfoIcon from '@mui/icons-material/Info';
import { AuthContext } from '../context/AuthContext';

const PRIMARY_DARK = '#262626';
const BG_DARK = '#1a1a1a';
const NAV_DARK = '#111111';
const TEXT_LIGHT = '#e0e0e0';

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [tabValue, setTabValue] = useState(0);

  const upcomingExams = [
    { id: 1, name: 'Kiểm tra 15 phút Toán', time: '10/08/2026' },
    { id: 2, name: 'Thi học kì 1 Tiếng Anh', time: '15/08/2026' },
    { id: 3, name: 'Khảo sát Vật Lý', time: '20/08/2026' },
    { id: 4, name: 'Thi thử ĐH Hoá Học', time: '25/08/2026' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#121212', color: TEXT_LIGHT, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Navbar */}
      <AppBar position="static" sx={{ bgcolor: NAV_DARK, boxShadow: 'none', borderBottom: '1px solid #333' }}>
        <Toolbar sx={{ minHeight: '50px !important', p: '0 !important', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', height: '50px', overflowX: 'auto' }}>
            {/* Logo Area */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', px: 2, display: 'flex', alignItems: 'center', cursor: 'pointer', height: '100%', borderRight: '1px solid #333' }}>
              <Box sx={{ display: 'flex', mr: 1 }}>
                <Box sx={{ width: 10, height: 10, bgcolor: '#e74c3c', mr: 0.2 }} />
                <Box sx={{ width: 10, height: 10, bgcolor: '#3498db', mr: 0.2 }} />
                <Box sx={{ width: 10, height: 10, bgcolor: '#f1c40f' }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ lineHeight: 1, color: '#e74c3c', fontWeight: 'bold' }}>exam</Typography>
                <Typography variant="body2" sx={{ lineHeight: 1, color: '#fff', fontWeight: 'bold' }}>system</Typography>
              </Box>
            </Typography>

            {/* Menu Items */}
            {['TRANG CHỦ', 'KỲ THI', 'BẢNG XẾP HẠNG', 'GIỚI THIỆU'].map((item, idx) => (
              <Button 
                disableRipple 
                key={item} 
                sx={{ 
                  color: idx === 0 ? '#fff' : '#ccc', 
                  minWidth: 'auto', 
                  px: 2, 
                  height: '100%',
                  borderRadius: 0,
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  borderBottom: idx === 0 ? '3px solid #2ecc71' : '3px solid transparent',
                  '&:hover': { color: '#fff', bgcolor: '#444' }
                }}
              >
                {item}
              </Button>
            ))}

            {/* Role-based Menu Items (Tags) */}
            {isAuthenticated && user?.role === 'admin' && (
              <Button disableRipple onClick={() => navigate('/admin/dashboard')} sx={{ color: '#e74c3c', minWidth: 'auto', px: 2, height: '100%', borderRadius: 0, fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '3px solid transparent', '&:hover': { color: '#fff', bgcolor: '#444', borderBottom: '3px solid #e74c3c' } }}>
                TRANG QUẢN TRỊ
              </Button>
            )}
            {isAuthenticated && user?.role === 'teacher' && (
              <Button disableRipple onClick={() => navigate('/dashboard')} sx={{ color: '#f39c12', minWidth: 'auto', px: 2, height: '100%', borderRadius: 0, fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '3px solid transparent', '&:hover': { color: '#fff', bgcolor: '#444', borderBottom: '3px solid #f39c12' } }}>
                TRANG GIÁO VIÊN
              </Button>
            )}
            {isAuthenticated && user?.role === 'student' && (
              <Button disableRipple onClick={() => navigate('/dashboard')} sx={{ color: '#2ecc71', minWidth: 'auto', px: 2, height: '100%', borderRadius: 0, fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '3px solid transparent', '&:hover': { color: '#fff', bgcolor: '#444', borderBottom: '3px solid #2ecc71' } }}>
                VÀO THI
              </Button>
            )}
          </Box>

          {/* User Area */}
          <Box sx={{ height: '50px', display: 'flex', alignItems: 'center', px: 2 }}>
            {!isAuthenticated ? (
              <>
                <Button disableRipple onClick={() => navigate('/login')} sx={{ color: '#ccc', textTransform: 'none', height: '100%', borderRadius: 0, '&:hover': { color: '#fff', bgcolor: '#444' }, fontWeight: 'bold' }}>
                  Log in
                </Button>
                <Typography component="span" sx={{ color: '#555', mx: 0.5 }}>or</Typography>
                <Button disableRipple onClick={() => navigate('/register')} sx={{ color: '#ccc', textTransform: 'none', height: '100%', borderRadius: 0, '&:hover': { color: '#fff', bgcolor: '#444' }, fontWeight: 'bold' }}>
                  Sign up
                </Button>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Typography sx={{ color: '#ccc', mr: 2, fontWeight: 'bold', fontSize: '0.9rem' }}>
                  Xin chào, <span style={{ color: '#3498db' }}>{user?.username || 'User'}</span>
                </Typography>
                
                <Button 
                  disableRipple 
                  onClick={handleLogout} 
                  sx={{ color: '#ccc', textTransform: 'none', height: '100%', borderRadius: 0, '&:hover': { color: '#fff', bgcolor: '#444' }, fontWeight: 'bold' }}
                >
                  Đăng xuất
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Welcome Banner */}
        <Paper sx={{ bgcolor: PRIMARY_DARK, color: TEXT_LIGHT, mb: 4, borderRadius: 2, border: '1px solid #444', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#e0e0e0', color: '#000', px: 2, py: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'normal' }}>
              Chào mừng bạn đến với Hệ thống Thi Trực Tuyến!
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>!</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, fontSize: '0.85rem' }}>
              Hệ thống thi trắc nghiệm và tự luận toàn diện, giúp giáo viên quản lý kỳ thi và học sinh làm bài tập mọi lúc mọi nơi.<br/><br/>
              Hệ thống cung cấp một môi trường thi luyện tập nghiêm túc với các công cụ chống gian lận (proctoring) tiên tiến. Hỗ trợ đa dạng các loại câu hỏi: trắc nghiệm một đáp án, nhiều đáp án, đúng/sai, tự luận, nối cột.<br/><br/>
              {!isAuthenticated && (
                <>Nếu đây là lần đầu tiên tham gia hệ thống, hãy <Typography component="span" sx={{ color: '#3498db', cursor: 'pointer' }} onClick={() => navigate('/register')}>đăng ký</Typography> tài khoản. Chúc bạn có trải nghiệm tốt nhất!</>
              )}
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Column: Newsfeed */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ borderBottom: '1px solid #444', mb: 2, display: 'flex' }}>
              <Box sx={{ px: 2, py: 1, borderTop: '2px solid #2ecc71', bgcolor: PRIMARY_DARK, borderLeft: '1px solid #444', borderRight: '1px solid #444', display: 'flex', alignItems: 'center', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>Newsfeed</Typography>
              </Box>
              <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>Tin tức</Typography>
              </Box>
            </Box>

            {/* Post Item */}
            <Paper sx={{ mb: 4, p: 3, bgcolor: PRIMARY_DARK, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Typography sx={{ color: '#fff', fontSize: '1.2rem', mr: 1.5, lineHeight: 1, p: 0.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>^</Typography>
                <Box>
                  <Typography variant="h6" sx={{ color: '#3498db', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.3, fontSize: '1.1rem', mb: 0.5 }}>
                    CẬP NHẬT TÍNH NĂNG THI TỰ LUẬN VÀ CHỐNG GIAN LẬN
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888', display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ fontSize: '0.8rem', color: '#e74c3c', mr: 0.5 }} />
                    <strong style={{ color: '#e74c3c', marginRight: '4px' }}>admin</strong> posted 09:00:00 am, 09/08/2026
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ pl: 4, pt: 1, borderLeft: '2px solid rgba(255,255,255,0.05)', ml: 1.5 }}>
                <Typography variant="body2" sx={{ mb: 2, color: '#e0e0e0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  🌟 Hệ thống vừa cập nhật thêm dạng câu hỏi tự luận, cho phép học sinh gõ trực tiếp văn bản vào bài làm hoặc chụp hình bài giải đính kèm (sắp ra mắt).
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#e0e0e0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  🚀 Bên cạnh đó, tính năng giám sát thi (Proctoring) thông qua socket real-time đã được kích hoạt trên hệ thống. Giáo viên hiện có thể phát hiện học sinh rời khỏi màn hình, mở tab mới hoặc thực hiện các hành vi gian lận.
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5, color: '#e0e0e0', fontSize: '0.9rem' }}>
                  🗓 <strong>Bắt đầu áp dụng:</strong> Kể từ học kì này.
                </Typography>
                <Typography variant="body2" sx={{ mb: 0, color: '#aaa', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  📌 Mọi thắc mắc xin vui lòng liên hệ với quản trị viên qua email hoặc để lại phản hồi tại mục Liên hệ.
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column: Leaderboards / Exams */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Exam List */}
            <Paper sx={{ bgcolor: PRIMARY_DARK, color: '#fff', mb: 4, borderRadius: 2, border: '1px solid #444', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#e0e0e0', color: '#000', px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>DANH SÁCH KỲ THI</Typography>
                <Typography variant="subtitle2">🏆</Typography>
              </Box>
              <TableContainer>
                <Table size="small" sx={{ '& td, & th': { color: '#ccc', borderBottom: '1px solid #333', py: 1.5 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="15%">#</TableCell>
                      <TableCell>Tên kỳ thi</TableCell>
                      <TableCell align="right">Ngày</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingExams.map((exam, index) => (
                      <TableRow key={exam.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#333' } }}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ color: '#e74c3c', fontWeight: 'bold' }}>{exam.name}</TableCell>
                        <TableCell align="right" sx={{ color: '#e74c3c', fontSize: '0.75rem' }}>{exam.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ p: 1.5, textAlign: 'center', borderTop: '1px solid #444', bgcolor: 'rgba(0,0,0,0.2)' }}>
                <Typography variant="caption" sx={{ color: '#aaa', display: 'flex', justifyContent: 'center' }}>
                  <span style={{ color: '#3498db', cursor: 'pointer', fontWeight: 'bold' }}>Xem tất cả kỳ thi &gt;&gt;&gt;</span>
                </Typography>
              </Box>
            </Paper>

          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
