import { useState, useEffect, useCallback, useRef } from 'react';
import { proctoringApi } from '../api/proctoringApi';
import { useFaceMonitor } from './useFaceMonitor';
import type { FaceViolationType } from './useFaceMonitor';
import { useObjectDetection } from './useObjectDetection';
import type { ObjectViolationType } from './useObjectDetection';
import { checkForVirtualCamera } from '../utils/cameraDeviceCheck';

type ViolationType = FaceViolationType | ObjectViolationType | 'tab_switch' | 'window_blur' | 'suspicious_camera_device';

const SEVERITY_MAP: Record<ViolationType, 'low' | 'medium' | 'high' | 'critical'> = {
  tab_switch: 'medium',
  window_blur: 'medium',
  no_face_detected: 'high',
  multiple_faces_detected: 'critical',
  face_turned_away: 'medium',
  gaze_away_from_screen: 'low',
  suspicious_camera_device: 'critical',
  phone_detected: 'critical',
  book_detected: 'high',
};

interface UseProctoringOptions {
  /** Bật camera + AI Proctoring (Face Mesh, object detection, kiểm tra camera ảo).
   *  Nếu false, chỉ giữ hành vi cũ (theo dõi chuyển tab/mất focus cửa sổ) — không xin
   *  quyền camera, phù hợp khi thí sinh từ chối cấp quyền camera hoặc đề thi không
   *  yêu cầu giám sát camera. */
  enableCamera?: boolean;
}

export const useProctoring = (examId: string, attemptId: string, options: UseProctoringOptions = {}) => {
  const { enableCamera = true } = options;
  const [isActive] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [lastViolationType, setLastViolationType] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 320);
      canvas.height = Math.min(video.videoHeight, 240);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.65);
    } catch {
      return null;
    }
  }, []);

  const handleViolation = useCallback(
    (type: ViolationType, details: Record<string, any> = {}) => {
      if (!examId || !attemptId) return;
      setViolationCount((prev) => prev + 1);
      setLastViolationType(type);
      const screenshot = captureFrame();
      proctoringApi
        .sendViolationEvent({
          exam_id: examId,
          exam_session_id: attemptId,
          type,
          severity: SEVERITY_MAP[type] || 'medium',
          details: { source: type.startsWith('tab_') || type.startsWith('window_') ? 'browser' : 'ai_proctoring', eventType: type, ...details },
          screenshot_url: screenshot,
        })
        .catch(console.error);
    },
    [examId, attemptId, captureFrame],
  );

  // Theo dõi chuyển tab / mất focus cửa sổ (luôn bật, không cần quyền camera)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('tab_switch');
      }
    };
    const handleBlur = () => {
      handleViolation('window_blur');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleViolation]);

  // Xin quyền camera + kiểm tra camera ảo (chỉ 1 lần khi bắt đầu)
  useEffect(() => {
    if (!enableCamera) return;
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);

        const check = await checkForVirtualCamera(stream);
        if (check.suspicious) {
          handleViolation('suspicious_camera_device', {
            device_label: check.deviceLabel,
            matched_keyword: check.matchedKeyword,
          });
        }
      } catch (err: any) {
        console.error('Không thể truy cập camera:', err);
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Bạn đã từ chối quyền truy cập camera. Giám thị sẽ không thể xác minh danh tính qua camera trong bài thi này.'
            : 'Không thể khởi động camera. Kiểm tra lại thiết bị hoặc trình duyệt.'
        );
      }
    };

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraStream(null);
    };
  }, [enableCamera, handleViolation]);

  const faceMonitorViolation = useCallback(
    (type: FaceViolationType, details: Record<string, any>) => handleViolation(type, details),
    [handleViolation]
  );
  const objectDetectionViolation = useCallback(
    (type: ObjectViolationType, details: Record<string, any>) => handleViolation(type, details),
    [handleViolation]
  );

  const { status: faceMonitorStatus } = useFaceMonitor({
    videoRef,
    enabled: enableCamera && cameraReady,
    onViolation: faceMonitorViolation,
  });

  const { available: objectDetectionAvailable } = useObjectDetection({
    videoRef,
    enabled: enableCamera && cameraReady,
    onViolation: objectDetectionViolation,
  });

  return {
    isActive,
    violationCount,
    lastViolationType,
    videoRef,
    cameraReady,
    cameraStream,
    cameraError,
    faceMonitorStatus,
    objectDetectionAvailable,
  };
};
