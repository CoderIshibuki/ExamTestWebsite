import uuid
from datetime import datetime, timezone
from services.session_manager import session_manager
from services.exam_client import exam_client
from services.pubsub_manager import pubsub_manager
from services.redis_client import redis_client

def register_message_handlers(sio):
    @sio.event
    async def join_exam(sid, data):
        session = await sio.get_session(sid)
        user_id = session['user_id']
        token = session.get('token')
        role = session.get('role')
        
        exam_id = data.get('exam_id')
        session_id = data.get('session_id')

        if not exam_id:
            await sio.emit('error', {'code': 400, 'message': 'exam_id is required'}, room=sid)
            return

        # Join Socket.IO room
        await sio.enter_room(sid, exam_id)
        
        # Keep track of exam_id in socket session for disconnect cleanup.
        # Giữ lại "role" — trước đây bị ghi đè mất ở đây, khiến check quyền join_proctor_room
        # sau này không hoạt động cho tài khoản đã từng gọi join_exam.
        await sio.save_session(sid, {'user_id': user_id, 'exam_id': exam_id, 'token': token, 'role': role})

        # Add user to Redis set
        client = await redis_client.get_client()
        await client.sadd(f"exam:room:{exam_id}:clients", user_id)
        # Lưu mapping user_id -> sid để giám thị (proctor) tìm đúng kết nối khi yêu cầu
        # xem livestream camera của 1 học sinh cụ thể (WebRTC signaling).
        await client.set(f"exam:room:{exam_id}:sid:{user_id}", sid, ex=3600)
        
        # Notify proctor
        await sio.emit("proctor:student_joined", {"exam_id": exam_id, "user_id": user_id}, room=f"proctor:{exam_id}")
        
        # Subscribe to PubSub for this exam room
        await pubsub_manager.subscribe_to_exam(exam_id)

        # Recover or Create Session
        exam_session = None
        if session_id:
            exam_session = await session_manager.get_session(exam_id, user_id)
        
        if exam_session:
            # Recovered existing session
            pass
        else:
            # Create new session
            # Fetch questions from Exam Service
            try:
                questions = await exam_client.get_exam_questions(exam_id, token)
            except Exception as e:
                await sio.emit('error', {'code': 404, 'message': 'Exam not found or unable to fetch'}, room=sid)
                return
            
            new_session_id = str(uuid.uuid4())
            exam_session = await session_manager.create_session(
                session_id=new_session_id,
                exam_id=exam_id,
                user_id=user_id,
                total_questions=len(questions),
                questions=questions
            )

        # Send joined event
        await sio.emit('joined', exam_session.to_dict(), room=sid)

    @sio.event
    async def start_exam(sid, data):
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        exam_id = session.get('exam_id')
        
        exam_session = await session_manager.get_session(exam_id, user_id)
        if not exam_session:
            await sio.emit('error', {'code': 400, 'message': 'Session not found. Please join first.'}, room=sid)
            return
            
        if exam_session.total_questions > 0:
            question = exam_session.questions[exam_session.current_question]
            await sio.emit('question', {
                'index': exam_session.current_question,
                'question': question,
                'total': exam_session.total_questions,
            }, room=sid)
        else:
            await sio.emit('error', {'code': 400, 'message': 'No questions available'}, room=sid)

    @sio.event
    async def submit_answer(sid, data):
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        exam_id = session.get('exam_id')
        
        question_index = data.get('question_index')
        answer = data.get('answer')
        
        if question_index is None or answer is None:
            await sio.emit('error', {'code': 400, 'message': 'Invalid payload'}, room=sid)
            return

        exam_session = await session_manager.update_answer(exam_id, user_id, question_index, answer)
        
        if exam_session:
            await sio.emit('answer_saved', {
                'index': question_index,
                'answer': answer,
                'confirmed': True
            }, room=sid)
            
            # Broadcast update via PubSub if needed (e.g. for proctoring/dashboard)
            await pubsub_manager.publish(exam_id, "answer_saved", {
                "user_id": user_id,
                "index": question_index
            })
        else:
            await sio.emit('error', {'code': 400, 'message': 'Failed to save answer'}, room=sid)

    @sio.event
    async def next_question(sid, data):
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        exam_id = session.get('exam_id')
        
        exam_session = await session_manager.get_session(exam_id, user_id)
        if not exam_session:
            return
            
        if exam_session.current_question < exam_session.total_questions:
            question = exam_session.questions[exam_session.current_question]
            await sio.emit('question', {
                'index': exam_session.current_question,
                'question': question,
                'total': exam_session.total_questions,
            }, room=sid)
        else:
            # End of questions
            pass

    @sio.event
    async def submit_exam(sid, data):
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        exam_id = session.get('exam_id')
        token = session.get('token')
        
        exam_session = await session_manager.finish_session(exam_id, user_id)
        if exam_session:
            try:
                # Submit to Exam Service
                result_data = {
                    "exam_id": exam_id,
                    "user_id": user_id,
                    "answers": {str(k): v for k, v in exam_session.answers.items()},
                    "metadata_info": {
                        "started_at": exam_session.started_at.isoformat(),
                        "submitted_at": exam_session.submitted_at.isoformat()
                    }
                }
                response = await exam_client.submit_exam_result(exam_id, user_id, result_data, token)
                await sio.emit('exam_submitted', response, room=sid)
            except Exception as e:
                await sio.emit('error', {'code': 500, 'message': f'Failed to submit to server: {e}'}, room=sid)
        else:
            await sio.emit('error', {'code': 400, 'message': 'Session not valid or already submitted'}, room=sid)

    @sio.event
    async def ping(sid, data):
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        exam_id = session.get('exam_id')
        if exam_id and user_id:
            await session_manager.heartbeat(exam_id, user_id)
        await sio.emit('pong', {}, room=sid)

    @sio.event
    async def join_proctor_room(sid, data):
        session = await sio.get_session(sid)
        role = session.get('role') if session else None
        # Trước đây không hề kiểm tra quyền — bất kỳ tài khoản nào (kể cả học sinh) gọi
        # event này cũng vào được phòng giám thị, và một khi có tín hiệu WebRTC video sẽ
        # nghe/xem lén được luồng của học sinh khác. Chỉ admin/teacher mới được vào.
        if role not in ('admin', 'teacher'):
            await sio.emit('error', {'code': 403, 'message': 'Only proctors can join this room'}, room=sid)
            return
        exam_id = data.get('exam_id')
        if exam_id:
            await sio.enter_room(sid, f"proctor:{exam_id}")

    # ===== WebRTC signaling (livestream camera học sinh cho giám thị xem trực tiếp) =====
    # Chỉ RELAY tín hiệu offer/answer/ICE candidate giữa 2 sid cụ thể — bản thân server
    # không xử lý/lưu trữ video, luồng video truyền thẳng peer-to-peer giữa trình duyệt
    # học sinh và trình duyệt giám thị sau khi thiết lập kết nối xong.

    @sio.event
    async def webrtc_request_stream(sid, data):
        """Giám thị yêu cầu 1 học sinh cụ thể bắt đầu chia sẻ camera."""
        session = await sio.get_session(sid)
        role = session.get('role') if session else None
        if role not in ('admin', 'teacher'):
            await sio.emit('error', {'code': 403, 'message': 'Only proctors can request a stream'}, room=sid)
            return
        target_user_id = data.get('user_id')
        exam_id = data.get('exam_id')
        if not target_user_id or not exam_id:
            return
        # Tìm sid của học sinh theo user_id trong phòng thi — lưu qua Redis lúc join_exam.
        client = await redis_client.get_client()
        student_sid = await client.get(f"exam:room:{exam_id}:sid:{target_user_id}")
        if student_sid:
            await sio.emit('webrtc_stream_requested', {'proctor_sid': sid}, room=student_sid.decode() if isinstance(student_sid, bytes) else student_sid)

    @sio.event
    async def webrtc_offer(sid, data):
        target_sid = data.get('target_sid')
        if target_sid:
            await sio.emit('webrtc_offer', {'sdp': data.get('sdp'), 'from_sid': sid, 'user_id': data.get('user_id')}, room=target_sid)

    @sio.event
    async def webrtc_answer(sid, data):
        target_sid = data.get('target_sid')
        if target_sid:
            await sio.emit('webrtc_answer', {'sdp': data.get('sdp'), 'from_sid': sid}, room=target_sid)

    @sio.event
    async def webrtc_ice_candidate(sid, data):
        target_sid = data.get('target_sid')
        if target_sid:
            await sio.emit('webrtc_ice_candidate', {'candidate': data.get('candidate'), 'from_sid': sid}, room=target_sid)
