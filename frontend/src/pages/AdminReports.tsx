import { Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

const AdminReports = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Mock data for reports since getReports is returning empty right now
    setData([
      { name: 'Math', pass: 400, fail: 240 },
      { name: 'Science', pass: 300, fail: 139 },
      { name: 'History', pass: 200, fail: 980 },
      { name: 'English', pass: 278, fail: 390 },
      { name: 'Art', pass: 189, fail: 480 },
    ]);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Reports & Analytics
      </Typography>
      
      <Box sx={{ height: 500, width: '100%', bgcolor: 'background.paper', p: 3, borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>Pass/Fail Ratio per Subject</Typography>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pass" stackId="a" fill="#82ca9d" />
            <Bar dataKey="fail" stackId="a" fill="#f44336" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default AdminReports;
