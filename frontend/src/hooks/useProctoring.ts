import { useState, useEffect, useCallback } from 'react';
import { proctoringApi } from '../api/proctoringApi';

export const useProctoring = (examId: string, attemptId: string) => {
  const [isActive] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [lastViolationType, setLastViolationType] = useState<string | null>(null);

  const handleViolation = useCallback(
    (type: string) => {
      if (!examId || !attemptId) return;
      setViolationCount((prev) => prev + 1);
      setLastViolationType(type);
      proctoringApi
        .sendViolationEvent({
          exam_id: examId,
          exam_session_id: attemptId,
          type,
          severity: 'medium',
          details: {
            source: 'browser',
            eventType: type,
          },
          screenshot_url: null,
        })
        .catch(console.error);
    },
    [examId, attemptId],
  );

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
