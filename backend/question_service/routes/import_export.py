from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse
import pandas as pd
import io
import crud
from dependencies import require_role
from datetime import datetime

router = APIRouter()

@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_questions(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["teacher", "admin"]))
):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")
        
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Expected columns: text, type, options (JSON string), correct_answer, difficulty, subject, tags (comma separated)
        imported_count = 0
        for _, row in df.iterrows():
            question_data = {
                "content": {"text": str(row.get('text', ''))},
                "type": str(row.get('type', 'multiple_choice')),
                "options": [], # Simplify for PoC: require JSON string parsing for real app
                "correct_answer": str(row.get('correct_answer', '')),
                "metadata": {
                    "difficulty": str(row.get('difficulty', 'medium')),
                    "subject": str(row.get('subject', 'general')),
                    "tags": [t.strip() for t in str(row.get('tags', '')).split(',')] if pd.notna(row.get('tags')) else []
                },
                "created_by": current_user.get("id")
            }
            # Add options if provided as valid JSON string, otherwise empty list
            try:
                import json
                if pd.notna(row.get('options')):
                    question_data["options"] = json.loads(row.get('options'))
            except:
                pass
                
            await crud.create_question(question_data)
            imported_count += 1
            
        return {"message": f"Successfully imported {imported_count} questions"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/export")
async def export_questions(
    current_user: dict = Depends(require_role(["teacher", "admin"]))
):
    try:
        # Get all questions
        _, items = await crud.get_questions(skip=0, limit=10000)
        
        # Flatten for excel
        data = []
        for q in items:
            data.append({
                "id": q.get("_id"),
                "text": q.get("content", {}).get("text", ""),
                "type": q.get("type", ""),
                "correct_answer": str(q.get("correct_answer", "")),
                "difficulty": q.get("metadata", {}).get("difficulty", ""),
                "subject": q.get("metadata", {}).get("subject", ""),
                "tags": ",".join(q.get("metadata", {}).get("tags", []))
            })
            
        df = pd.DataFrame(data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
            
        output.seek(0)
        
        headers = {
            'Content-Disposition': f'attachment; filename="questions_export_{datetime.now().strftime("%Y%m%d")}.xlsx"'
        }
        
        return StreamingResponse(
            output, 
            headers=headers, 
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting data: {str(e)}")
