import { useState, useEffect } from 'react';
import { proctoringApi } from '../api/proctoringApi';
import apiClient from '../api/apiClient';
import type { StudentSession, Violation } from '../types/proctoring';
import { useProctorWebSocket } from './useProctorWebSocket';

export const useProctoringData = (examId: string) => {
  const [students, setStudents] = useState<StudentSession[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const { alerts, clearAlerts, events } = useProctorWebSocket(examId);

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
          name: 'Student ' + id.substring(0, 4), // Placeholder since realtime_service only returns IDs
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
              name: 'Student ' + String(lastEvent.payload.user_id).substring(0, 4),
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

  return { students, violations, alerts, clearAlerts, loading, unauthorized };
};
