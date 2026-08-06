sequenceDiagram
    participant T as Thí sinh (React + Proctor)
    participant WS as Real-time Service
    participant P as Proctoring Service
    participant R as Redis (Cache)
    participant E as Exam Service
    participant G as Grading Service
    participant M as Message Broker
    participant Admin as Dashboard Giám thị

    T->>WS: Kết nối WebSocket (vào phòng thi)
    T->>P: Khởi tạo Proctor Agent (camera, screen)
    WS->>R: Lưu thông tin phòng thi
    WS-->>T: Xác nhận kết nối thành công
    P-->>T: Xác nhận khởi tạo proctoring

    E->>R: Publish sự kiện "Bắt đầu thi"
    R->>WS: Gửi sự kiện đến các instance
    WS-->>T: Push câu hỏi đầu tiên

    loop Trả lời câu hỏi
        T->>WS: Gửi đáp án
        WS->>R: Lưu tiến trình
        WS-->>T: Cập nhật trạng thái
        WS->>G: Gửi đáp án để chấm
    end

    par Proctoring Monitoring
        loop Gửi dữ liệu proctoring
            T->>P: Gửi ảnh webcam & sự kiện
            P->>P: Xử lý & đánh giá rủi ro
            P->>PG: Lưu violation (nếu có)
            P->>M: Publish violation event
            M->>WS: Forward violation event
            WS-->>Admin: Hiển thị cảnh báo real-time
            WS-->>T: Cảnh báo (nếu nghiêm trọng)
        end
    end

    T->>WS: Nộp bài
    WS->>R: Lấy toàn bộ đáp án
    WS->>G: Gửi bài làm để chấm
    G-->>WS: Trả kết quả
    WS-->>T: Hiển thị điểm và đáp án
    
    P->>PG: Cập nhật trạng thái kết thúc giám sát