import apiClient from './apiClient';

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  max_attempts: number;
  status?: string;
  created_at?: string;
}

export async function getPublishedExams(): Promise<Exam[]> {
  const response = await apiClient.get('/v1/exams/', {
    params: { status: 'published' }
  });
  return response.data;
}

export async function getExamById(examId: string): Promise<Exam> {
  const response = await apiClient.get(`/v1/exams/${examId}`);
  return response.data;
}

export async function getExamQuestions(examId: string): Promise<ExamQuestion[]> {
  const response = await apiClient.get(`/v1/exams/${examId}/questions`);
  return response.data;
}

export interface ExamQuestion {
  id: string;
  question_id: string;
  content?: string;
  options?: string[];
  type?: string;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  attempt_number: number;
  status: string;
  started_at: string;
  expires_at: string;
}

export async function startExam(examId: string): Promise<ExamAttempt> {
  const response = await apiClient.post(`/v1/exams/${examId}/start`);
  return response.data;
}

export async function saveAnswer(attemptId: string, questionId: string, answer: string) {
  const response = await apiClient.post(`/v1/exams/attempts/${attemptId}/answers`, {
    question_id: questionId,
    selected_answer: answer
  });
  return response.data;
}

export async function submitExam(attemptId: string) {
  const response = await apiClient.post(`/v1/exams/attempts/${attemptId}/submit`);
  return response.data;
}

export const examApi = {
  getPublishedExams,
  getExamById,
  getExamQuestions,
  startExam,
  saveAnswer,
  submitExam,
};
