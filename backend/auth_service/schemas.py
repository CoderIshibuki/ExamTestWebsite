from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "student"

class AdminUserCreate(UserBase):
    password: Optional[str] = None
    role: Optional[str] = "student"

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

class UserResponse(UserBase):
    id: UUID
    role: str
    is_active: bool
    requires_password_change: bool = False
    created_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
