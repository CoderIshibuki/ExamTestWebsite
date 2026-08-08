import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # AdminDashboard: CircularProgress
    if 'AdminDashboard.tsx' in filepath:
        content = content.replace('CircularProgress, ', '')
        
    # ExamRoom: ErrorOutlinedd -> ErrorOutlined
    if 'ExamRoom.tsx' in filepath:
        content = content.replace('ErrorOutlinedd', 'ErrorOutlined')

    # ProctorDashboard: Paper import
    if 'ProctorDashboard.tsx' in filepath:
        content = content.replace("import { Box, Typography, Grid } from '@mui/material';", "import { Box, Typography, Grid, Paper, Alert, AlertTitle } from '@mui/material';")
        content = content.replace('<AlertTitle>', '')
        content = content.replace('</AlertTitle>', '')
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

src_dir = 'frontend/src'
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            fix_file(os.path.join(root, f))
