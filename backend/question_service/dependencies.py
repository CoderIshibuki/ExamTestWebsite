import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

from fastapi import Header
def require_internal_token(x_internal_token: str = Header(None)):
    if not x_internal_token or x_internal_token != settings.JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal service token"
        )
    return True

ROLE_PERMISSIONS = {
    "student": ["exam:read", "attempt:create", "attempt:answer", "attempt:submit", "result:read_own"],
    "teacher": [
        "exam:read", "exam:create", "exam:update", "exam:delete", "exam:publish", "exam:assign",
        "question:read", "question:create", "question:update", "question:delete",
        "result:read_managed", "proctoring:read", "proctoring:flag", "proctoring:terminate"
    ],
    "admin": [
        "exam:read", "exam:create", "exam:update", "exam:delete", "exam:publish", "exam:assign",
        "question:read", "question:create", "question:update", "question:delete",
        "attempt:create", "attempt:answer", "attempt:submit", "result:read_own", "result:read_managed",
        "user:read", "user:create", "user:update", "user:delete",
        "proctoring:read", "proctoring:flag", "proctoring:terminate"
    ]
}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None or user_id == "system":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Fetch role from auth_service
    # auth_service is available at http://auth_service:8000
    try:
        async with httpx.AsyncClient() as client:
            # We call /me endpoint
            # Wait, /me is defined in main.py of auth_service: @app.get("/me")
            response = await client.get(
                "http://auth_service:8000/me", 
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code != 200:
                raise credentials_exception
            
            user_data = response.json()
            if not user_data.get("is_active"):
                raise credentials_exception
            role = user_data.get("role", "student")
            
            return {"id": user_id, "role": role, "token": token}
    except Exception:
        raise credentials_exception

def require_permission(permission: str):
    def permission_checker(current_user: dict = Depends(get_current_user)):
        role = current_user.get("role", "student")
        allowed_permissions = ROLE_PERMISSIONS.get(role, [])
        if permission not in allowed_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}"
            )
        return current_user
    return permission_checker
