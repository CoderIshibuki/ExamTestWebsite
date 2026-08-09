import apiClient from './apiClient';

export const adminApi = {
  getUsers: async () => {
    const response = await apiClient.get('/v1/auth/users');
    return response.data;
  },

  createUser: async (data: any) => {
    const response = await apiClient.post('/v1/auth/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await apiClient.put(`/v1/auth/users/${id}`, data);
    return response.data;
  },

  getQuestions: async () => {
    const response = await apiClient.get('/v1/questions');
    return response.data;
  },

  importQuestionsBulk: async (questions: any[]) => {
    const response = await apiClient.post('/v1/questions/bulk', questions);
    return response.data;
  },

  getExams: async () => {
    const response = await apiClient.get('/v1/exams');
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
