import axiosInstance from './axios';

const BASE_URL = `${import.meta.env.VITE_API_URL}/v1/proctoring`;

export interface ViolationEvent {
  examId: string;
  userId: string;
  violationType: string;
  timestamp: string;
}

export const proctoringApi = {
  sendViolationEvent: async (data: ViolationEvent): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/events`, data);
  }
};
