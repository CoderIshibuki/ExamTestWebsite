# Changelog

Tất cả các thay đổi, nâng cấp và bản vá bảo mật của dự án **ExamTestWebsite** được ghi nhận chi tiết tại đây theo định dạng [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/).

---

## [1.4.0] - 2026-08-27

### 🚀 Nâng cấp Giao diện & Trải nghiệm Người dùng (UI/UX)
- **Thiết kế chuẩn Modern SaaS (Lấy cảm hứng từ 21st.dev):**
  - Tích hợp bộ font quốc tế **Inter** và **Plus Jakarta Sans** sắc nét.
  - Sidebar Dark Slate (`#0F172A`), workspace nền xám sáng nhẹ (`#F8FAFC`), card viền mảnh 1px bo góc tròn `14px`.
- **Zen Focus Mode cho Phòng thi (`ExamRoom.tsx`):**
  - Đồng hồ đếm ngược dạng pill badge đổi màu linh hoạt theo thời gian còn lại (xanh lục → vàng nhấp nháy → đỏ cảnh báo gấp).
  - Thẻ câu hỏi và lựa chọn đáp án tương tác mượt mà: viền xanh dương `#2563EB`, nền xanh nhạt `#EFF6FF` khi chọn.
  - Bento Matrix điều hướng câu hỏi bên phải với 3 trạng thái màu rõ rệt (*Đang xem*, *Đã làm*, *Chưa làm*).
- **Bento Stats cho Kết quả thi (`ResultSummary.tsx`, `StudentResults.tsx`):**
  - Loại bỏ các banner xanh to choán tầm nhìn.
  - Bố cục thẻ Bento với các chỉ số KPI: Tỉ lệ đạt, Số câu đúng (xanh lá), Số câu sai (đỏ), Điểm số tổng.
- **Trung tâm Giám thị AI Proctoring (`StudentCard.tsx`, `ViolationFeed.tsx`):**
  - Hiển thị đầy đủ **Họ và tên thật**, **@username** và **Địa chỉ IP máy thí sinh**.
  - Viền màu phân loại rủi ro (🟢 An toàn / 🟡 Cảnh báo / 🔴 Vi phạm nghiêm trọng).

### ⚡ Tối ưu Hiệu năng & Code Splitting
- Chuyển đổi toàn bộ routing trong `frontend/src/App.tsx` sang **`React.lazy()` + `<Suspense>`** với spinner loading mượt mà.
- Cấu hình Rollup `manualChunks` trong `vite.config.ts` chia tách vendor libraries: `vendor-mui`, `vendor-charts`, `vendor-ai`.
- **Kết quả đo đạc thực tế:**
  - Initial JS bundle giảm từ **2.68 MB** xuống còn **228 kB** (giảm hơn **91%** dung lượng tải trang đầu).
  - Tốc độ `npm run build` giảm từ **21.76s** xuống còn **11.33s** (nhanh hơn gấp đôi).
  - Tất cả các trang được tải on-demand theo từng chunk 2-15 kB.

### 🧪 Kiểm thử Tự động & Tài liệu
- Bổ sung bộ kiểm thử tự động với Vitest (`npm test`): **4 test files, 8 tests passed 100%**.
- Viết test suite `excelQuestionTransform.test.ts` kiểm thử toàn diện logic biến đổi và validate dữ liệu Import Excel.
- Hoàn thiện tài liệu **Hướng dẫn Sử dụng Chi tiết** tại `docs/HUONG_DAN_SU_DUNG.md`.
- Hoàn thiện tài liệu **Hướng dẫn Cài đặt & Triển khai Toàn diện** tại `docs/SETUP.md`.

---

## [1.3.0] - 2026-08-21

### 🛡️ Bảo mật, RBAC & Chống Race Condition
- **Chống Race Condition tạo lượt thi (`start_exam`):** Áp dụng khoá `pg_advisory_xact_lock` với thuật toán `hashtext(exam_id, user_id)` trong Postgres, chặn hoàn toàn tình trạng mở nhiều tab hoặc double click để vượt quá số lượt thi cho phép.
- **Bảo vệ tài khoản Quản trị viên:** Chặn admin tự xoá, tự hạ quyền hoặc tự khoá chính mình trong `AdminUsers.tsx`.
- **Xử lý lỗi UX đồng loạt:** Bắt và hiển thị thông báo lỗi chi tiết từ backend thay vì thông báo chung chung ở 11 component (`AdminUsers`, `AdminExams`, `AdminQuestions`, `AdminCategories`, `ManualQuestionDialog`, `ManualGrading`, `ExamRoom`).
- **Cảnh báo mất kết nối lưu bài thi (`ExamRoom.tsx`):** Thêm Snackbar thông báo ngay lập tức nếu việc tự động lưu đáp án về server gặp sự cố mạng.

---

## [1.2.0] - 2026-08-15

### 📹 Giám thị Live WebRTC & Chấm thi Tự luận
- **Livestream Video WebRTC cho Giám thị:** Thêm WebRTC signaling peer-to-peer qua `realtime_service`, cho phép giám thị xem trực tiếp camera thí sinh theo thời gian thực.
- **Chấm điểm Tự luận Thủ công (Manual Grading):** Hỗ trợ giáo viên xem bài làm văn bản hoặc ảnh chụp tay của học sinh, nhập điểm và lời nhận xét để tự động cộng vào điểm tổng kết.
- **Quản lý Danh mục Môn học (`AdminCategories.tsx`):** Thêm tính năng phân loại môn học cho ngân hàng câu hỏi.
- **Kiểm soát Khung giờ Lịch thi (Exam Schedule):** Bắt buộc kiểm tra khung giờ thi hợp lệ tại backend `start_exam`.
- **Quên mật khẩu & Đổi mật khẩu:** Thêm quy trình cấp lại mật khẩu an toàn qua email với token hash có thời hạn 30 phút và rate-limiting.
- **Import / Export Excel Ngân hàng Câu hỏi:** Hỗ trợ xuất và nhập câu hỏi trắc nghiệm, đúng/sai chuẩn định dạng bảng tính Excel.

### 🔒 Vá Lỗ hổng Bảo mật
- Yêu cầu xác thực `question:read` cho toàn bộ API xem ngân hàng câu hỏi (trước đây không yêu cầu đăng nhập).
- Kiểm tra quyền `role` (Admin/Teacher) khi tham gia phòng giám thị `join_proctor_room`.
- Nhúng `role` claim vào JWT token tại `auth_service`.
- Tự động chạy `alembic upgrade head` cho các service khi khởi động qua Docker Compose.

---

## [1.1.0] - 2026-08-10

### 🤖 AI Proctoring Edge Computing
- **MediaPipe Face Landmarker:** Nhận diện khuôn mặt, phát hiện quay đầu góc lệch >25°, phát hiện rời khỏi khung hình hoặc xuất hiện nhiều người trong camera.
- **YOLOv8n ONNX Object Detection:** Tích hợp mô hình nhận diện thiết bị lạ (điện thoại di động, sách vở) chạy qua ONNX Runtime WASM trong trình duyệt.
- **Nhận diện Camera Ảo:** Kiểm tra danh sách thiết bị ngoại vi để cảnh báo các phần mềm camera ảo (OBS, ManyCam).
- **Quản lý Đề thi Nâng cao (`ManageExamDialog.tsx`):** Thêm giao diện chọn câu hỏi thủ công, chọn ngẫu nhiên theo tiêu chí và phân công giáo viên gác thi.

---

## [1.0.0] - 2026-08-08

### 🌟 Khởi tạo Hệ thống Khảo thí Microservices
- Xây dựng 6 microservices độc lập:
  - `auth_service`: Xác thực người dùng, JWT, RBAC.
  - `question_service`: Ngân hàng câu hỏi lưu trữ trên MongoDB.
  - `exam_service`: Quản lý kỳ thi, lượt thi, roster trên PostgreSQL.
  - `realtime_service`: Đồng bộ trạng thái thi qua WebSocket/Socket.IO.
  - `grading_service`: Chấm điểm tự động và Celery background worker.
  - `proctoring_service`: Ghi nhận sự kiện vi phạm và tính điểm rủi ro qua Redis.
- Cấu hình Nginx API Gateway định tuyến reverse proxy qua cổng 80/443.
- Xây dựng giao diện học sinh và bảng điều khiển quản trị bằng React + TypeScript + Material UI.
