import apiClient from './apiClient';

export const adminApi = {
  // ===== Users (auth_service) =====
  getUsers: async () => {
    const response = await apiClient.get('/v1/auth/users');
    return response.data;
  },
  createUser: async (data: { username: string; email: string; full_name?: string; password?: string; role?: string }) => {
    const response = await apiClient.post('/v1/auth/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: { role?: string; is_active?: boolean }) => {
    const response = await apiClient.put(`/v1/auth/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string) => {
    await apiClient.delete(`/v1/auth/users/${id}`);
  },

  // ===== Questions (question_service) =====
  getQuestions: async () => {
    // GET /v1/questions trả về dạng phân trang {total, page, size, items}, không phải mảng phẳng.
    const response = await apiClient.get('/v1/questions', { params: { limit: 100 } });
    return response.data?.items ?? [];
  },
  createQuestion: async (data: any) => {
    const response = await apiClient.post('/v1/questions', data);
    return response.data;
  },
  updateQuestion: async (id: string, data: any) => {
    const response = await apiClient.put(`/v1/questions/${id}`, data);
    return response.data;
  },
  deleteQuestion: async (id: string) => {
    await apiClient.delete(`/v1/questions/${id}`);
  },
  importQuestionsBulk: async (questions: any[]) => {
    const response = await apiClient.post('/v1/questions/bulk', questions);
    return response.data;
  },

  // ===== Exams (exam_service) =====
  getExams: async () => {
    const response = await apiClient.get('/v1/exams');
    return response.data;
  },
  createExam: async (data: {
    title: string;
    description?: string;
    duration_minutes: number;
    passing_score?: number;
    max_attempts?: number;
    shuffle_questions?: boolean;
    shuffle_options?: boolean;
    show_result_after_submit?: boolean;
  }) => {
    const response = await apiClient.post('/v1/exams', data);
    return response.data;
  },
  updateExam: async (id: string, data: any) => {
    const response = await apiClient.put(`/v1/exams/${id}`, data);
    return response.data;
  },
  deleteExam: async (id: string) => {
    await apiClient.delete(`/v1/exams/${id}`);
  },
  publishExam: async (id: string) => {
    const response = await apiClient.post(`/v1/exams/${id}/publish`);
    return response.data;
  },
  getExamQuestions: async (examId: string) => {
    const response = await apiClient.get(`/v1/exams/${examId}/questions`);
    return response.data;
  },
  addExamQuestion: async (examId: string, data: { question_id: string; question_order?: number; point_value?: number }) => {
    const response = await apiClient.post(`/v1/exams/${examId}/questions`, data);
    return response.data;
  },
  removeExamQuestion: async (examId: string, questionId: string) => {
    await apiClient.delete(`/v1/exams/${examId}/questions/${questionId}`);
  },
  generateExamQuestions: async (examId: string, data: { subject: string; difficulty: string; num_questions: number; question_types: string[]; point_per_question?: number }) => {
    const response = await apiClient.post(`/v1/exams/${examId}/generate`, data);
    return response.data;
  },

  getOverviewStats: async () => {
    const response = await apiClient.get('/v1/exams/stats/overview');
    return response.data;
  },
  getReports: async () => {
    const response = await apiClient.get('/v1/exams/stats/reports');
    return response.data;
  }
};
