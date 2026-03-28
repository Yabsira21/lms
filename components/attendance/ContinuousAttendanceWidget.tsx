'use client';

import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Camera, Loader2, ShieldOff, ShieldCheck } from 'lucide-react';
import { useContinuousAttendance } from '@/hooks/useContinuousAttendance';

interface Props {
  classId: string;
  userId: string;
  /** true only when instructor's session status is 'Ongoing' */
  sessionActive: boolean;
}

export default function ContinuousAttendanceWidget({ classId, userId, sessionActive }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const {
    strikeCount,
    lastStatus,
    verifiedCount,
    totalLogged,
    verifiedPct,
    isActive,
    faceBox,
    isFacePositioned,
  } = useContinuousAttendance({
    classId,
    userId,
    enabled: sessionActive,
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
  });

  // Start camera stream when session becomes active
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (!sessionActive) {
      setCameraReady(false);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false })
      .then(s => {
        stream = s;
        // Feed the same stream to both the hidden processing video and the visible preview
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
        if (previewRef.current) {
          previewRef.current.srcObject = s;
          previewRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      })
      .catch(err => {
        console.error('[Attendance] Camera access denied:', err);
        setCameraReady(false);
      });

    return () => {
      stream?.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      if (previewRef.current) previewRef.current.srcObject = null;
      setCameraReady(false);
    };
  }, [sessionActive]);

  // ── Inactive state ──────────────────────────────────────────────────────────
  if (!sessionActive) {
    return (
      <Card className="shadow-sm">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Attendance Verification</h3>
            <Badge variant="secondary" className="text-xs gap-1 text-gray-500">
              <ShieldOff className="h-3 w-3" />
              Inactive
            </Badge>
          </div>

          {/* Placeholder camera area */}
          <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200">
            <Camera className="h-8 w-8 text-gray-300" />
            <p className="text-xs text-gray-400 text-center px-4">
              Attendance monitoring will activate automatically when the instructor starts the session.
            </p>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Waiting for session to begin…
          </p>
        </div>
      </Card>
    );
  }

  // ── Active state ────────────────────────────────────────────────────────────
  const statusColor =
    lastStatus === 'VERIFIED'   ? 'bg-green-500' :
    lastStatus === 'UNVERIFIED' ? 'bg-red-500'   :
    'bg-gray-400';

  const statusLabel =
    lastStatus === 'VERIFIED'   ? 'Verified' :
    lastStatus === 'UNVERIFIED' ? 'Unverified' :
    'Initialising…';

  const bracketColorClass =
    isFacePositioned === null
      ? 'text-red-500'
      : isFacePositioned
        ? 'text-green-500'
        : 'text-red-500';

  return (
    <Card className="shadow-sm">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Attendance Verification</h3>
          {isActive ? (
            <Badge className="bg-green-500 text-white text-xs gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Starting…
            </Badge>
          )}
        </div>

        {/* Hidden video for face-api processing */}
        <video ref={videoRef} autoPlay muted playsInline className="hidden" />

        {/* Visible camera preview */}
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
          {cameraReady ? (
            <video
              ref={previewRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]" // mirror effect
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
              <p className="text-xs text-gray-400">Accessing camera…</p>
            </div>
          )}

          {/* Face position bracket overlay */}
          {cameraReady && faceBox && (
            <div
              className={`absolute pointer-events-none ${bracketColorClass}`}
              style={{
                left: `${(1 - (faceBox.x + faceBox.width)) * 100}%`,
                top: `${faceBox.y * 100}%`,
                width: `${faceBox.width * 100}%`,
                height: `${faceBox.height * 100}%`,
              }}
            >
              <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-current rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-current rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-current rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-current rounded-br-sm" />
            </div>
          )}

          {/* Live status pill */}
          {cameraReady && (
            <div className={`absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-white text-xs font-medium ${statusColor}`}>
              {lastStatus === null        && <Loader2 className="h-3 w-3 animate-spin" />}
              {lastStatus === 'VERIFIED'  && <CheckCircle2 className="h-3 w-3" />}
              {lastStatus === 'UNVERIFIED'&& <AlertTriangle className="h-3 w-3" />}
              {statusLabel}
            </div>
          )}

          {/* Face alignment hint */}
          {cameraReady && (
            <div className="absolute top-2 left-2 right-2 flex justify-center">
              <div
                className={`px-2 py-1 rounded text-xs font-medium ${
                  isFacePositioned === null
                    ? 'bg-red-500/80 text-white'
                    : isFacePositioned
                      ? 'bg-green-500/80 text-white'
                      : 'bg-red-500/80 text-white'
                }`}
              >
                {isFacePositioned === null
                  ? 'Face not detected'
                  : isFacePositioned
                    ? 'Face position correct'
                    : 'Adjust face into center'}
              </div>
            </div>
          )}
        </div>

        {/* Strike buffer warning */}
        {strikeCount > 0 && strikeCount < 3 && (
          <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Retrying verification ({strikeCount}/3 attempts)…</span>
          </div>
        )}

        {/* Progress bar */}
        {totalLogged > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Verified intervals</span>
              <span className={`font-semibold ${verifiedPct >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {verifiedPct}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${verifiedPct >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${verifiedPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {verifiedCount}/{totalLogged} intervals verified
              {verifiedPct >= 75 ? ' · On track ✓' : ' · Below 75% threshold'}
            </p>
          </div>
        )}

        {/* First-run hint */}
        {totalLogged === 0 && isActive && (
          <p className="text-xs text-gray-500 text-center">
            First check in ~1 minute. Keep your face visible.
          </p>
        )}
      </div>
    </Card>
  );
}
