import { Box, Typography, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import type { Violation } from '../../types/proctoring';

interface ViolationFeedProps {
  violations: Violation[];
}

const ViolationFeed = ({ violations }: ViolationFeedProps) => {
  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: 'background.paper', borderLeft: 1, borderColor: 'divider' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Recent Violations
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
                      {violation.type}
                    </Typography>
                    <Chip 
                      label={violation.severity} 
                      size="small" 
                      color={violation.severity === 'high' ? 'error' : violation.severity === 'medium' ? 'warning' : 'info'}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Student: {violation.user_id}
                    <br />
                    {new Date(violation.timestamp).toLocaleTimeString()}
                  </Typography>
                }
              />
            </ListItem>
            <Divider component="li" />
          </Box>
        ))}
        {violations.length === 0 && (
          <ListItem>
            <ListItemText primary={<Typography color="text.secondary" sx={{ textAlign: 'center' }}>No violations yet</Typography>} />
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default ViolationFeed;
