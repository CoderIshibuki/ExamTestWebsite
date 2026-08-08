import { useState, useEffect } from 'react';
import { proctoringApi } from '../api/proctoringApi';
import apiClient from '../api/apiClient';
import type { StudentSession, Violation } from '../types/proctoring';
import { useProctorWebSocket } from './useProctorWebSocket';

export const useProctoringData = (examId: string) => {
  const [students, setStudents] = useState<StudentSession[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  const { alerts, clearAlerts, events } = useProctorWebSocket(examId);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch students
        const studentsRes = await apiClient.get(`/v1/realtime/exams/${examId}/students`);
        setStudents(studentsRes.data);

        // Fetch violations
        const violationsData = await proctoringApi.getViolations(examId);
        setViolations(violationsData);
      } catch (error) {
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
          return [...prev, { ...lastEvent.payload, is_online: true }];
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

  return { students, violations, alerts, clearAlerts, loading };
};
