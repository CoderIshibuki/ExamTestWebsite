import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix GridColDef
    content = content.replace('import { DataGrid, GridColDef }', "import { DataGrid } from '@mui/x-data-grid';\nimport type { GridColDef }")
    content = content.replace('import { DataGrid, GridToolbar, GridColDef }', "import { DataGrid, GridToolbar } from '@mui/x-data-grid';\nimport type { GridColDef }")

    # ProctorDashboard
    if 'ProctorDashboard.tsx' in filepath:
        content = content.replace('AlertTitle, ', '')
        content = re.sub(r'<Grid\s+item\s+xs={(\d+)}\s+md={(\d+)}\s+lg={(\d+)}', r'<Grid size={{ xs: \1, md: \2, lg: \3 }}', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

src_dir = 'frontend/src'
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            fix_file(os.path.join(root, f))
