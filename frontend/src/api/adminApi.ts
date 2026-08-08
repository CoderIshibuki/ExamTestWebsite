import axios from 'axios';

export const adminApi = {
  getUsers: async () => {
    const response = await axios.get(`/api/v1/auth/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    return response.data;
  },
  
  updateUser: async (id: string, data: any) => {
    const response = await axios.put(`/api/v1/auth/users/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    return response.data;
  },

  getQuestions: async () => {
    const response = await axios.get(`/api/v1/questions`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    return response.data;
  },

  importQuestionsBulk: async (questions: any[]) => {
    const response = await axios.post(`/api/v1/questions/bulk`, questions, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    return response.data;
  },

  getExams: async () => {
    const response = await axios.get(`/api/v1/exams`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    return response.data;
  },
  
  getOverviewStats: async () => {
    const response = await axios.get(`/api/v1/exams/stats/overview`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    return response.data;
  },
  
  getReports: async () => {
    // Placeholder endpoint for analytics
    return { data: [] };
  }
};
