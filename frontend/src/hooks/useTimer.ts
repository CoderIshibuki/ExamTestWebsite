import { useState, useEffect, useCallback } from 'react';

export const useTimer = (durationMinutes: number, onExpire: () => void) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(durationMinutes * 60);
    setIsRunning(true);
  }, [durationMinutes]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onExpire]);

  const isWarning = timeLeft > 0 && timeLeft <= 300;
  const isExpired = timeLeft === 0;

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  return {
    timeLeft,
    isRunning,
    isWarning,
    isExpired,
    formattedTime: formatTime(timeLeft)
  };
};
