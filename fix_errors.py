import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix Grid item -> size
    content = re.sub(r'<Grid\s+item\s+xs={(\d+)}\s*>', r'<Grid size={{ xs: \1 }}>', content)
    content = re.sub(r'<Grid\s+item\s+xs={(\d+)}\s+sm={(\d+)}\s+key={([^}]+)}\s*>', r'<Grid size={{ xs: \1, sm: \2 }} key={\3}>', content)
    content = re.sub(r'<Grid\s+item\s+xs={(\d+)}\s+md={(\d+)}\s+lg={(\d+)}', r'<Grid size={{ xs: \1, md: \2, lg: \3 }}', content)
    content = re.sub(r'<Grid\s+item\s+xs={(\d+)}\s+lg={(\d+)}', r'<Grid size={{ xs: \1, lg: \2 }}', content)
    
    # Fix HelpOutline -> HelpOutlined
    content = content.replace('HelpOutline', 'HelpOutlined')
    content = content.replace('ErrorOutline', 'ErrorOutlined')
    
    # Fix GridColDef import
    content = content.replace('import { DataGrid, GridColDef }', 'import { DataGrid } from \'@mui/x-data-grid\';\nimport type { GridColDef }')
    
    # Fix PaperProps -> slotProps={{ paper: ... }}
    content = re.sub(r'PaperProps={{([^}]+)}}', r'slotProps={{ paper: {\1} }}', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

src_dir = 'frontend/src'
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            fix_file(os.path.join(root, f))
