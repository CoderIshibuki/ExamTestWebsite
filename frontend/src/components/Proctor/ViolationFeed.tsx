import { Box, Typography, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import type { Violation } from '../../types/proctoring';

interface ViolationFeedProps {
  violations: Violation[];
}

// Nhãn tiếng Việt dễ hiểu cho giám thị — trước đây hiện thẳng mã kỹ thuật (VD: "tab_switch").
const VIOLATION_LABELS: Record<string, string> = {
  tab_switch: 'Chuyển sang tab khác',
  window_blur: 'Mất focus cửa sổ thi',
  no_face_detected: 'Không thấy khuôn mặt',
  multiple_faces_detected: 'Phát hiện nhiều người',
  face_turned_away: 'Quay mặt khỏi màn hình',
  gaze_away_from_screen: 'Ánh mắt lệch khỏi màn hình',
  suspicious_camera_device: 'Nghi ngờ dùng camera ảo',
  phone_detected: 'Phát hiện điện thoại',
  book_detected: 'Phát hiện sách/tài liệu',
};

const SEVERITY_COLOR: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'info',
};

const ViolationFeed = ({ violations }: ViolationFeedProps) => {
  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: 'background.paper', borderLeft: 1, borderColor: 'divider' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Vi phạm gần đây
        </Typography>
      </Box>
      <Divider />
      <List>
        {violations.slice().reverse().map((violation, index) => (
          <Box key={violation.id || index}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {VIOLATION_LABELS[violation.type] || violation.type}
                    </Typography>
                    <Chip
                      label={violation.severity}
                      size="small"
                      color={SEVERITY_COLOR[violation.severity] || 'default'}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Học sinh: {violation.user_id}
                    <br />
                    {new Date(violation.timestamp).toLocaleTimeString('vi-VN')}
                  </Typography>
                }
              />
            </ListItem>
            <Divider component="li" />
          </Box>
        ))}
        {violations.length === 0 && (
          <ListItem>
            <ListItemText primary={<Typography color="text.secondary" sx={{ textAlign: 'center' }}>Chưa có vi phạm nào</Typography>} />
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default ViolationFeed;
