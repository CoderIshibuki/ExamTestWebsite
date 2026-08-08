import axiosInstance from './axios';

const BASE_URL = `${import.meta.env.VITE_API_URL}/v1/exams`;

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  max_attempts: number;
}

export const examApi = {
  getPublishedExams: async (): Promise<Exam[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/`, {
      params: { status: 'published' }
    });
    return response.data;
  },
  getExamById: async (examId: string): Promise<Exam> => {
    const response = await axiosInstance.get(`${BASE_URL}/${examId}`);
    return response.data;
  },
  getExamQuestions: async (examId: string): Promise<any[]> => {
    const response = await axiosInstance.get(`${BASE_URL}/${examId}/questions`);
    return response.data;
  }
};
