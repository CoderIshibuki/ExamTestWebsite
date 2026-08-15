import { useState, useEffect } from 'react';
import { proctoringApi } from '../api/proctoringApi';
import apiClient from '../api/apiClient';
import { adminApi } from '../api/adminApi';
import type { StudentSession, Violation } from '../types/proctoring';
import { useProctorWebSocket } from './useProctorWebSocket';

export const useProctoringData = (examId: string) => {
  const [students, setStudents] = useState<StudentSession[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, { full_name?: string; username?: string }>>({});

  const { socket, alerts, clearAlerts, events } = useProctorWebSocket(examId);

  // Tải trước danh sách người dùng để tra tên thật theo user_id — trước đây hiển thị
  // tên giả "Student xxxx" (và field "name" còn không khớp với field StudentCard đọc
  // là "full_name"/"username", nên trước giờ luôn hiện thẳng user_id thô cho giám thị).
  useEffect(() => {
    adminApi.getUsers()
      .then((users) => {
        const map: Record<string, { full_name?: string; username?: string }> = {};
        (users || []).forEach((u: any) => {
          map[u.id] = { full_name: u.full_name, username: u.username };
        });
        setUserMap(map);
      })
      .catch((err) => console.error('Không tải được danh sách người dùng để hiện tên học sinh:', err));
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch students
        const studentsRes = await apiClient.get(`/v1/realtime/exams/${examId}/students`);
        
        // Backend returns: { exam_id: string, online_students: string[] }
        const userIds = studentsRes.data.online_students || [];
        const mappedStudents: StudentSession[] = userIds.map((id: string) => ({
          user_id: id,
          full_name: userMap[id]?.full_name,
          username: userMap[id]?.username,
          is_online: true,
          risk_score: 0,
          violations_count: 0
        }));
        
        setStudents(mappedStudents);

        // Fetch violations
        const violationsData = await proctoringApi.getViolations(examId);
        setViolations(violationsData);
      } catch (error: any) {
        if (error.response && error.response.status === 403) {
          setUnauthorized(true);
        } else {
          setError('Failed to establish connection to the proctoring server. Please refresh and try again.');
        }
        console.error('Error fetching proctoring data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchInitialData();
    }
  }, [examId]);

  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (lastEvent.type === 'student_joined') {
        setStudents((prev) => {
          const exists = prev.find((s) => s.user_id === lastEvent.payload.user_id);
          if (exists) {
            return prev.map((s) => s.user_id === lastEvent.payload.user_id ? { ...s, is_online: true } : s);
          }
          return [
            ...prev,
            {
              user_id: lastEvent.payload.user_id,
              full_name: userMap[lastEvent.payload.user_id]?.full_name,
              username: userMap[lastEvent.payload.user_id]?.username,
              is_online: true,
              risk_score: 0,
              violations_count: 0,
            }
          ];
        });
      } else if (lastEvent.type === 'student_left') {
        setStudents((prev) => prev.map((s) => s.user_id === lastEvent.payload.user_id ? { ...s, is_online: false } : s));
      } else if (lastEvent.type === 'risk_update') {
        setStudents((prev) => prev.map((s) => s.user_id === lastEvent.payload.user_id ? { ...s, risk_score: lastEvent.payload.risk_score } : s));
      } else if (lastEvent.type === 'alert') {
        // We could also push to violations if it's a violation event, but alerts are separate.
        // Assuming some alerts might correspond to violations:
        if (lastEvent.payload.type === 'violation') {
           // We might need to fetch violations again or construct one
        }
      }
    }
  }, [events]);

  return { students, violations, alerts, clearAlerts, loading, unauthorized, error, socket };
};
