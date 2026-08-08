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
        
        exam_id = data.get('exam_id')
        session_id = data.get('session_id')

        if not exam_id:
            await sio.emit('error', {'code': 400, 'message': 'exam_id is required'}, room=sid)
            return

        # Join Socket.IO room
        await sio.enter_room(sid, exam_id)
        
        # Keep track of exam_id in socket session for disconnect cleanup
        await sio.save_session(sid, {'user_id': user_id, 'exam_id': exam_id, 'token': token})

        # Add user to Redis set
        client = await redis_client.get_client()
        await client.sadd(f"exam:room:{exam_id}:clients", user_id)
        
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
        exam_id = data.get('exam_id')
        if exam_id:
            await sio.enter_room(sid, f"proctor:{exam_id}")
