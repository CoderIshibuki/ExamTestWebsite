import { useState, useEffect, useCallback } from 'react';
import { proctoringApi } from '../api/proctoringApi';

export const useProctoring = (examId: string, userId: string) => {
  const [isActive, setIsActive] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [lastViolationType, setLastViolationType] = useState<string | null>(null);

  const handleViolation = useCallback((type: string) => {
    setViolationCount((prev) => prev + 1);
    setLastViolationType(type);
    proctoringApi.sendViolationEvent({
      examId,
      userId,
      violationType: type,
      timestamp: new Date().toISOString()
    }).catch(console.error);
  }, [examId, userId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('tab_switch');
      }
    };

    const handleBlur = () => {
      handleViolation('window_blur');
    };

    const handleFocus = () => {
      // Returned to focus
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [handleViolation]);

  return { isActive, violationCount, lastViolationType };
};
