# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG KHẢO THÍ & GIÁM THỊ TRỰC TUYẾN AI
> **ExamSystem** — Nền tảng tổ chức thi trực tuyến, chấm điểm tự động và giám sát thời gian thực bằng Trí tuệ Nhân tạo.

---

## 📌 MỤC LỤC

1. [Tổng quan & Phân quyền Người dùng](#1-tổng-quan--phân-quyền-người-dùng)
2. [Tài khoản & Đăng nhập](#2-tài-khoản--đăng-nhập)
3. [Hướng dẫn dành cho Thí sinh (Học sinh / Student)](#3-hướng-dẫn-dành-cho-thí-sinh-học-sinh--student)
   - [3.1. Kiểm tra Thiết bị & Camera AI](#31-kiểm-tra-thiết-bị--camera-ai)
   - [3.2. Tìm kiếm & Vào thi](#32-tìm-kiếm--vào-thi)
   - [3.3. Thao tác trong Phòng thi (Zen Focus Mode)](#33-thao-tác-trong-phòng-thi-zen-focus-mode)
   - [3.4. Cách làm từng dạng câu hỏi](#34-cách-làm-từng-dạng-câu-hỏi)
   - [3.5. Nộp bài & Xem kết quả chi tiết](#35-nộp-bài--xem-kết-quả-chi-tiết)
4. [Hướng dẫn dành cho Giáo viên (Teacher)](#4-hướng-dẫn-dành-cho-giáo-viên-teacher)
   - [4.1. Quản lý Danh mục Môn học](#41-quản-lý-danh-mục-môn-học)
   - [4.2. Xây dựng Ngân hàng Câu hỏi](#42-xây-dựng-ngân-hàng-câu-hỏi)
   - [4.3. Tạo & Xuất bản Đề thi](#43-tạo--xuất-bản-đề-thi)
   - [4.4. Chấm điểm Bài thi Tự luận (Manual Grading)](#44-chấm-điểm-bài-thi-tự-luận-manual-grading)
   - [4.5. Giám sát Phòng thi Trực tiếp (Live Proctoring)](#45-giám-sát-phòng-thi-trực-tiếp-live-proctoring)
5. [Hướng dẫn dành cho Quản trị viên (Admin)](#5-hướng-dẫn-dành-cho-quản-trị-viên-admin)
   - [5.1. Dashboard Thống kê Tổng quan](#51-dashboard-thống-kê-tổng-quan)
   - [5.2. Quản lý Người dùng & Phân quyền](#52-quản-lý-người-dùng--phân-quyền)
   - [5.3. Báo cáo & Thống kê Toàn hệ thống](#53-báo-cáo--thống-kê-toàn-hệ-thống)
6. [Cơ chế Giám sát AI & Chống Gian Lận](#6-cơ-chế-giám-sát-ai--chống-gian-lận)
7. [Khắc phục Sự cố Thường gặp (FAQ)](#7-khắc-phục-sự-cố-thường-gặp-faq)

---

## 1. Tổng quan & Phân quyền Người dùng

Hệ thống phân cấp 3 vai trò người dùng chính:

| Vai trò | Quyền hạn chính |
| :--- | :--- |
| **Học sinh (Student)** | • Xem danh sách đề thi được mở.<br>• Kiểm tra camera trước khi thi.<br>• Làm bài thi có giám sát AI.<br>• Xem điểm số, tỷ lệ đúng/sai và lời giải chi tiết.<br>• Xem lịch sử thi và biểu đồ kết quả cá nhân. |
| **Giáo viên (Teacher)** | • Quản lý danh mục & môn học.<br>• Tạo và quản lý ngân hàng câu hỏi đa dạng thể loại.<br>• Tạo đề thi, đặt thời gian làm bài, cấu hình ngưỡng đạt và xuất bản (Publish).<br>• Giám sát trực tiếp thí sinh qua webcam trong phòng thi.<br>• Chấm điểm các câu hỏi tự luận của thí sinh. |
| **Quản trị viên (Admin)** | • Toàn quyền của Giáo viên.<br>• Quản lý danh sách tài khoản: kích hoạt, khoá, thay đổi phân quyền (Student / Teacher / Admin).<br>• Xem biểu đồ báo cáo toàn trường/tổ chức, thống kê tỷ lệ hoàn thành, điểm trung bình. |

---

## 2. Tài khoản & Đăng nhập

### 2.1. Đăng nhập
1. Truy cập trang chủ hệ thống tại `http://localhost/` hoặc domain triển khai.
2. Nhấn nút **Đăng nhập** ở góc trên bên phải.
3. Nhập **Tên đăng nhập (hoặc Email)** và **Mật khẩu**.
4. Hệ thống sẽ tự động chuyển hướng về trang tương ứng với vai trò của bạn (Dashboard Học sinh, Portal Giảng dạy hoặc Admin Center).

### 2.2. Đổi mật khẩu & Cập nhật thông tin
1. Nhấp vào tên tài khoản hoặc chọn **Trang cá nhân**.
2. Nhấn nút **Đổi mật khẩu**.
3. Nhập mật khẩu hiện tại và mật khẩu mới (tối thiểu 6 ký tự).

---

## 3. Hướng dẫn dành cho Thí sinh (Học sinh / Student)

### 3.1. Kiểm tra Thiết bị & Camera AI
Trước khi vào phòng thi chính thức, thí sinh nên kiểm tra thiết bị:
1. Từ **Dashboard Học sinh**, nhấn thẻ **Kiểm tra Camera & Giám sát AI** (hoặc truy cập `/student/camera-test`).
2. Khi trình duyệt hỏi, nhấn **Cho phép (Allow)** truy cập Webcam.
3. Thử nghiệm:
   - Ngồi ngay ngắn trước màn hình: Hệ thống nhận diện trạng thái *An toàn (Bình thường)*.
   - Quay đầu sang trái/phải hoặc rời màn hình: Hệ thống sẽ hiển thị cảnh báo vi phạm mô phỏng.

### 3.2. Tìm kiếm & Vào thi
1. Truy cập mục **Kỳ thi của tôi** hoặc **Danh sách đề thi**.
2. Tìm kiếm đề thi theo tên môn hoặc mã đề.
3. Đọc kỹ thông tin đề thi:
   - **Thời gian làm bài:** (Ví dụ: 45 phút).
   - **Ngưỡng điểm đạt:** (Ví dụ: 60%).
   - **Số câu hỏi**.
4. Nhấn nút **Vào làm bài**.

### 3.3. Thao tác trong Phòng thi (Zen Focus Mode)
Giao diện phòng thi được thiết kế tối giản, loại bỏ mọi chi tiết thừa để thí sinh tập trung cao độ:
- **Đồng hồ đếm ngược (Top Bar):** 
  - Màu xanh lá: Thời gian an toàn.
  - Màu vàng (nhấp nháy): Còn dưới 5 phút.
  - Màu đỏ (cảnh báo gấp): Còn dưới 1 phút.
- **Thanh tiến độ câu hỏi (Mục lục câu hỏi bên phải):**
  - **Màu xanh dương:** Câu đang mở xem.
  - **Màu xanh lá:** Câu đã chọn câu trả lời.
  - **Màu xám:** Câu chưa làm.
  - Nhấp trực tiếp vào bất kỳ số câu nào để chuyển nhanh đến câu đó.
- **Khung Camera giám sát (Góc dưới bên phải):**
  - Hiển thị góc nhìn webcam của bạn để đảm bảo khuôn mặt luôn nằm trong khung hình.

### 3.4. Cách làm từng dạng câu hỏi
- **Trắc nghiệm 1 đáp án (Single Choice):** Nhấp chọn vào 1 trong các ô lựa chọn A, B, C, D. Ô được chọn sẽ viền xanh dương nổi bật.
- **Trắc nghiệm nhiều đáp án (Multiple Select):** Đánh dấu vào tất cả các ô vuông mà bạn cho là đúng.
- **Đúng / Sai (True / False):** Chọn ô "Đúng" hoặc "Sai".
- **Nối cột (Matching):** Với mỗi ý ở cột bên trái, chọn ý tương ứng từ danh sách thả xuống ở cột bên phải.
- **Tự luận (Essay):**
  - **Cách 1 - Gõ văn bản:** Nhập câu trả lời trực tiếp vào khung soạn thảo.
  - **Cách 2 - Chụp ảnh bài làm tay:** Nhấn nút **Chụp / tải ảnh bài làm tay** để chụp trực tiếp từ camera hoặc tải ảnh giấy thi lên. Hệ thống tự động tối ưu hóa dung lượng ảnh.

### 3.5. Nộp bài & Xem kết quả chi tiết
1. Khi hoàn thành bài làm hoặc sắp hết giờ, nhấn nút **Nộp bài thi** màu xanh ở góc trên.
2. Hộp thoại xác nhận xuất hiện, nhấn **Đồng ý nộp bài**.
3. **Màn hình Tổng kết Kết quả (Bento Grid):**
   - Xem ngay Điểm số tổng và Tỷ lệ chính xác (%) đạt được.
   - Thẻ thống kê số câu đúng (màu xanh lá) và số câu sai (màu đỏ).
   - Xem chi tiết từng câu: nhấp vào từng câu hỏi để xem đáp án bạn đã chọn và lời giải/đáp án chuẩn.
   - *(Lưu ý: Nếu đề thi có câu tự luận, điểm số sẽ là điểm tạm tính cho các câu trắc nghiệm cho đến khi giáo viên chấm xong phần tự luận).*

---

## 4. Hướng dẫn dành cho Giáo viên (Teacher)

### 4.1. Quản lý Danh mục Môn học
1. Vào menu **Quản trị & Giảng dạy** → **Danh mục môn học**.
2. Nhấn **Thêm danh mục mới**, nhập tên môn (Toán học, Vật lý, Tiếng Anh...) và mô tả.
3. Danh mục giúp phân loại câu hỏi và đề thi khoa học, dễ tìm kiếm.

### 4.2. Xây dựng Ngân hàng Câu hỏi
1. Vào mục **Ngân hàng câu hỏi**.
2. Nhấn **Tạo câu hỏi mới**:
   - Chọn **Môn học/Danh mục**.
   - Chọn **Loại câu hỏi**: Trắc nghiệm đơn, Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Nối cột, hoặc Tự luận.
   - Chọn **Mức độ khó**: Dễ, Trung bình, Khó.
   - Nhập nội dung câu hỏi và các lựa chọn đáp án.
   - Đánh dấu đáp án đúng.
   - Nhập **Lời giải thích chi tiết** (để học sinh xem sau khi thi xong).
3. Nhấn **Lưu câu hỏi**.

### 4.3. Tạo & Xuất bản Đề thi
1. Vào mục **Quản lý Đề thi** → Nhấn **Tạo đề thi mới**.
2. Điền thông tin cấu hình:
   - **Tên kỳ thi / Mã đề**.
   - **Thời lượng làm bài** (ví dụ: 60 phút).
   - **Ngưỡng điểm đạt** (Passing Score, ví dụ: 50% hoặc 70%).
   - **Số lượt thi tối đa** cho phép mỗi học sinh.
3. **Chọn câu hỏi vào đề:** Tích chọn các câu hỏi từ Ngân hàng câu hỏi hoặc chọn ngẫu nhiên theo danh mục.
4. **Trạng thái:**
   - Chọn **Bản nháp (Draft)** nếu đang biên soạn.
   - Chọn **Đã xuất bản (Published)** để học sinh bắt đầu thấy và có thể vào thi.

### 4.4. Chấm điểm Bài thi Tự luận (Manual Grading)
1. Vào mục **Chấm thi tự luận**.
2. Hệ thống hiển thị danh sách các bài làm có câu tự luận cần chấm.
3. Nhấn vào bài làm của học sinh:
   - Xem đề bài, đáp án mẫu của giáo viên.
   - Xem bài làm của học sinh (đoạn văn bản gõ hoặc ảnh chụp bài làm tay).
   - Nhập điểm số cho câu tự luận và nhận xét/góp ý.
4. Nhấn **Lưu điểm chấm**. Điểm tổng kết của học sinh sẽ tự động được cập nhật lại ngay lập tức.

### 4.5. Giám sát Phòng thi Trực tiếp (Live Proctoring Center)
1. Vào mục **Giám sát thi** → Chọn kỳ thi đang diễn ra.
2. Màn hình HUD Giám thị thời gian thực:
   - **Lưới Webcam Thí sinh:** Xem video trực tiếp camera của từng học sinh đang trong phòng thi.
   - **Thông tin nhận diện rõ ràng:** Mỗi thẻ hiển thị đầy đủ **Họ và tên thí sinh**, **@username** và **Địa chỉ IP máy thí sinh**.
   - **Viền cảnh báo rủi ro:**
     - 🟢 **Xanh lá:** Trạng thái bình thường, không có dấu hiệu gian lận.
     - 🟡 **Vàng:** Cảnh báo nhẹ (quay mặt khỏi màn hình 1-2 lần).
     - 🔴 **Đỏ:** Cảnh báo nghiêm trọng (rời khỏi màn hình nhiều lần, đổi tab trình duyệt liên tục).
   - **Violation Feed:** Cột nhật ký bên phải hiển thị dòng thời gian vi phạm chính xác từng giây: Thí sinh nào, lúc mấy giờ, vi phạm hành vi gì (VD: `Quay mặt khỏi màn hình (Góc lệch > 25°)`).

---

## 5. Hướng dẫn dành cho Quản trị viên (Admin)

### 5.1. Dashboard Thống kê Tổng quan
- Xem nhanh 4 chỉ số KPI quan trọng: Tổng số đề thi, Tổng số câu hỏi trong ngân hàng, Tổng lượt nộp bài, Tỷ lệ đạt trung bình toàn hệ thống.
- Biểu đồ phân bố điểm số và hoạt động thi theo thời gian thực.

### 5.2. Quản lý Người dùng & Phân quyền
1. Vào mục **Quản lý người dùng**.
2. Danh sách toàn bộ tài khoản trong hệ thống với bộ lọc theo vai trò (Admin, Teacher, Student).
3. Các thao tác quản trị:
   - **Đổi vai trò:** Nâng cấp học sinh lên giáo viên hoặc cấp quyền admin.
   - **Khoá / Mở khoá tài khoản:** Tạm ngừng quyền truy cập nếu phát hiện vi phạm quy chế.
   - **Tạo tài khoản mới:** Tạo nhanh tài khoản giáo viên hoặc quản trị viên.

### 5.3. Báo cáo & Thống kê Toàn hệ thống
1. Vào mục **Báo cáo & Thống kê**.
2. Thống kê chi tiết theo từng kỳ thi:
   - Số lượng thí sinh tham gia.
   - Điểm cao nhất, điểm thấp nhất, điểm trung bình.
   - Tỷ lệ vượt qua kỳ thi.
3. Xuất file báo cáo tổng hợp.

---

## 6. Cơ chế Giám sát AI & Chống Gian Lận

Hệ thống tích hợp công nghệ AI Edge Computing kết hợp WebRTC & WebSocket:

```
+--------------------------------------------------------------------+
|                       TRÌNH DUYỆT THÍ SINH                        |
|                                                                    |
|  +---------------------+        +-------------------------------+  |
|  |  Camera WebRTC      |        |  Face Mesh & Gaze Detection   |  |
|  |  Truyền video live  |        |  AI xử lý trực tiếp tại máy   |  |
|  +----------+----------+        +---------------+---------------+  |
|             |                                   |                  |
+-------------|-----------------------------------|------------------+
              | Video Stream                      | Violation Events
              v                                   v
+-------------+----------+        +---------------+---------------+
|  Kênh Giám thị Live    |        |  Realtime WebSocket Gateway   |
|  Giáo viên xem webcam  |        |  Nhận diện & Ghi nhận vi phạm |
+------------------------+        +-------------------------------+
```

### Các hành vi bị hệ thống AI tự động phát hiện và ghi nhận:
1. **Không phát hiện khuôn mặt (Face Missing):** Thí sinh rời khỏi vị trí ngồi thi hoặc che khuất camera.
2. **Quay đầu / Lệch góc nhìn quá mức:** Thí sinh quay sang hai bên hoặc cúi nhìn tài liệu/thiết bị phụ.
3. **Phát hiện nhiều người (Multiple Faces):** Có người khác xuất hiện trong khung hình camera.
4. **Chuyển tab / Mở cửa sổ khác (Tab Switching):** Thí sinh rời khỏi màn hình làm bài thi để tra cứu.

---

## 7. Khắc phục Sự cố Thường gặp (FAQ)

### Q1: Trình duyệt báo "Không thể truy cập Camera"?
- **Cách xử lý:** 
  1. Nhấp vào biểu tượng ổ khoá 🔒 ở đầu thanh địa chỉ trình duyệt.
  2. Tại mục **Camera**, chọn **Cho phép (Allow)**.
  3. Tải lại trang (F5).
  4. Đảm bảo không có ứng dụng nào khác (Zoom, Google Meet, Teams) đang chiếm giữ camera.

### Q2: Đang làm bài thi thì bị mất kết nối mạng hoặc cúp điện?
- **Cách xử lý:** 
  - Toàn bộ câu trả lời của bạn được hệ thống **tự động lưu nháp từng câu** lên máy chủ ngay khi bạn click chọn.
  - Khi có mạng trở lại, bạn chỉ cần đăng nhập lại và nhấn vào kỳ thi để tiếp tục làm bài (trong khoảng thời gian làm bài còn hiệu lực).

### Q3: Tải ảnh bài làm tự luận báo lỗi hoặc quá chậm?
- **Cách xử lý:** 
  - Hệ thống đã tích hợp bộ nén ảnh tự động để giảm dung lượng file xuống chuẩn nén an toàn.
  - Hãy kiểm tra kết nối mạng và đảm bảo file có định dạng `.jpg`, `.png` hoặc `.jpeg`.

### Q4: Giáo viên muốn chấm điểm bài thi tự luận thì tìm ở đâu?
- **Cách xử lý:** 
  - Đăng nhập bằng tài khoản Giáo viên hoặc Admin.
  - Vào menu bên trái chọn **Chấm thi tự luận (Manual Grading)** để xem danh sách tất cả các bài làm đang chờ chấm điểm.

---

*Tài liệu được cập nhật theo phiên bản mới nhất của ExamTestWebsite.*
