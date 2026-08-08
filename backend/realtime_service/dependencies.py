from jose import jwt, JWTError
from fastapi import HTTPException
from config import settings

def validate_token(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if user_id is None:
            raise ValueError("Invalid token: no sub")
        return {"id": user_id, "role": role}
    except JWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")
