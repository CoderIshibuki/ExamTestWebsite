import React, { useContext, useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Avatar, Chip,
  Divider, Button, TextField, Alert, Tabs, Tab, Paper, Skeleton,
} from '@mui/material';
import {
  VerifiedUser, LockReset, FactCheck, School,
  AssignmentTurnedIn, CheckCircle, EmojiEvents, Visibility,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { gradingApi } from '../api/gradingApi';
import { adminApi } from '../api/adminApi';
import apiClient from '../api/apiClient';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  student: 'Học sinh',
};

export default function Profile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);

  // Tab Kết quả thi
  const [results, setResults] = useState<any[]>([]);
  const [examsMap, setExamsMap] = useState<Record<string, { title: string; passing_score?: number }>>({});
  const [loadingResults, setLoadingResults] = useState(true);

  // Tab Đổi mật khẩu
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoadingResults(true);
        const [resultsData, examsData] = await Promise.all([
          gradingApi.getMyResults().catch(() => []),
          adminApi.getExams().catch(() => []),
        ]);

        const eMap: Record<string, { title: string; passing_score?: number }> = {};
        (examsData || []).forEach((e: any) => {
          eMap[e.id] = { title: e.title, passing_score: e.passing_score ?? 50 };
        });
        setExamsMap(eMap);
        setResults(resultsData || []);
      } catch (err) {
        console.error('Failed to load results in profile', err);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchResults();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setPwLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPwMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to change password', err);
      setPwMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.',
      });
    } finally {
      setPwLoading(false);
    }
  };

  const totalExamsTaken = results.length;
  const passedCount = results.filter((r) => {
    const passThreshold = examsMap[r.exam_id]?.passing_score ?? 50;
    return r.percentage >= passThreshold;
  }).length;
  const avgScore =
    totalExamsTaken > 0
      ? Math.round(results.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalExamsTaken)
      : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Hồ sơ cá nhân & Tài khoản
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Quản lý thông tin tài khoản, theo dõi lịch sử thi và bảo mật đăng nhập.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* User Info Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          {user ? (
            <Card
              sx={{
                borderRadius: 1.5,
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
                bgcolor: '#FFFFFF',
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 68,
                    height: 68,
                    bgcolor: '#EFF6FF',
                    color: '#2563EB',
                    mb: 1.5,
                    fontSize: 26,
                    fontWeight: 800,
                    border: '2px solid #DBEAFE',
                    borderRadius: 1.2,
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                  {user.full_name || user.username}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 1.5 }}>
                  @{user.username} • {user.email}
                </Typography>

                <Chip
                  icon={<VerifiedUser sx={{ fontSize: '15px !important' }} />}
                  label={ROLE_LABELS[user.role] || user.role}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700, px: 1, mb: 2, borderRadius: 1 }}
                />

                <Divider sx={{ width: '100%', mb: 2, borderColor: '#F1F5F9' }} />

                {/* Quick Portals for Admin/Teacher */}
                {user.role === 'admin' && (
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    startIcon={<VerifiedUser />}
                    onClick={() => navigate('/admin/dashboard')}
                    sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, borderRadius: 1.5, textTransform: 'none', fontWeight: 700, mb: 1.5 }}
                  >
                    Vào trang Quản trị Admin
                  </Button>
                )}

                {user.role === 'teacher' && (
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    startIcon={<School />}
                    onClick={() => navigate('/admin/exams')}
                    sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, borderRadius: 1.5, textTransform: 'none', fontWeight: 700, mb: 1.5 }}
                  >
                    Vào Cổng Giảng dạy (Teacher)
                  </Button>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  startIcon={<LockReset />}
                  onClick={() => setTab(1)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1.5,
                    color: '#475569',
                    borderColor: '#E2E8F0',
                    fontWeight: 600,
                    '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' },
                  }}
                >
                  Đổi mật khẩu
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Skeleton variant="circular" width={68} height={68} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1.5 }} />
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Content Tabs Column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 1.5,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
              overflow: 'hidden',
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, val) => setTab(val)}
              sx={{
                borderBottom: '1px solid #E2E8F0',
                px: 2,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.9rem', minHeight: 48 },
              }}
            >
              <Tab icon={<FactCheck sx={{ fontSize: 18 }} />} iconPosition="start" label="Kết quả thi đã làm" />
              <Tab icon={<LockReset sx={{ fontSize: 18 }} />} iconPosition="start" label="Đổi mật khẩu" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Tab 0: Kết quả thi */}
              {tab === 0 && (
                <Box>
                  {/* KPI Stats */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 38, height: 38, bgcolor: '#EFF6FF', color: '#2563EB', borderRadius: 1 }}>
                          <AssignmentTurnedIn sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Đã nộp</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{totalExamsTaken}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 38, height: 38, bgcolor: '#ECFDF5', color: '#10B981', borderRadius: 1 }}>
                          <CheckCircle sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Đạt chuẩn</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981', lineHeight: 1.1 }}>{passedCount} / {totalExamsTaken}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 38, height: 38, bgcolor: '#FFFBEB', color: '#F59E0B', borderRadius: 1 }}>
                          <EmojiEvents sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Điểm TB</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#F59E0B', lineHeight: 1.1 }}>{avgScore}%</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {loadingResults ? (
                    <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1.5 }} />
                  ) : results.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px dashed #CBD5E1' }}>
                      <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                        Bạn chưa làm bài thi nào. Hãy bắt đầu một bài kiểm tra để có bảng điểm!
                      </Typography>
                      <Button variant="contained" size="small" onClick={() => navigate('/dashboard')} sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}>
                        Xem danh sách đề thi
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {results.map((r) => {
                        const title = examsMap[r.exam_id]?.title || `Đề thi #${r.exam_id.slice(0, 8)}`;
                        const passingScore = examsMap[r.exam_id]?.passing_score ?? 50;
                        const isPassed = r.percentage >= passingScore;

                        return (
                          <Box
                            key={r.id || r.attempt_id}
                            sx={{
                              p: 2,
                              borderRadius: 1.5,
                              border: '1px solid #E2E8F0',
                              bgcolor: '#FFFFFF',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: 1.5,
                              transition: 'all 0.15s ease',
                              '&:hover': { borderColor: '#2563EB', bgcolor: '#F8FAFC' },
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                {title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                Nộp ngày: {new Date(r.created_at || Date.now()).toLocaleDateString('vi-VN')}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isPassed ? '#10B981' : '#EF4444' }}>
                                  {r.score} điểm ({r.percentage}%)
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                  Chuẩn đạt: {passingScore}%
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Visibility sx={{ fontSize: 16 }} />}
                                onClick={() => navigate(`/student/result/${r.attempt_id}`)}
                                sx={{ borderRadius: 1.2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                              >
                                Xem bài
                              </Button>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab 1: Đổi mật khẩu */}
              {tab === 1 && (
                <Box component="form" onSubmit={handleChangePassword} sx={{ maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {pwMsg && (
                    <Alert severity={pwMsg.type} sx={{ borderRadius: 1.5 }}>
                      {pwMsg.text}
                    </Alert>
                  )}

                  <TextField
                    type="password"
                    label="Mật khẩu hiện tại"
                    size="small"
                    required
                    fullWidth
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />

                  <TextField
                    type="password"
                    label="Mật khẩu mới (tối thiểu 6 ký tự)"
                    size="small"
                    required
                    fullWidth
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />

                  <TextField
                    type="password"
                    label="Xác nhận mật khẩu mới"
                    size="small"
                    required
                    fullWidth
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={pwLoading}
                    sx={{
                      bgcolor: '#2563EB',
                      '&:hover': { bgcolor: '#1D4ED8' },
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      py: 1,
                      mt: 1,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {pwLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
