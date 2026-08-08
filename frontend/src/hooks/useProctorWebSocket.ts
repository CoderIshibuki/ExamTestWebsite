import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ProctorAlert } from '../types/proctoring';

export const useProctorWebSocket = (examId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [alerts, setAlerts] = useState<ProctorAlert[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // Determine the WS URL (adjust based on your environment)
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000';
    const newSocket = io(wsUrl, { path: '/ws' });

    newSocket.on('connect', () => {
      newSocket.emit('join_proctor_room', { exam_id: examId });
    });

    newSocket.on('proctor:alert', (alert: ProctorAlert) => {
      setAlerts((prev) => [...prev, alert]);
      setEvents((prev) => [...prev, { type: 'alert', payload: alert }]);
    });

    newSocket.on('proctor:student_joined', (data) => {
      setEvents((prev) => [...prev, { type: 'student_joined', payload: data }]);
    });

    newSocket.on('proctor:student_left', (data) => {
      setEvents((prev) => [...prev, { type: 'student_left', payload: data }]);
    });

    newSocket.on('proctor:risk_update', (data) => {
      setEvents((prev) => [...prev, { type: 'risk_update', payload: data }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [examId]);

  const clearAlerts = () => setAlerts([]);

  return { socket, alerts, clearAlerts, events };
};
