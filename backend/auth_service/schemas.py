from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    # Trước đây không có ràng buộc độ dài nào ở backend — chỉ frontend tự kiểm tra
    # (dễ bị bypass bằng cách gọi thẳng API, VD Postman/curl, đặt mật khẩu 1 ký tự).
    password: str = Field(min_length=8)
    role: Optional[str] = "student"

class AdminUserCreate(UserBase):
    password: Optional[str] = Field(default=None, min_length=8)
    role: Optional[str] = "student"

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

class UserResponse(UserBase):
    id: UUID
    role: str
    is_active: bool
    requires_password_change: bool = False
    created_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class AdminUserCreateResponse(UserResponse):
    # Chỉ có giá trị khi admin tạo user không tự đặt mật khẩu — mật khẩu tạm sinh ngẫu
    # nhiên cần được admin thấy 1 LẦN DUY NHẤT ngay sau khi tạo để gửi lại cho người dùng
    # (không lưu lại được sau đó vì chỉ lưu bản hash trong DB).
    temp_password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
