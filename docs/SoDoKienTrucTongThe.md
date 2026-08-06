flowchart TB
    subgraph Client["Frontend (React + TypeScript)"]
        UI[Giao diện người dùng]
        WS_Client[Socket.IO Client]
        ProctorAgent[Proctor Agent\n@timadey/proctor\n- WebRTC Camera\n- Event Collector\n- Screen Capture]
    end

    subgraph Gateway["API Gateway / Load Balancer (NGINX / Traefik)"]
        LB
    end

    subgraph Services["Backend Services (FastAPI)"]
        Auth[Auth Service\n- Xác thực JWT\n- Quản lý người dùng]
        Exam[Exam Service\n- Quản lý kỳ thi\n- Lịch thi, phòng thi]
        Question[Question Service\n- Ngân hàng câu hỏi\n- Cấu trúc linh hoạt]
        RealTime[Real-time Service\n- WebSocket\n- Đồng bộ trạng thái\n- Push câu hỏi, câu trả lời]
        Grading[Grading Service\n- Chấm tự động\n- Quản lý chấm thủ công]
        Analytics[Analytics Service\n- Thống kê\n- Báo cáo]
        Proctor[Proctoring Service\n- Nhận dữ liệu từ client\n- Xử lý sự kiện\n- Đánh giá rủi ro]
    end

    subgraph Data["Cơ sở dữ liệu"]
        PG[(PostgreSQL\n- Users, Exams,\n  Results, Violations)]
        MG[(MongoDB\n- Questions,\n  User Sessions)]
        RD[(Redis\n- Cache, Pub/Sub\n- Session real-time)]
    end

    subgraph Broker["Message Broker"]
        MQ[RabbitMQ / Redis Streams]
    end

    UI --> LB
    WS_Client -->|WebSocket| RealTime
    ProctorAgent -->|Gửi sự kiện & ảnh| Proctor
    LB --> Auth
    LB --> Exam
    LB --> Question
    LB --> Grading
    LB --> Analytics
    LB --> Proctor

    Auth --> PG
    Exam --> PG
    Grading --> PG
    Question --> MG
    Analytics --> MG
    RealTime --> RD
    Proctor --> PG
    Proctor --> RD

    Exam -- publish events --> MQ
    Grading -- subscribe events --> MQ
    Analytics -- subscribe events --> MQ
    RealTime -- subscribe events --> MQ
    Proctor -- publish violation events --> MQ
    RealTime -- publish/subscribe --> RD