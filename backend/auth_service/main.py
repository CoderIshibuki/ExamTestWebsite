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
