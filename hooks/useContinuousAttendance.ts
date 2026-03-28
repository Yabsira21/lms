'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseContinuousAttendanceOptions {
  classId: string;
  userId: string;
  enabled: boolean; // only run when session is 'ongoing'
  videoRef: React.RefObject<HTMLVideoElement>;
}

export interface AttendanceState {
  currentIntervalIndex: number;
  strikeCount: number;          // 0-3 consecutive failures
  lastStatus: 'VERIFIED' | 'UNVERIFIED' | 'PENDING' | null;
  verifiedCount: number;
  totalLogged: number;
  verifiedPct: number;
  isActive: boolean;
  faceBox: { x: number; y: number; width: number; height: number } | null;
  isFacePositioned: boolean | null;
}

const INTERVAL_MS = 60_000;   // 1 minute
const RETRY_MS   = 5_000;     // 5 seconds between strikes
const MAX_STRIKES = 3;
const DISTANCE_THRESHOLD = 0.5;
const POSITION_CHECK_MS = 1_000;

/** Euclidean distance between two 128-d vectors */
function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

export function useContinuousAttendance({
  classId,
  userId,
  enabled,
  videoRef,
}: UseContinuousAttendanceOptions) {
  const [state, setState] = useState<AttendanceState>({
    currentIntervalIndex: 0,
    strikeCount: 0,
    lastStatus: null,
    verifiedCount: 0,
    totalLogged: 0,
    verifiedPct: 0,
    isActive: false,
    faceBox: null,
    isFacePositioned: null,
  });

  // Refs so callbacks always see latest values without re-creating timers
  const stateRef = useRef(state);
  stateRef.current = state;

  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const strikeTimerRef   = useRef<NodeJS.Timeout | null>(null);
  const positionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const faceApiRef       = useRef<any>(null);
  const storedEmbeddingRef = useRef<number[] | null>(null);

  const getPrimaryFaceBox = useCallback(async () => {
    const faceapi = faceApiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const detections = await faceapi.detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }),
    );

    if (!detections || detections.length === 0) return null;

    const primary = detections.reduce((best: any, d: any) => {
      const area = d.box.width * d.box.height;
      const bestArea = best.box.width * best.box.height;
      return area > bestArea ? d : best;
    });

    const box = primary.box;
    const width = box.width / video.videoWidth;
    const height = box.height / video.videoHeight;
    const x = box.x / video.videoWidth;
    const y = box.y / video.videoHeight;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const areaRatio = width * height;

    const isCenteredHorizontally = centerX >= 0.35 && centerX <= 0.65;
    const isCenteredVertically = centerY >= 0.25 && centerY <= 0.75;
    const isReasonableSize = areaRatio >= 0.08 && areaRatio <= 0.5;

    return {
      box: { x, y, width, height },
      isPositioned: isCenteredHorizontally && isCenteredVertically && isReasonableSize,
    };
  }, [videoRef]);

  // ─── Load face-api.js models once ───────────────────────────────────────────
  const loadModels = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const faceapi = await import('face-api.js');
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),   // full model — present in /public/models
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      faceApiRef.current = faceapi;
      console.log('[Attendance] Models loaded successfully');
    } catch (err) {
      console.error('[Attendance] Failed to load face-api models:', err);
    }
  }, []);

  // ─── Fetch stored embedding for this user ───────────────────────────────────
  const loadStoredEmbedding = useCallback(async () => {
    try {
      const res = await fetch(`/api/face-recognition/embedding?userId=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.embedding) {
        storedEmbeddingRef.current = JSON.parse(data.embedding);
      }
    } catch (err) {
      console.error('[Attendance] Failed to load stored embedding:', err);
    }
  }, [userId]);

  // ─── Core: detect & verify one frame ────────────────────────────────────────
  const verifyFrame = useCallback(async (): Promise<{ verified: boolean; confidence: number }> => {
    const faceapi = faceApiRef.current;
    const video   = videoRef.current;
    const stored  = storedEmbeddingRef.current;

    if (!faceapi || !video || !stored) return { verified: false, confidence: 0 };

    try {
      const primaryFaceData = await getPrimaryFaceBox();
      if (!primaryFaceData) {
        setState(prev => ({ ...prev, faceBox: null, isFacePositioned: null }));
        return { verified: false, confidence: 0 };
      }

      setState(prev => ({
        ...prev,
        faceBox: primaryFaceData.box,
        isFacePositioned: primaryFaceData.isPositioned,
      }));

      // Detect ALL faces with landmarks + descriptors
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceLandmarks()          // full 68-point model
        .withFaceDescriptors();

      if (!detections || detections.length === 0) {
        return { verified: false, confidence: 0 };
      }

      // ── Primary Subject Rule: pick the face with the largest bounding box ──
      const primary = detections.reduce((best: any, d: any) => {
        const area = d.detection.box.width * d.detection.box.height;
        const bestArea = best.detection.box.width * best.detection.box.height;
        return area > bestArea ? d : best;
      });

      const embedding = Array.from(primary.descriptor) as number[];
      const distance  = euclidean(embedding, stored);
      const confidence = Math.max(0, 1 - distance / DISTANCE_THRESHOLD);

      return {
        verified: distance < DISTANCE_THRESHOLD,
        confidence,
      };
    } catch (err) {
      console.error('[Attendance] verifyFrame error:', err);
      return { verified: false, confidence: 0 };
    }
  }, [videoRef, getPrimaryFaceBox]);

  const runPositionCheck = useCallback(async () => {
    try {
      const faceData = await getPrimaryFaceBox();
      setState(prev => ({
        ...prev,
        faceBox: faceData?.box ?? null,
        isFacePositioned: faceData?.isPositioned ?? null,
      }));
    } catch {
      setState(prev => ({ ...prev, faceBox: null, isFacePositioned: null }));
    }
  }, [getPrimaryFaceBox]);

  // ─── Log an interval result to the server ───────────────────────────────────
  const logInterval = useCallback(
    async (intervalIndex: number, status: 'VERIFIED' | 'UNVERIFIED', confidence: number) => {
      try {
        const res = await fetch('/api/attendance/interval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classId, intervalIndex, status, confidence }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setState(prev => ({
          ...prev,
          lastStatus: status,
          verifiedCount: data.summary.verifiedIntervals,
          totalLogged: data.summary.totalIntervals,
          verifiedPct: data.summary.verifiedPct,
        }));
      } catch (err) {
        console.error('[Attendance] logInterval error:', err);
      }
    },
    [classId],
  );

  // ─── Strike-buffer retry logic ───────────────────────────────────────────────
  const runStrikeRetry = useCallback(
    (intervalIndex: number, strikesSoFar: number) => {
      if (strikeTimerRef.current) clearTimeout(strikeTimerRef.current);

      strikeTimerRef.current = setTimeout(async () => {
        const { verified, confidence } = await verifyFrame();

        if (verified) {
          // Recovered — log VERIFIED and reset strikes
          setState(prev => ({ ...prev, strikeCount: 0 }));
          await logInterval(intervalIndex, 'VERIFIED', confidence);
          return;
        }

        const newStrikes = strikesSoFar + 1;
        setState(prev => ({ ...prev, strikeCount: newStrikes }));

        if (newStrikes >= MAX_STRIKES) {
          // All 3 retries failed — log UNVERIFIED
          await logInterval(intervalIndex, 'UNVERIFIED', 0);
        } else {
          // Still have retries left
          runStrikeRetry(intervalIndex, newStrikes);
        }
      }, RETRY_MS);
    },
    [verifyFrame, logInterval],
  );

  // ─── Main 1-minute interval tick ────────────────────────────────────────────
  const runIntervalTick = useCallback(async () => {
    const idx = stateRef.current.currentIntervalIndex;
    setState(prev => ({
      ...prev,
      currentIntervalIndex: prev.currentIntervalIndex + 1,
      strikeCount: 0,
    }));

    const { verified, confidence } = await verifyFrame();

    if (verified) {
      await logInterval(idx, 'VERIFIED', confidence);
    } else {
      // Start strike buffer — first failure is strike 1
      setState(prev => ({ ...prev, strikeCount: 1 }));
      runStrikeRetry(idx, 1);
    }
  }, [verifyFrame, logInterval, runStrikeRetry]);

  // ─── Start / stop the 1-minute polling ──────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
      if (strikeTimerRef.current)   clearTimeout(strikeTimerRef.current);
      if (positionTimerRef.current) clearInterval(positionTimerRef.current);
      setState(prev => ({
        ...prev,
        isActive: false,
        strikeCount: 0,
        faceBox: null,
        isFacePositioned: null,
      }));
      return;
    }

    let cancelled = false;

    (async () => {
      await loadModels();
      await loadStoredEmbedding();
      if (cancelled) return;

      setState(prev => ({ ...prev, isActive: true }));

      // First check immediately, then every minute
      await runIntervalTick();
      if (cancelled) return;

      intervalTimerRef.current = setInterval(runIntervalTick, INTERVAL_MS);
      await runPositionCheck();
      positionTimerRef.current = setInterval(runPositionCheck, POSITION_CHECK_MS);
    })();

    return () => {
      cancelled = true;
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
      if (strikeTimerRef.current)   clearTimeout(strikeTimerRef.current);
      if (positionTimerRef.current) clearInterval(positionTimerRef.current);
      intervalTimerRef.current = null;
      strikeTimerRef.current = null;
      positionTimerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // Only re-run when enabled changes — not on every callback recreation

  return state;
}
