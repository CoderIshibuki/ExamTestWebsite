# Tiến độ đang làm — checkpoint 3 (đã rà toàn bộ tính năng)

## ✅ Mới hoàn thành trong checkpoint 3 (rà soát toàn diện theo yêu cầu "đọc toàn bộ chức năng chấm xem đủ chưa")

### Gap nghiêm trọng nhất được phát hiện & vá: đề thi tạo xong không thể thêm câu hỏi qua UI
- **`ManageExamDialog.tsx`** (component mới): dialog 2 tab —
  - Tab "Câu hỏi trong đề": xem danh sách câu hỏi hiện có, thêm thủ công từ ngân hàng, hoặc tự động chọn ngẫu nhiên theo môn/độ khó/loại/số lượng, xoá câu hỏi khỏi đề.
  - Tab "Giám thị coi thi": xem/gán/gỡ giáo viên coi thi cho đề — **đúng tính năng "teacher gác thi" bạn hỏi ban đầu, trước đó hoàn toàn không có UI nào**.
- Gắn nút "Quản lý" vào `AdminExams.tsx`, tự động mở dialog này ngay sau khi tạo đề mới (tránh quên thêm câu hỏi).
- Backend `assignments.py`/`crud.py`: bổ sung `GET`/`DELETE` cho proctor assignment (trước đây chỉ có `POST`, không xem/gỡ được).
- Backend `exams.py`: chặn publish đề thi chưa có câu hỏi (trước đây publish "trót lọt" ra đề rỗng, học sinh vào thi sẽ thấy trống trơn).

### Dữ liệu giả bị phát hiện & thay bằng dữ liệu thật
- **`AdminReports.tsx`**: xoá hoàn toàn mock data giả ("Math/Science/History"...) từng hiện ra khi API rỗng — giờ hiện đúng trạng thái rỗng thật.
- **Backend `/stats/reports`**: logic pass/fail trước đây dùng `status == 'GRADED'` làm tiêu chí — sai hoàn toàn bản chất (comment cũ ghi rõ "mock logic"). Sửa thành so sánh `results.percentage` thật với `passing_score` thật của từng đề (query chéo service qua DB dùng chung).
- **Backend `/stats/overview`**: trước đây `total_questions`/`total_users`/`total_results` hard-code 0 luôn, và field `chart` không tồn tại khiến biểu đồ "Tổng quan Hoạt động" ở AdminDashboard **luôn rỗng vĩnh viễn**. Đã sửa trả về số liệu thật (users/results qua SQL chung DB, questions qua HTTP question_service) + chart 14 ngày gần nhất khớp đúng `dataKey` frontend đang vẽ.

### Bug điểm số/điều hướng khác
- **`ResultSummary.tsx`**: `passed = percentage >= 50` **hard-code 50%** — sai với đề có `passing_score` khác 50%. Đã sửa lấy đúng `passing_score` thật của từng đề qua API. Thêm cảnh báo rõ ràng khi bài thi còn câu tự luận chờ chấm tay (điểm hiển thị là tạm tính).
- **`Dashboard.tsx`**: sửa nút "Xem kết quả học tập" thiếu `onClick`; ẩn 2 card chỉ dành cho student (Kết quả học tập, Kiểm tra Camera) khỏi admin/teacher — trước đây hiện cho mọi role nhưng bấm vào bị vỡ route.
- **`ExamList.tsx`**: nút "Vào thi" điều hướng sai với admin (route không tồn tại) → sửa luôn trỏ đúng `/student/exam/:id`.

## Đã kiểm tra lại (checkpoint 3)
- ✅ `python3 -m py_compile` — sạch **toàn bộ** file `.py` trong 6 backend service (không chỉ file đã sửa)
- ✅ `npx tsc --noEmit` — 0 lỗi
- ✅ `npm run build` — build production thành công

## ✅ Mới hoàn thành trong checkpoint 4: redesign giao diện theo tham chiếu thật

Người dùng gửi ảnh chụp thật 2 trang tham chiếu (oj.vnoi.info và online.hcmue.edu.vn/student/info), đã thiết kế lại theo đúng những gì thấy trong ảnh (không phải đoán/tưởng tượng):

- **`Home.tsx`** → phong cách VNOJ (VNOI Online Judge): navbar tối màu (#161819) + logo 4 ô màu, menu chữ hoa dãn cách, banner thông báo xám nhạt, layout 2 cột (feed đề thi dạng Newsfeed bên trái + sidebar "Kỳ thi nổi bật"/"Liên kết nhanh" dạng bảng bên phải, viền mảnh, link màu xanh #3d3d99).
- **`AdminLayout.tsx`** → phong cách cổng thông tin đào tạo HCMUE: header 2 tầng (dải trắng có logo + dải xanh navy #1B4870 đậm chứa tiêu đề hệ thống + chuông thông báo/avatar), sidebar trắng có card hồ sơ người dùng ở đầu + menu nhóm theo mục viết hoa xám nhạt (TRANG CÁ NHÂN, GIẢNG DẠY & THI CỬ), mục đang chọn có viền trái xanh + nền xanh nhạt, nội dung có tiêu đề breadcrumb dạng chevron tròn xanh + chữ đậm navy.
- Bỏ tiêu đề H4+icon trùng lặp ở 6 trang con Admin (`AdminDashboard`, `AdminExams`, `AdminUsers`, `AdminQuestions`, `ManualGrading`, `AdminReports`) vì `AdminLayout` đã tự hiện tiêu đề breadcrumb — giữ lại các nút hành động (Tạo đề thi mới, Thêm người dùng,...) căn phải.
- Thêm lại mục "Báo cáo & Thống kê" bị thiếu trong menu mới (route `/admin/reports` vẫn tồn tại nhưng suýt bị rớt khỏi menu khi viết lại).

### Đã kiểm tra lại
- ✅ `npx tsc --noEmit` — 0 lỗi (bắt được toàn bộ import thừa sau khi xoá header trùng)
- ✅ `npm run build` — build production thành công

## ✅ Mới hoàn thành trong checkpoint 5: dọn nốt các mục tồn đọng đã liệt kê

1. **Quản lý danh mục câu hỏi** — trang mới `AdminCategories.tsx` (CRUD danh mục), gắn dropdown chọn danh mục thật vào `ManualQuestionDialog.tsx` (trước đây field `category_id` có ở backend nhưng chưa được frontend dùng tới). Route `/admin/categories`, thêm vào menu `AdminLayout`.

2. **Lịch thi (exam schedule)** — phát hiện bug: backend có endpoint `POST /schedule` lưu lịch nhưng **`start_exam` không hề kiểm tra lại** → tính năng lịch thi trước đây hoàn toàn không có tác dụng (đặt lịch nhưng học sinh vẫn vào thi được bất cứ lúc nào). Đã sửa:
   - `start_exam`: kiểm tra khung giờ thật trước khi cho phép bắt đầu làm bài (nếu đề không đặt lịch nào thì vẫn mở tự do — không phá vỡ hành vi cũ).
   - Thêm `GET`/`DELETE` cho schedule (trước chỉ có `POST`).
   - Thêm tab "Lịch thi" thứ 3 vào `ManageExamDialog.tsx` (xem/thêm/xoá khung giờ mở đề).

3. **`question_results` không trung thực** — schema `ResultResponse` khai báo field này nhưng backend chưa từng trả về dữ liệu thật. Đã sửa: eager-load quan hệ `question_results` (tránh lỗi lazy-load trong async SQLAlchemy), trả về đủ dữ liệu ở cả `GET /result/{attempt_id}` và `POST /manual-grade/...`.

4. **Mở rộng `ResultSummary.tsx`** — tận dụng dữ liệu `question_results` giờ đã có thật: thêm phần "Chi tiết từng câu" (accordion, ghép với nội dung câu hỏi thật qua `getExamQuestions`), hiện rõ câu nào đúng/sai/đang chờ chấm tay + đáp án đã chọn.

5. **`/export` (xuất Excel ngân hàng câu hỏi)** — backend có sẵn nhưng chưa từng có UI. Đã thêm nút "Xuất Excel" vào `AdminQuestions.tsx` (tải file `.xlsx` trực tiếp). Đã kiểm tra `/import` (khác `/bulk`) — xác nhận đây là bản PoC đơn giản hơn, code tự ghi "Simplify for PoC", không cần wiring thêm vì `/bulk` (đang dùng) đã xử lý tốt hơn.

### Đã kiểm tra lại (checkpoint 5)
- ✅ `npx tsc --noEmit` — 0 lỗi
- ✅ `npm run build` — build production thành công
- ✅ `python3 -m py_compile` — sạch toàn bộ backend

## ✅ Mới hoàn thành trong checkpoint 6: 2 tính năng người dùng cơ bản còn thiếu

### 1. Chức năng "Quên mật khẩu"
- Backend `auth_service`: migration thêm cột `reset_token_hash`/`reset_token_expires_at` (lưu hash của token, không lưu token gốc — giống cách lưu mật khẩu); 2 endpoint mới `POST /auth/forgot-password` (luôn trả lời chung chung để tránh lộ email nào tồn tại — chống user enumeration) và `POST /auth/reset-password` (token hết hạn sau 30 phút, dùng 1 lần). Cả 2 đều có rate-limit theo đúng convention sẵn có trong file.
- Module mới `email_service.py`: gửi email qua SMTP (dự án trước đây **chưa từng có hạ tầng email nào**). Nếu chưa cấu hình biến môi trường `SMTP_HOST`, hệ thống chỉ log link ra console thay vì gửi thật — tiện cho dev/test không cần setup SMTP server.
- Frontend: 2 trang mới `ForgotPassword.tsx`, `ResetPassword.tsx`, route `/forgot-password` + `/reset-password`, thêm link "Quên mật khẩu?" vào `Login.tsx`.
- Thêm biến môi trường SMTP vào `.env.example` (đã tự động load qua `env_file: .env` có sẵn trong docker-compose, không cần sửa thêm).

### 2. Sửa Import Excel (trước đây không hoạt động với file Excel thường)
- Phát hiện: backend `/bulk` yêu cầu JSON lồng nhau đúng schema, nhưng frontend gửi thẳng bảng Excel phẳng không qua transform nào — chỉ hoạt động nếu ai đó tự gõ JSON vào ô Excel (không thực tế).
- Phát hiện thêm: `/export` cũ **thiếu hẳn cột đáp án (options)** — xuất ra không dùng lại được, không round-trip được với import.
- Đã sửa cả 2 phía cho khớp nhau:
  - Backend `/export`: xuất đủ cột `option_1..option_6` + `correct_answer` (ghi số thứ tự đáp án đúng, dễ đọc/sửa tay) thay vì tuồn nguyên cấu trúc JSON nội bộ ra.
  - Frontend: hàm mới `utils/excelQuestionTransform.ts` — chuyển bảng Excel phẳng sang đúng cấu trúc JSON backend yêu cầu, validate từng dòng (báo rõ dòng nào lỗi, vì sao), hỗ trợ multiple_choice/multiple_select/true_false (nối cột và tự luận vẫn cần tạo qua giao diện — quá phức tạp cho 1 dòng bảng tính).
  - Thêm dòng hướng dẫn ngay trong UI: "Bấm Xuất Excel trước để lấy đúng định dạng cột".

### Đã kiểm tra lại (checkpoint 6)
- ✅ `npx tsc --noEmit` — 0 lỗi
- ✅ `npm run build` — build production thành công
- ✅ `python3 -m py_compile` — sạch toàn bộ backend (11 file mới sửa + toàn bộ dự án)

## ✅ Mới hoàn thành trong checkpoint 7: AI Proctoring (thật, chạy được — không phải giả)

### Đã xây dựng
1. **`useFaceMonitor.ts`** — MediaPipe Face Landmarker (chạy hoàn toàn trong trình duyệt, model+WASM tự tải từ CDN chính thức của Google lúc chạy, không cần tự host). Phát hiện:
   - Không có mặt nào trong khung hình (rời màn hình/che camera)
   - Nhiều hơn 1 mặt (có người khác trong phòng)
   - Quay mặt khỏi màn hình (ước lượng góc yaw từ ma trận biến đổi khuôn mặt MediaPipe trả về)
   - Hướng nhìn lệch khỏi màn hình (ước lượng thô từ vị trí tâm mống mắt so với khoé mắt — MediaPipe FaceLandmarker có sẵn landmark mống mắt khi bật `refine_landmarks`)
   - Có cơ chế "sustained frames" (phải vi phạm liên tục nhiều khung hình mới báo, tránh báo giả do chớp mắt/rung khung hình 1 frame) + cooldown giữa các lần báo cùng loại.

2. **`useObjectDetection.ts`** — YOLOv8n (định dạng ONNX) chạy qua ONNX Runtime Web (WASM), phát hiện điện thoại/sách trong khung hình dựa trên 2 lớp có sẵn trong bộ COCO gốc (`cell phone` index 67, `book` index 73) — **không cần huấn luyện lại**. 
   - **Quyết định kỹ thuật quan trọng**: không hardcode URL model từ 1 repo GitHub cá nhân (dễ vỡ, không phù hợp hệ thống thi thật) — model tự host tại `frontend/public/models/yolov8n.onnx`, có `README.md` hướng dẫn tải bằng `pip install ultralytics` (chỉ 1 lần). Nếu chưa đặt file, hook tự nhận biết (HEAD-check trước) và tắt tính năng này êm, không phá vỡ trang thi — các tính năng giám sát khác vẫn chạy bình thường.

3. **`utils/cameraDeviceCheck.ts`** — phát hiện camera ảo (fake camera) bằng heuristic đối chiếu tên thiết bị với danh sách phần mềm phổ biến (OBS Virtual Camera, ManyCam, pyvirtualcam, Snap Camera, DroidCam,...). **Giới hạn được ghi rõ trong code**: đây chỉ là kiểm tra nhãn thiết bị, không phân tích nội dung hình ảnh — không phát hiện được deepfake/face-swap thời gian thực thật sự (như Deep-Live-Cam) nếu chạy qua camera ảo đặt tên giống thật; việc đó cần model phân tích khung hình (liveness/deepfake detection) chưa được xây trong dự án này.

4. **`useProctoring.ts`** viết lại thành hook tổng hợp: giữ nguyên logic tab-switch/window-blur cũ đang chạy tốt, thêm xin quyền camera (`getUserMedia`) + gộp cả 3 tính năng trên, tất cả gửi vi phạm qua cùng 1 API `proctoringApi.sendViolationEvent` đã có sẵn từ trước (không cần sửa backend proctoring_service). Map độ nghiêm trọng theo từng loại (VD: nhiều người/điện thoại/camera ảo = `critical`; quay mặt/tab switch = `medium`; lệch ánh mắt = `low` vì đây là ước lượng kém tin cậy nhất).

5. **`ExamRoom.tsx`**: thêm khung camera nhỏ nổi góc màn hình — **minh bạch cho thí sinh biết đang được giám sát** (không giấu), kèm trạng thái "Đang kết nối camera..."/"Đang giám sát", và banner lỗi rõ ràng nếu thí sinh từ chối quyền camera (không chặn thi, chỉ báo giám thị sẽ không xác minh được qua camera).

6. **Sửa 2 bug phát hiện khi rà lại giao diện giám thị**: `ViolationFeed.tsx` hiện thẳng mã kỹ thuật ("tab_switch") thay vì tiếng Việt dễ hiểu — đã thêm bảng nhãn; và **thiếu màu cho mức độ `critical`** (mức nghiêm trọng nhất vừa thêm) — trước đây sẽ hiện màu nhẹ nhất do rơi vào nhánh else, đã sửa cả `types/proctoring.ts` (thiếu `'critical'` trong type) và `ViolationFeed.tsx`.

### Giới hạn thành thật (đã nói trước với người dùng, nhắc lại ở đây)
- **Không phải eye-tracking cấp nghiên cứu**: ước lượng hướng nhìn chỉ dựa vào vị trí mống mắt tương đối trong 1 khung hình 2D, độ chính xác thấp hơn nhiều so với thiết bị eye-tracking chuyên dụng hoặc thư viện GazeTracking chuyên biệt — đây là lý do severity của loại này chỉ để `low`.
- **Không phát hiện được deepfake/face-swap thật sự** (loại tấn công như Deep-Live-Cam) — mới chỉ chặn được ở lớp "tên thiết bị camera đáng ngờ", một kẻ tấn công đổi tên thiết bị ảo sẽ né được. Deepfake detection thật cần model phân loại được huấn luyện riêng + tập dữ liệu, ngoài phạm vi có thể làm xong trong 1 phiên.
- **Object detection cần bước setup 1 lần** (tải model ONNX, xem `public/models/README.md`) — chưa làm bước này thì tính năng phát hiện điện thoại/sách sẽ tắt (an toàn, không lỗi).
- Đây là **lớp phòng thủ tự động đầu tiên**, nên luôn kết hợp với giám sát của con người (giám thị) qua `ProctorDashboard`, không nên tin tưởng tuyệt đối vào tự động hoá.

### Đã kiểm tra lại (checkpoint 7)
- ✅ `npx tsc --noEmit` — 0 lỗi
- ✅ `npm run build` — build production thành công (lưu ý: bundle có kèm 1 bản `onnxruntime` WASM cục bộ ~26MB dù đã cấu hình tải từ CDN — không phải lỗi chức năng, dư thừa dung lượng do cách Vite xử lý package `onnxruntime-web`, nằm trong hạng mục "tối ưu bundle size" đã ghi ở dưới)
- ✅ `python3 -m py_compile` — sạch toàn bộ backend (không cần sửa backend cho phần này — tận dụng API `proctoring_service` đã có sẵn)
- ⚠️ **Chưa test được trong trình duyệt thật** (môi trường này không có trình duyệt/webcam) — cần người dùng tự kiểm tra khi chạy thật, đặc biệt: quyền camera hoạt động đúng, model MediaPipe/ONNX tải được từ CDN (cần internet, không bị chặn bởi firewall công ty/trường), độ nhạy của các threshold (góc quay đầu 25°, tỉ lệ lệch mống mắt 0.35, ngưỡng tin cậy YOLO 0.5) có thể cần tinh chỉnh theo thực tế sử dụng.

### Package mới thêm vào `package.json`
- `@mediapipe/tasks-vision` — Face Landmarker
- `onnxruntime-web` — chạy model YOLO ONNX trong trình duyệt

## ✅ Checkpoint 8: merge các bug fix thật phát hiện khi chạy Docker thật

Bạn đã tự chạy được qua Docker và gửi lại bản đã sửa — đây là lần đầu tiên dự án được test thật (mục #1 trong danh sách "chưa làm" ở checkpoint trước). Đã rà từng file, xác nhận hợp lệ, và merge vào:

### Bug thật phát hiện khi chạy thật (không thể tìm ra chỉ bằng đọc code/biên dịch)
1. **`middleware/audit.py`**: `int(user_id)` sẽ crash vì `user_id` là UUID dạng string, không phải số nguyên.
2. **`nginx.conf`**: các route (`/exams`, `/questions`, `/categories`, `/grading`, `/proctoring`) chỉ khớp khi URL có dấu `/` cuối — trong khi code tự viết gọi **không nhất quán** (`adminApi.ts` gọi `/v1/exams` không có `/`, `examApi.ts` gọi `/v1/exams/` có `/`) → 404 thật khi thiếu dấu `/`. Đã thêm rewrite rule khớp cả 2 trường hợp.
3. **`crud.py` (exam_service) `delete_exam_question`**: lọc theo `models.ExamQuestion.id == UUID(question_id)` — nhưng `id` là khoá chính của bảng tham chiếu, còn `question_id` truyền vào là ID của câu hỏi bên `question_service` (không phải UUID hợp lệ) → xoá câu hỏi khỏi đề **không bao giờ hoạt động**. Đã sửa lọc đúng theo `exam_id` + `question_id`.
4. **`question_service/config.py`**: đọc biến môi trường sai tên (`MONGODB_URL` thay vì `MONGO_URI` — biến thật sự có trong `.env`/`docker-compose`) → luôn dùng giá trị mặc định không xác thực thay vì thông tin đăng nhập MongoDB thật.
5. **`realtime_service/main.py`**: thiếu hẳn CORS middleware → request từ frontend (khác origin) bị chặn.
6. **`routes/exams.py` (publish_exam)**: `exam.id` (UUID object) chưa stringify trước khi đưa vào JSON payload gửi snapshot; `display_order` có thể `None` gây lỗi.
7. **`question_service/crud.py` `serialize_doc`**: chỉ stringify `_id` chứ không đổi tên thành `id` → endpoint danh sách câu hỏi trả về `_id`, còn endpoint xem 1 câu hỏi (qua Pydantic model) trả `id` — **2 hình dạng dữ liệu khác nhau cho cùng loại object**, khiến `AdminQuestions.tsx`/`ManageExamDialog.tsx` phải vá phòng thủ `row.id || row._id` ở nhiều nơi. **Đã sửa tận gốc** tại `serialize_doc` thay vì để rải rác nhiều chỗ vá ở frontend.
8. **Tạo đề thi qua UI mặc định private (`is_public=False`)** → học sinh không tự vào thi được, phải chạy SQL tay (`update_public.py`) để vá từng đề. **Đã sửa tận gốc**: thêm field `is_public` vào `ExamBase`/`ExamUpdate` schema (trước đây thiếu hẳn, dù model DB đã có cột này), mặc định `True` — đề thi tạo qua UI giờ công khai ngay, không cần patch SQL tay nữa.
9. **`useProctorWebSocket.ts`**: fallback URL hardcode `http://localhost:8000` (chỉ đúng khi chạy đúng máy/cổng đó) → đổi sang `window.location.origin` (khớp domain thật đang chạy, giống cách các API khác trong app đã làm).

### Đã thêm (helper scripts từ bạn, giữ nguyên)
- `create_admin.py` (auth_service) — script seed tài khoản admin đầu tiên, idempotent (không tạo trùng nếu đã có), đã gắn vào `docker-compose.yml` chạy tự động lúc khởi động.
- `update_public.py` — không còn cần thiết nữa sau khi sửa gốc #8 ở trên, nhưng vẫn giữ lại trong repo phòng khi cần patch dữ liệu cũ đã tạo từ trước lúc chưa sửa.

### ⚠️ Cần bạn tự sửa (không nằm trong phạm vi code, là file `.env` cá nhân của bạn)
File `.env` thật bạn đang dùng có `MONGODB_URL=mongodb://mongo:mongo@mongodb:27017` — cần đổi tên biến thành `MONGO_URI` (giữ nguyên giá trị) để khớp với code đã sửa ở mục #4, nếu không MongoDB sẽ kết nối bằng thông tin mặc định (không xác thực) thay vì tài khoản `mongo:mongo` bạn đã đặt.

### Đã kiểm tra lại (checkpoint 8)
- ✅ `python3 -m py_compile` — sạch toàn bộ backend
- ✅ `npx tsc --noEmit` — 0 lỗi
- ✅ `npm run build` — build production thành công

## ✅ Checkpoint 9: hoàn tất toàn bộ tính năng còn thiếu (livestream, báo cáo giáo viên, đáp án dễ đọc)

### 1. Livestream video thật cho giám thị (WebRTC)
- **Backend `realtime_service`**: thêm signaling WebRTC (`webrtc_request_stream`, `webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`) — server chỉ **relay** tín hiệu bắt tay giữa 2 sid cụ thể, không xử lý/lưu video; luồng video truyền thẳng peer-to-peer giữa trình duyệt học sinh và giám thị sau khi kết nối xong. Lưu mapping `user_id → sid` vào Redis lúc học sinh join phòng thi để giám thị tìm đúng người.
- **Phát hiện & sửa lỗ hổng bảo mật khi thêm tính năng này**: `join_proctor_room` **trước đây không hề kiểm tra role** — bất kỳ tài khoản nào (kể cả học sinh) gọi được, sẽ nghe/xem lén video của học sinh khác một khi có WebRTC. Đã thêm check role admin/teacher.
- **Phát hiện thêm bug nghiêm trọng khi rà lại**: `useProctorWebSocket.ts` (hook giám thị) **thiếu token xác thực + sai path** (`/ws` thay vì `/ws/socket.io`) → **toàn bộ ProctorDashboard trước giờ chưa từng kết nối realtime thành công**, mọi cảnh báo vi phạm thời gian thực chưa từng tới được giám thị. Đã sửa khớp đúng với cấu hình phía học sinh (`useWebSocket.ts`).
- Frontend: `useProctorStreamViewer` (phía giám thị, trong `useProctorWebSocket.ts`) và `useProctorStreamBroadcaster.ts` (phía học sinh, tận dụng camera đã xin quyền sẵn từ `useProctoring`). `StudentCard.tsx` thêm nút "Xem trực tiếp"/"Dừng xem" + khung video.

### 2. Sửa bug tên học sinh hiện sai trong ProctorDashboard
- `useProctoringData.ts` tạo field `name:` nhưng `StudentCard.tsx` đọc `full_name`/`username` — **không khớp nhau**, tên hiển thị luôn rơi về `user_id` thô, dòng code sinh tên giả "Student xxxx" chưa từng thực sự hiện ra. Đã sửa tận gốc: lấy **tên thật** qua `adminApi.getUsers()`, không dùng placeholder giả nữa.

### 3. Đáp án dễ đọc trong "Chi tiết từng câu" (`ResultSummary.tsx`)
- Trước đây hiện thẳng chuỗi thô (`["opt_1","opt_3"]`, `[["L_1","R_2"]]`) cho câu chọn-nhiều/nối cột. Đã thêm hàm `formatUserAnswer` tra cứu lại text thật của từng đáp án; câu tự luận chụp ảnh giờ hiện đúng ảnh thay vì in chuỗi base64 dài.

### 4. Báo cáo & thống kê riêng cho giáo viên
- Backend `/stats/reports`: lọc theo `owner_id` nếu người gọi là `teacher` (admin vẫn xem toàn hệ thống) — trước đây route này trả về **tất cả đề thi trong hệ thống bất kể ai gọi**.
- Frontend: đổi route `/admin/reports` từ `AdminRoute` sang `StaffRoute` (giáo viên vào được), thêm mục "Báo cáo & Thống kê" vào menu cho teacher, thêm dòng chú thích rõ phạm vi dữ liệu đang xem ("Chỉ hiện đề thi do bạn tạo" / "Toàn bộ hệ thống").

### Đã kiểm tra lại (checkpoint 9)
- ✅ `npx tsc --noEmit` — 0 lỗi
- ✅ `npm run build` — build production thành công
- ✅ `python3 -m py_compile` — sạch toàn bộ backend
- ⚠️ Livestream WebRTC **chưa test được qua trình duyệt thật** (môi trường này không có 2 trình duyệt/webcam để test peer-to-peer) — logic đã viết đúng theo chuẩn WebRTC signaling, nhưng cần bạn tự xác nhận khi chạy thật, đặc biệt: STUN server công cộng (`stun:stun.l.google.com:19302`) có đủ cho mạng LAN trường học hay cần thêm TURN server (nếu 2 máy ở sau NAT/firewall nghiêm ngặt, peer-to-peer thuần STUN có thể không kết nối được — cần TURN server riêng, ngoài phạm vi đã làm).

## 🔜 Bước tiếp theo theo yêu cầu: quét lỗi toàn bộ dự án
Đã hoàn tất toàn bộ tính năng liệt kê. Bước tiếp theo là rà lỗi toàn diện lần cuối trên cả dự án (không chỉ phần mới thêm) — ưu tiên các lớp lỗi tương tự những gì đã tìm thấy qua Docker thật (nginx trailing-slash, `_id`/`id` không nhất quán, biến môi trường sai tên, thiếu CORS, mismatch field name giữa hook và component,...).

## ✅ Checkpoint 10: quét lỗi toàn bộ dự án (đợt 1) — phát hiện nhiều lỗ hổng bảo mật nghiêm trọng

Đã rà theo đúng các lớp lỗi từng gặp qua Docker thật (route thiếu xác thực, path/token không khớp, thiếu migration lúc deploy). Đây là kết quả:

### 🔴 Lỗ hổng bảo mật nghiêm trọng nhất tìm được trong toàn bộ dự án
**`GET /api/v1/questions` và `GET /api/v1/questions/{id}` (question_service) hoàn toàn KHÔNG yêu cầu đăng nhập** — bất kỳ ai, không cần tài khoản, gọi thẳng API là xem được **toàn bộ ngân hàng câu hỏi kèm đáp án đúng** (`correct_answer`, `options[].is_correct`), phá vỡ hoàn toàn tính bảo mật của kỳ thi. Đã sửa: bắt buộc quyền `question:read` (chỉ admin/teacher).
- Sửa này kéo theo phải sửa tiếp: `exam_service` từng "giả danh" học sinh (tự ký JWT với `sub=student_id`) để gọi sang lấy nội dung câu hỏi lúc thi — sau khi vá lỗ hổng trên, học sinh (không có quyền `question:read`) sẽ bị 403. Đã thêm dependency `require_internal_or_permission` (chấp nhận cả internal token cho cuộc gọi service-to-service HOẶC quyền user thật cho admin/teacher browse UI), và sửa `exam_service` dùng đúng `X-Internal-Token` thay vì giả danh user (sửa luôn 2 chỗ dùng pattern sai này: enrich câu hỏi lúc thi + publish đề thi).

### 🔴 Lỗ hổng bảo mật khác
- **`join_proctor_room` (realtime_service) không kiểm tra role** — bất kỳ tài khoản nào (kể cả học sinh) gọi được, sẽ nghe/xem lén video học sinh khác khi có WebRTC livestream.
- **`POST /api/v1/realtime/alert` không xác thực** — ai cũng gọi được để phát cảnh báo giả vào dashboard giám thị (spam/đánh lạc hướng). Đã thêm internal-token check.
- **`GET /api/v1/realtime/exams/{exam_id}/students` không xác thực** — ai cũng xem được học sinh nào đang thi đề nào (rò rỉ thông tin). Đã thêm bắt buộc JWT + role admin/teacher.
- **`GET /exams/{id}/questions` không kiểm soát quyền truy cập** — học sinh có thể gọi thẳng API xem nội dung câu hỏi của đề `draft` (chưa công bố) hoặc đề riêng tư (`is_public=False`) mà họ không có trong roster. Đã thêm check trạng thái + roster (chỉ áp dụng cho role student; admin/teacher vẫn xem được mọi lúc — cần thiết cho màn quản lý đề thi).

### 🔴 Lỗi khiến tính năng vừa xây (livestream/role-check) tự động gãy nếu không phát hiện kịp
**JWT do `auth_service` phát ra không hề có claim `role`** — khiến `realtime_service.validate_token()` (đọc `payload.get("role")`) luôn nhận `None`. Nếu không phát hiện, check role mình vừa thêm cho `join_proctor_room` sẽ **chặn nhầm cả admin/teacher thật** (None không nằm trong danh sách cho phép). Đã sửa tận gốc: nhúng `role` vào JWT lúc login/refresh (đánh đổi: vai trò đổi giữa lúc đang đăng nhập sẽ cần đợi token hết hạn/refresh mới cập nhật — chấp nhận được vì token sống ngắn, mặc định 30 phút).

### 🔴 Bug triển khai (deployment-breaking)
**`docker-compose.yml` trước đây chỉ `auth_service` tự chạy `alembic upgrade head` khi khởi động** — `exam_service` và `grading_service` (có migration thật, gồm cả migration chấm tay tự luận mới thêm) hoàn toàn không có bước này. Deploy mới sẽ lỗi SQL "column/relation does not exist" ngay khi có người dùng đầu tiên. Đã sửa: thêm `alembic upgrade head` vào command của cả 2 service, và thêm `celery_worker` phụ thuộc `grading_service: condition: service_healthy` (tránh race condition đọc bảng chưa migrate khi 2 container cùng khởi động).

### 🟡 Lỗi khác
- `nginx.conf` thiếu hẳn location cho `/api/v1/results` (router `grading_service/routes/results.py` viết đầy đủ logic từ trước nhưng không gọi được qua gateway — luôn 404). Đã thêm route.
- `AuthContext.tsx`: `User.id` khai báo type `number` nhưng thực tế toàn hệ thống dùng UUID string — sửa lại đúng type.

### Đã kiểm tra lại (checkpoint 10)
- ✅ `python3 -m py_compile` — sạch toàn bộ backend
- ✅ `npx tsc --noEmit` — 0 lỗi
- ✅ `npm run build` — build production thành công
- ✅ Đối chiếu tay toàn bộ endpoint frontend gọi với route nginx + prefix router backend — khớp nhau
- ✅ Đối chiếu toàn bộ `require_permission(...)` string được dùng với `ROLE_PERMISSIONS` khai báo ở từng service — không có lỗi chính tả/thiếu quyền
- ✅ Kiểm tra chuỗi migration (`down_revision`) từng service — liền mạch, không xung đột
- ⚠️ **Chưa quét xong toàn bộ** — đây là 1 dự án lớn, đợt quét này tập trung vào các lớp lỗi có xác suất cao nhất (auth/permission, routing, migration) dựa trên pattern lỗi đã gặp qua Docker thật. Nên coi đây là "đợt 1", có thể còn sót lỗi ở các phần chưa rà kỹ (VD: logic nghiệp vụ chi tiết trong từng CRUD, edge case validate dữ liệu đầu vào).

## ✅ Checkpoint 11: quét lỗi toàn bộ dự án (đợt 2) — logic nghiệp vụ, race condition, UX lỗi bị nuốt

### Race condition thật
- **`start_exam` (exam_service)**: kiểm tra `attempt_count >= max_attempts` rồi mới tạo attempt — 2 request song song (double-click "Vào thi" hoặc mở 2 tab) đều có thể pass check trước khi request nào commit, **bỏ qua được giới hạn số lần thi**. Đã sửa bằng `pg_advisory_xact_lock` khoá theo `(exam_id, user_id)` trong suốt transaction.
  - Khi viết fix này phát hiện luôn: dùng `hash()` của Python để tính lock key **không an toàn** (bị random hoá theo từng process/worker, PYTHONHASHSEED) — cùng 1 khoá có thể ra giá trị khác nhau giữa các worker uvicorn, làm khoá vô nghĩa. Đã sửa dùng `hashtext()` của chính Postgres (deterministic thật).
- **`upsert_exam_attempt_answer`**: ném `Exception` Python thuần thay vì `HTTPException` khi race condition hiếm gặp xảy ra (lưu đáp án đúng lúc hết giờ) → học sinh nhận lỗi 500 khó hiểu. Đã bắt và chuyển thành lỗi 400 rõ ràng.

### Bug dữ liệu/logic
- **Thứ tự câu hỏi sai khi thêm thủ công**: câu hỏi thêm qua "Thêm câu hỏi thủ công" trong `ManageExamDialog` không set `question_order` → mặc định `None` → bị coi như `0` khi sắp xếp → luôn nhảy lên đầu danh sách bất kể thêm lúc nào. Đã sửa tự tính thứ tự kế tiếp nếu không truyền vào.
- **Giới hạn `limit` quá thấp khi tự động sinh đề**: `exam_generator.py` fetch tối đa 100 câu từ ngân hàng rồi mới lọc theo loại câu hỏi ở client — với ngân hàng câu hỏi lớn, có thể báo sai "không đủ câu hỏi" dù thực tế đủ (chỉ là nằm ngoài 100 câu đầu). Đã tăng giới hạn lên 500 (cả 2 phía exam_service và question_service phải khớp nhau, question_service trước đó giới hạn cứng `le=100` sẽ từ chối request nếu chỉ sửa 1 phía).

### Lỗ hổng nhỏ: admin tự khoá chính mình
Trước đây admin có thể tự xoá hoặc tự hạ quyền chính tài khoản đang đăng nhập qua `AdminUsers.tsx` — nếu hệ thống chỉ có 1 admin, thao tác nhầm sẽ tự khoá luôn quyền truy cập quản trị. Đã thêm chặn ở backend (`PUT`/`DELETE /users/{id}`): không cho tự xoá, không cho tự hạ quyền khỏi admin, không cho tự vô hiệu hoá chính mình.

### Lỗi UX bị nuốt mất — sửa hàng loạt (11 chỗ)
Rà toàn bộ `catch (err)` trong frontend, phát hiện rất nhiều nơi chỉ hiện message chung chung ("Xoá thất bại.") thay vì lý do thật từ backend (VD: "Không thể tự xoá chính tài khoản đang đăng nhập", "Điểm chấm không được vượt quá điểm tối đa"). Đã sửa đồng loạt ở: `AdminUsers.tsx` (2 chỗ), `AdminExams.tsx` (2 chỗ), `AdminQuestions.tsx` (2 chỗ), `AdminCategories.tsx` (2 chỗ), `ManualQuestionDialog.tsx`, `ManualGrading.tsx`.

**Đáng chú ý nhất**: `ExamRoom.tsx`'s `handleAnswerSelect` — lỗi lưu đáp án trước đây **chỉ log console, học sinh hoàn toàn không biết đáp án của mình chưa được lưu vào server** (VD do mất mạng tạm thời hoặc bài thi hết giờ giữa chừng) — rủi ro mất đáp án oan mà không có cảnh báo gì. Đã thêm Snackbar cảnh báo rõ ràng ngay khi lưu đáp án thất bại.

### Đã kiểm tra lại (checkpoint 11)
- ✅ `python3 -m py_compile` — sạch toàn bộ backend
- ✅ `npx tsc --noEmit` — 0 lỗi
- ✅ `npm run build` — build production thành công

## ⏳ Vẫn còn thiếu / có thể mở rộng thêm (chưa làm, do giới hạn thời gian phiên này)
1. **Test thật qua Docker + trình duyệt thật** — đặc biệt livestream WebRTC (cần 2 thiết bị thật để test peer-to-peer), có thể cần TURN server nếu mạng có NAT/firewall nghiêm ngặt.
2. **Deepfake/face-swap detection thật sự** — hiện chỉ chặn được ở lớp "tên thiết bị camera đáng ngờ" (heuristic), chưa có model phân tích khung hình video để phát hiện deepfake thật — cần model chuyên biệt + dữ liệu huấn luyện, việc lớn, nên làm ở giai đoạn riêng nếu cần mức độ chống gian lận cao hơn.
3. Unit test cho các tính năng mới viết trong các phiên gần đây — chưa viết.
4. Bundle size cảnh báo (~2.6MB JS + ~26MB WASM dư thừa từ onnxruntime-web) — có thể code-split + loại bỏ bản WASM cục bộ không dùng tới để tải nhanh hơn, không phải lỗi chỉ là tối ưu.
5. Tinh chỉnh độ nhạy các ngưỡng AI Proctoring (góc quay đầu, tỉ lệ lệch mống mắt, ngưỡng tin cậy YOLO) theo dữ liệu sử dụng thật.

## Lưu ý khi tiếp tục
- Quy ước option id nối cột: `L_xxx`/`R_xxx` (trái/phải).
- Đáp án nối cột: `correct_answer` = `["L_1:R_2",...]`; đáp án học sinh nộp = JSON `[["L_1","R_2"],...]`.
- `/admin/exams`, `/admin/questions`, `/admin/manual-grading` dùng `StaffRoute` (admin+teacher); `/admin/users`, `/admin/dashboard`, `/admin/reports` vẫn `AdminRoute` (chỉ admin).
- Migration mới `d3456789012c_add_manual_grading.py` cần chạy trước khi dùng tính năng chấm tay tự luận.


