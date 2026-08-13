from fastapi import FastAPI, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.security import OAuth2PasswordRequestForm
import os
from contextlib import asynccontextmanager

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import engine, Base, get_db
import models
import schemas
import auth
from jose import JWTError, jwt

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

from fastapi.middleware.cors import CORSMiddleware
import json

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Auth Service API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from middleware.audit import AuditLogMiddleware
app.add_middleware(AuditLogMiddleware)

origins_str = os.getenv("CORS_ORIGINS", '["http://localhost:3000", "http://localhost:5173"]')
try:
    origins = json.loads(origins_str)
except Exception:
    origins = []

# Always add localhost:5173 for Vite dev server if not present
if "http://localhost:5173" not in origins:
    origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    query = select(models.User).where((models.User.username == user.username) | (models.User.email == user.email))
    result = await db.execute(query)
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        hashed_password=hashed_password
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    query = select(models.User).where(models.User.username == form_data.username)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    refresh_token = auth.create_refresh_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(auth.oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    query = select(models.User).where(models.User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

from pydantic import BaseModel
class RefreshTokenRequest(BaseModel):
    refresh_token: str

@app.post("/refresh", response_model=schemas.Token)
@limiter.limit("10/minute")
async def refresh_token(request: Request, body: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(body.refresh_token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    query = select(models.User).where(models.User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
        
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    new_refresh_token = auth.create_refresh_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

@app.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_admin(
    user_in: schemas.AdminUserCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    query = select(models.User).where((models.User.username == user_in.username) | (models.User.email == user_in.email))
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username or email already registered")

    requires_reset = False
    password_to_hash = user_in.password
    if not password_to_hash:
        password_to_hash = "123456"
        requires_reset = True

    hashed_password = auth.get_password_hash(password_to_hash)
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role or "student",
        hashed_password=hashed_password,
        requires_password_change=requires_reset
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.get("/users", response_model=list[schemas.UserResponse])
async def list_users(
    skip: int = 0, limit: int = 100, role: str = None, 
    current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    query = select(models.User)
    if role:
        query = query.where(models.User.role == role)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@app.put("/users/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: str, user_update: schemas.UserUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    query = select(models.User).where(models.User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    await db.commit()
    await db.refresh(user)
    return user

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    query = select(models.User).where(models.User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Soft delete
    user.is_active = False
    await db.commit()
    return {"detail": "User soft deleted"}

@app.post("/change-password")
async def change_password(
    data: schemas.PasswordChangeRequest,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not auth.verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    new_hashed = auth.get_password_hash(data.new_password)
    current_user.hashed_password = new_hashed
    current_user.requires_password_change = False
    
    await db.commit()
    return {"detail": "Password changed successfully"}


@app.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    data: schemas.ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Yêu cầu đặt lại mật khẩu qua email. Luôn trả về cùng 1 thông báo thành công
    chung chung dù email có tồn tại hay không, để tránh lộ việc email nào đã
    đăng ký tài khoản trong hệ thống (user enumeration).
    """
    import secrets
    from datetime import datetime, timedelta, timezone
    from email_service import send_password_reset_email

    generic_response = {"detail": "Nếu email tồn tại trong hệ thống, một đường dẫn đặt lại mật khẩu đã được gửi tới email đó."}

    query = select(models.User).where(models.User.email == data.email)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user or not user.is_active:
        return generic_response

    raw_token = secrets.token_urlsafe(32)
    user.reset_token_hash = auth.get_password_hash(raw_token)
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    await db.commit()

    send_password_reset_email(user.email, raw_token)
    return generic_response


@app.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    data: schemas.ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Đặt mật khẩu mới bằng token nhận được qua email từ /forgot-password."""
    from datetime import datetime, timezone

    query = select(models.User).where(models.User.reset_token_hash.isnot(None))
    result = await db.execute(query)
    candidates = result.scalars().all()

    matched_user = None
    for candidate in candidates:
        if candidate.reset_token_expires_at and candidate.reset_token_expires_at < datetime.now(timezone.utc):
            continue
        if auth.verify_password(data.token, candidate.reset_token_hash):
            matched_user = candidate
            break

    if not matched_user:
        raise HTTPException(status_code=400, detail="Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.")

    matched_user.hashed_password = auth.get_password_hash(data.new_password)
    matched_user.reset_token_hash = None
    matched_user.reset_token_expires_at = None
    matched_user.requires_password_change = False
    await db.commit()

    return {"detail": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới."}
