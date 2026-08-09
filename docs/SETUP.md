# Hướng dẫn dựng môi trường phát triển

## Vì sao nên dùng Docker?

Dự án này có kiến trúc **microservices**: 6 backend service Python (FastAPI) riêng biệt, 3 loại database (PostgreSQL, MongoDB, Redis), 1 Celery worker và 1 API Gateway (nginx). Nếu không dùng Docker, bạn phải tự cài và cấu hình từng thành phần này thủ công, chạy tay ~9 tiến trình song song, và tự sửa mọi biến môi trường trỏ đúng `localhost` thay vì tên container nội bộ.

Docker Compose gói toàn bộ việc đó vào một lệnh duy nhất, chạy giống hệt nhau trên mọi hệ điều hành (Windows/Mac/Linux).

## 1. Cài Docker

- **Windows/Mac:** cài [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt update
  sudo apt install docker.io docker-compose-plugin
  ```

## 2. Clone repo & cấu hình biến môi trường

```bash
git clone https://github.com/CoderIshibuki/ExamTestWebsite.git
cd ExamTestWebsite
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Mở file `.env` vừa tạo và điền giá trị thật (mật khẩu DB, `JWT_SECRET` ngẫu nhiên đủ mạnh,...). **Không commit các file `.env` này lên Git** — xem chi tiết từng biến tại [ENV_VARS.md](ENV_VARS.md).

> `frontend/.env` mặc định `VITE_API_URL=/api` — **không đổi thành `/api/v1`**, vì các API client trong `frontend/src/api/*.ts` đã tự thêm tiền tố `/v1/...` vào sau baseURL. Đổi giá trị này sẽ khiến toàn bộ API thi/chấm điểm/giám sát bị lỗi 404 (double `/v1/v1/`).

## 3. Tạo SSL certificate (dev, self-signed)

Nginx gateway lắng nghe cả HTTPS (443), cần cert. Không commit cert lên Git — mỗi máy tự tạo cert riêng:

```bash
pip install cryptography
python scripts/generate_ssl.py
```

Script sẽ tạo `nginx/ssl/cert.pem` và `nginx/ssl/key.pem` (tự động bị `.gitignore` bỏ qua).

## 4. Dựng toàn bộ hệ thống

```bash
docker compose up --build
```

Lần đầu chạy sẽ build image cho 6 service Python + tải image PostgreSQL/MongoDB/Redis/nginx — có thể mất vài phút. Các lần sau chỉ cần:

```bash
docker compose up
```

Kiểm tra các service đã "healthy":
```bash
docker compose ps
```

## 5. Truy cập ứng dụng

- Ứng dụng (qua API Gateway): `http://localhost`
- Swagger docs (Auth service): `http://localhost/docs`
- Từng service riêng lẻ (debug): `http://localhost:800{0..5}/health`

## 6. Dừng / dọn dẹp

```bash
docker compose down            # dừng, giữ lại dữ liệu (volumes)
docker compose down -v         # dừng và xoá luôn dữ liệu database
```

---

## Chạy frontend riêng để phát triển giao diện

Nếu chỉ sửa UI và có backend chạy sẵn (Docker ở máy khác, hoặc server dùng chung), không cần cài Docker ở máy làm việc — chỉ cần Node.js:

```bash
cd frontend
npm install
npm run dev
```

Sửa `frontend/.env` để `VITE_API_URL` trỏ tới backend đang chạy (VD: `http://192.168.1.10/api` nếu backend chạy ở máy khác trong cùng mạng LAN).

---

## Chạy không dùng Docker

Chỉ nên làm khi thực sự không thể cài Docker (VD: máy công ty bị khoá quyền admin). Cân nhắc dùng 1 VPS nhỏ có sẵn Docker thay vì làm theo cách này nếu có thể.

### 1. Cài database

Cài PostgreSQL 15, MongoDB 6, Redis 7 trực tiếp lên máy — cấu hình user/password/port khớp với giá trị trong `.env`.

### 2. Chạy từng backend service

Với **mỗi** service trong `backend/{auth,question,exam,realtime,grading,proctoring}_service`:

```bash
cd backend/auth_service
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Sửa biến môi trường trong .env: đổi các host "postgres", "mongodb", "redis"
# thành "localhost" vì không còn Docker network nội bộ nữa.
uvicorn main:app --reload --port 8000
```

Lặp lại cho các service còn lại, mỗi service dùng 1 cổng riêng (xem bảng cổng trong [README.md](../README.md#kiến-trúc-hệ-thống)) và 1 terminal riêng.

### 3. Chạy Celery worker (cho grading_service)

```bash
cd backend/grading_service
celery -A tasks.celery_app worker --loglevel=info
```

### 4. Cấu hình nginx thật

Chép nội dung `nginx/nginx.conf` vào cấu hình nginx cài trên máy, sửa các `upstream` từ tên container (`auth_service:8000`) thành `localhost:8000`, `localhost:8001`,...

### 5. Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| Gọi API bị 404 khắp nơi (trừ đăng nhập) | `VITE_API_URL` bị đặt sai (`/api/v1` thay vì `/api`) — xem mục 2 |
| `docker compose up` báo lỗi thiếu biến môi trường | Chưa `cp .env.example .env` hoặc thiếu biến — xem [ENV_VARS.md](ENV_VARS.md) |
| nginx không khởi động được (thiếu cert) | Chưa chạy `python scripts/generate_ssl.py` |
| Đăng nhập được nhưng vào trang nào cũng bị đá về `/login` | `JWT_SECRET` khác nhau giữa các service — đảm bảo dùng chung 1 file `.env` |
