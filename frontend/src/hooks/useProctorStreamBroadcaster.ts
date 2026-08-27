import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Phía học sinh: lắng nghe yêu cầu livestream từ giám thị, khi có yêu cầu thì tạo
 * RTCPeerConnection gửi luồng camera (đã xin quyền sẵn từ useProctoring) tới giám thị.
 * Không tự chủ động gửi video cho ai — chỉ phản hồi khi CÓ yêu cầu cụ thể, và học sinh
 * đã được thông báo rõ đang bị giám sát camera (khung camera hiện trong ExamRoom).
 */
export function useProctorStreamBroadcaster(
  examId: string,
  stream: MediaStream | null,
  onProctorAction?: (data: { action: string; reason?: string; penalty_percent?: number; penalty_minutes?: number }) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

  useEffect(() => {
    if (!examId) return;

    const token = localStorage.getItem('access_token') || '';
    let userId = '';
    try {
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || '';
      }
    } catch {}

    const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    const socket = io(wsUrl, {
      path: '/ws/socket.io',
      query: { token },
    });
    socketRef.current = socket;

    const handleStreamRequested = async (data: { proctor_sid: string }) => {
      if (!stream) return;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peersRef.current[data.proctor_sid] = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc_ice_candidate', { target_sid: data.proctor_sid, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { target_sid: data.proctor_sid, sdp: offer, user_id: userId });
    };

    const handleAnswer = async (data: { sdp: RTCSessionDescriptionInit; from_sid: string }) => {
      const pc = peersRef.current[data.from_sid];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    };

    const handleIceCandidate = (data: { candidate: RTCIceCandidateInit; from_sid: string }) => {
      const pc = peersRef.current[data.from_sid];
      pc?.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
    };

    const handleProctorAction = (data: any) => {
      if (!data) return;
      if (data.user_id === userId || data.user_id === '*' || !data.user_id) {
        onProctorAction?.(data);
      }
    };

    socket.on('connect', () => {
      socket.emit('join_exam', { exam_id: examId });
    });
    socket.on('webrtc_stream_requested', handleStreamRequested);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    socket.on('student:proctor_action', handleProctorAction);

    return () => {
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      socket.disconnect();
    };
  }, [examId, stream, onProctorAction]);
}
