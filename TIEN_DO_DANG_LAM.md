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

## ⏳ Vẫn còn thiếu / có thể mở rộng thêm (chưa làm, do giới hạn thời gian phiên này)
1. **Test thật qua Docker + trình duyệt thật** — mọi thứ mới kiểm tra biên dịch, chưa chạy với DB thật/trình duyệt thật end-to-end. Nhớ chạy `alembic upgrade head` ở `grading_service` (migration `d3456789012c`) và `auth_service` (migration `a7b8c9d0e1f2`). Muốn dùng object detection thì tải model theo `frontend/public/models/README.md`.
2. **Deepfake/face-swap detection thật sự** — hiện chỉ chặn được ở lớp "tên thiết bị camera đáng ngờ" (heuristic), chưa có model phân tích khung hình video để phát hiện deepfake thật — cần model chuyên biệt + dữ liệu huấn luyện, việc lớn, nên làm ở giai đoạn riêng nếu cần mức độ chống gian lận cao hơn.
3. **Livestream video cho giám thị xem trực tiếp** — hiện `ProctorDashboard` vẫn chỉ hiện text/vi phạm, chưa truyền được luồng video thời gian thực từ máy thí sinh sang máy giám thị (cần WebRTC peer connection, phức tạp hơn nhiều so với chỉ gửi sự kiện text qua Socket.IO đang có sẵn).
4. Hiển thị đáp án nối cột/chọn nhiều trong "Chi tiết từng câu" (`ResultSummary.tsx`) hiện đáp án thô dạng JSON string thay vì text đáp án dễ đọc.
5. Trang báo cáo/thống kê riêng cho giáo viên (hiện `/admin/reports` chỉ admin xem được).
6. Unit test cho các tính năng mới viết trong các phiên gần đây — chưa viết.
7. Bundle size cảnh báo (~2MB JS + ~26MB WASM dư thừa từ onnxruntime-web) — có thể code-split + loại bỏ bản WASM cục bộ không dùng tới để tải nhanh hơn, không phải lỗi chỉ là tối ưu.
8. Tinh chỉnh độ nhạy các ngưỡng AI Proctoring (góc quay đầu, tỉ lệ lệch mống mắt, ngưỡng tin cậy YOLO) theo dữ liệu sử dụng thật — các giá trị hiện tại là ước lượng hợp lý ban đầu, chưa được kiểm chứng với người dùng thật.

## Lưu ý khi tiếp tục
- Quy ước option id nối cột: `L_xxx`/`R_xxx` (trái/phải).
- Đáp án nối cột: `correct_answer` = `["L_1:R_2",...]`; đáp án học sinh nộp = JSON `[["L_1","R_2"],...]`.
- `/admin/exams`, `/admin/questions`, `/admin/manual-grading` dùng `StaffRoute` (admin+teacher); `/admin/users`, `/admin/dashboard`, `/admin/reports` vẫn `AdminRoute` (chỉ admin).
- Migration mới `d3456789012c_add_manual_grading.py` cần chạy trước khi dùng tính năng chấm tay tự luận.


