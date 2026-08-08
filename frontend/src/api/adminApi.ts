import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const adminApi = {
  getUsers: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },
  
  updateUser: async (id: string, data: any) => {
    const response = await axios.put(`${API_BASE_URL}/api/v1/users/${id}`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  getQuestions: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/questions`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  importQuestionsBulk: async (questions: any[]) => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/questions/bulk`, questions, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  getExams: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/exams`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },
  
  getReports: async () => {
    // Placeholder endpoint for analytics
    return { data: [] };
  }
};
