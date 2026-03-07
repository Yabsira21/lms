'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, CheckCircle2, XCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { detectAndEmbed } from '@/lib/face-detection-client';

interface FaceRecognitionProps {
  classId?: string;
  onRecognized?: (userId: string, confidence: number) => void;
  recognitionInterval?: number; // Interval in milliseconds for recognition attempts
  autoStart?: boolean;
}

interface RecognitionStatus {
  recognized: boolean;
  userId?: string;
  confidence?: number;
  distance?: number;
  timestamp?: Date;
}

export default function FaceRecognition({
  classId,
  onRecognized,
  recognitionInterval = 2000, // Default: recognize every 2 seconds
  autoStart = false,
}: FaceRecognitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'active' | 'recognizing' | 'recognized' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start camera and recognition
  const startRecognition = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setStatus('active');
        setIsRecognizing(true);
        startRecognitionLoop();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      setStatus('error');
      toast.error('Failed to access camera');
    }
  };

  // Stop camera and recognition
  const stopRecognition = useCallback(() => {
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsRecognizing(false);
    setStatus('idle');
    setRecognitionStatus(null);
  }, []);

  // Recognition loop
  const startRecognitionLoop = () => {
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
    }

    recognitionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) {
        return;
      }

      await recognizeFace();
    }, recognitionInterval);
  };

  // Recognize face from current frame
  const recognizeFace = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    setStatus('recognizing');

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Detect face and generate embedding client-side
      const { embedding } = await detectAndEmbed(canvas);

      // Send embedding to API
      const formData = new FormData();
      formData.append('embedding', JSON.stringify(embedding));
      if (classId) {
        formData.append('classId', classId);
      }

      const response = await fetch('/api/face-recognition/recognize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to recognize face');
      }

      if (data.recognized && data.result) {
        const recognition: RecognitionStatus = {
          recognized: true,
          userId: data.result.userId,
          confidence: data.result.confidence,
          distance: data.result.distance,
          timestamp: new Date(),
        };

        setRecognitionStatus(recognition);
        setStatus('recognized');

        if (onRecognized) {
          onRecognized(data.result.userId, data.result.confidence);
        }

        toast.success(`Face recognized! Confidence: ${(data.result.confidence * 100).toFixed(1)}%`);
      } else {
        setRecognitionStatus({
          recognized: false,
          timestamp: new Date(),
        });
        setStatus('active');
      }
    } catch (error) {
      console.error('Error recognizing face:', error);
      // Don't show error for "no face detected" - just continue
      if (error instanceof Error && !error.message.includes('No face detected')) {
        setError(error.message);
        setStatus('error');
      } else {
        setStatus('active');
      }
    }
  };

  // Manual recognition trigger
  const handleManualRecognize = async () => {
    setIsLoading(true);
    await recognizeFace();
    setIsLoading(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Face Recognition</CardTitle>
        <CardDescription>
          Real-time face recognition for attendance tracking. Your face will be recognized automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {recognitionStatus?.recognized && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="flex items-center justify-between">
                <span>Face recognized successfully!</span>
                {recognitionStatus.confidence && (
                  <Badge variant="secondary" className="ml-2">
                    {(recognitionStatus.confidence * 100).toFixed(1)}% confidence
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ display: status !== 'idle' ? 'block' : 'none' }}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Camera className="w-16 h-16 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Click "Start Recognition" to begin
              </p>
            </div>
          )}

          {status === 'active' && (
            <div className="absolute top-4 left-4 right-4">
              <div className="p-2 rounded bg-blue-500 text-white text-sm text-center">
                ⏳ Looking for face and ready to recognize...
              </div>
            </div>
          )}

          {status === 'recognizing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Recognizing...</p>
              </div>
            </div>
          )}

          {status === 'recognized' && recognitionStatus?.recognized && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-500 text-white">
                <User className="w-3 h-3 mr-1" />
                Recognized
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          {status === 'idle' && (
            <Button
              onClick={startRecognition}
              disabled={isLoading}
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Recognition
            </Button>
          )}

          {status === 'active' && (
            <>
              <Button
                variant="outline"
                onClick={handleManualRecognize}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recognizing...
                  </>
                ) : (
                  'Recognize Now'
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={stopRecognition}
              >
                Stop
              </Button>
            </>
          )}

          {status === 'recognized' && (
            <Button
              onClick={() => {
                setStatus('active');
                setRecognitionStatus(null);
              }}
            >
              Continue Recognition
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
