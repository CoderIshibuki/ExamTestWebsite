# Changelog

Tất cả thay đổi đáng chú ý của dự án được ghi lại tại đây.

## [Unreleased] - 2026-08-09
### Fixed
- **Đồng hồ đếm giờ thi sai đơn vị** (`useTimer.ts`, `ExamRoom.tsx`): hook nhận nhầm số giây thành số phút (nhân thêm ×60) và bị reset liên tục mỗi lần re-render thay vì đếm lùi ổn định.
- **Bug cấu hình `frontend/.env.example`**: `VITE_API_URL=/api/v1` gây lặp `/v1/v1/...` trong mọi request thi/chấm điểm/giám sát → sửa thành `/api`.
- **`adminApi.ts`** dùng `axios` trần thay vì `apiClient` dùng chung → các trang Admin không tự refresh/logout khi token hết hạn như phần còn lại của app.
- **`scripts/generate_ssl.py`** hardcode đường dẫn Windows tuyệt đối (`d:\ExamTestWebsite\...`), không chạy được trên máy/hệ điều hành khác → chuyển sang đường dẫn tương đối.
- Sửa 2 sơ đồ Mermaid trong `docs/` không khớp kiến trúc thực tế (nhắc tới RabbitMQ, Analytics Service không tồn tại; thiếu khai báo `participant` gây lỗi render).

### Added
- `goToQuestion(index)` trong `ExamContext` — thay cho vòng lặp gọi `nextQuestion()`/`prevQuestion()` nhiều lần khi nhảy câu hỏi bất kỳ.
- Auto-refresh access token (`src/api/authInterceptors.ts`) tận dụng endpoint `/refresh` sẵn có ở backend nhưng trước đó frontend chưa dùng tới — không còn bị đăng xuất ngay khi access token hết hạn nếu còn refresh token hợp lệ.
- `docs/SETUP.md` — hướng dẫn dựng môi trường dev đầy đủ (Docker & không dùng Docker).
- `docs/ENV_VARS.md` — bảng tổng hợp toàn bộ biến môi trường cần thiết cho từng service.
- `SECURITY.md` — quy tắc xử lý secret và ghi nhận sự cố lộ SSL key đã xử lý.

### Changed
- Viết lại `Home.tsx`: chuyển từ theme tối kiểu diễn đàn cũ sang theme sáng Indigo/Emerald đồng bộ với Dashboard/Admin/ExamRoom; thay dữ liệu kỳ thi hard-code giả bằng gọi API thật (`getPublishedExams`).
- Gộp logic interceptor axios dùng chung (`authInterceptors.ts`) cho `apiClient.ts` và `axios.ts`, giảm trùng lặp code.
- Viết lại `README.md` (gốc) và `frontend/README.md` (trước đó là template Vite mặc định, chưa có thông tin riêng cho dự án).
- Cập nhật `docs/CongNgheSuDung.md`, `docs/SoDoKienTrucTongThe.md`, `docs/SoDoLuongRealTime.md` cho khớp với kiến trúc/công nghệ thực tế đang triển khai.

### Removed
- Xoá 2 component chết không được dùng ở đâu trong codebase: `RootRedirect.tsx`, `PrivateRoute.tsx`.
- Xoá file debug/scratch không thuộc về ứng dụng: `frontend/test_error.cjs`, `walkthrough.md`.
- Gỡ khỏi Git tracking: `nginx/ssl/cert.pem`, `nginx/ssl/key.pem` (SSL private key bị lộ trong lịch sử Git dù đã có trong `.gitignore`) và thư mục `node_modules/` bị commit nhầm ở gốc repo — chi tiết tại `SECURITY.md`.

## [Phase 2] - 2026-08-08
### Added
- **Proctoring Service** (`backend/proctoring_service`): New microservice for handling AI Proctoring events and risk calculation.
- **Frontend App**: Full implementation of the student dashboard, exam room, and result summary using React, Material UI, and Socket.IO.
- **E2E Testing**: UI and backend end-to-end simulated test flow (E2E script coverage extended to Phase 2 features).

### Changed
- **Risk Engine**: Upgraded the `proctoring_service` risk scoring logic to use **Redis** instead of in-memory dictionaries. This enables multi-instance scalability and prevents data loss on container restarts. Risk state is saved under the key `risk:{exam_id}:{user_id}` with a 10-minute TTL.
- **Docker Compose**: Added `proctoring_service` and updated Nginx gateway routes.
