import axiosInstance from './axios';

const BASE_URL = `${import.meta.env.VITE_API_URL}/v1/grading`;

export interface QuestionResult {
  question_id: string;
  is_correct: boolean;
  user_answer: string;
}

export interface ExamResult {
  score: number;
  total_possible: number;
  percentage: number;
  correct_count: number;
  incorrect_count: number;
  question_results: QuestionResult[];
}

export const gradingApi = {
  getExamResult: async (examId: string, userId: string): Promise<ExamResult> => {
    const response = await axiosInstance.get(`${BASE_URL}/result/${examId}/${userId}`);
    return response.data;
  }
};
