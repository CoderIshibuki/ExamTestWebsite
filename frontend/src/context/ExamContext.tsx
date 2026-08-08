import React, { createContext, useState, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface Question {
  id: string;
  content: string;
  type: 'multiple_choice' | 'true_false';
  options: { id: string; text: string }[];
}

export interface ExamState {
  examId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  status: 'idle' | 'joining' | 'in_progress' | 'submitting' | 'submitted' | 'error';
  totalQuestions: number;
  sessionId: string | null;
}

interface ExamContextType {
  state: ExamState;
  setQuestions: (questions: Question[]) => void;
  setAnswer: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setStatus: (status: ExamState['status']) => void;
  setExamId: (examId: string) => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExamState>({
    examId: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    status: 'idle',
    totalQuestions: 0,
    sessionId: null,
  });

  const setQuestions = useCallback((questions: Question[]) => {
    setState((prev) => ({ ...prev, questions, totalQuestions: questions.length }));
  }, []);

  const setAnswer = useCallback((questionId: string, answer: string) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer }
    }));
  }, []);

  const nextQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, prev.totalQuestions - 1)
    }));
  }, []);

  const prevQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0)
    }));
  }, []);

  const setStatus = useCallback((status: ExamState['status']) => {
    setState((prev) => ({ ...prev, status }));
  }, []);

  const setExamId = useCallback((examId: string) => {
    setState((prev) => ({ ...prev, examId }));
  }, []);

  return (
    <ExamContext.Provider value={{ state, setQuestions, setAnswer, nextQuestion, prevQuestion, setStatus, setExamId }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExamContext = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExamContext must be used within an ExamProvider');
  }
  return context;
};
