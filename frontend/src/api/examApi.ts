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

export const examApi = {
  getPublishedExams,
  getExamById,
  getExamQuestions,
};
