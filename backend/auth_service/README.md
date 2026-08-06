# Auth Service

Đây là Authentication Service cho hệ thống thi cử trực tuyến.
Service này chịu trách nhiệm:
- Đăng ký và đăng nhập (JWT)
- Phân quyền người dùng (Role-Based Access Control)
- Quản lý thông tin user

## Cấu trúc công nghệ
- **Framework**: FastAPI
- **Database**: PostgreSQL (Sử dụng `asyncpg` và `SQLAlchemy` async)
- **Authentication**: JWT (sử dụng `python-jose` và `passlib`)

## Yêu cầu môi trường
Đảm bảo đã thiết lập các biến môi trường trong file `.env` ở thư mục gốc (hoặc export vào environment).
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_HOST`
- `JWT_SECRET`
- ...

## Chạy Local (Không dùng Docker)
```bash
python -m venv venv
source venv/bin/activate  # Hoặc venv\Scripts\activate trên Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Chạy Unit Test
Service sử dụng `pytest` kết hợp `pytest-asyncio` và `aiosqlite` (in-memory db) để test mà không cần PostgreSQL thật.
```bash
pytest tests/ -v
```

## API Docs
Truy cập: `http://localhost:8000/docs` (Swagger UI) khi app đang chạy.
