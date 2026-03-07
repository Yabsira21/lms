'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { detectAndEmbed } from '@/lib/face-detection-client';

interface RegisterFaceProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RegisterFace({ onSuccess, onCancel }: RegisterFaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'capturing' | 'registering' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setStatus('capturing');
        setMessage('Position your face in front of the camera, then click "Capture & Register".');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      setStatus('error');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Capture and register face
  const captureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera is not ready. Please start the camera first.');
      return;
    }

    setIsLoading(true);
    setStatus('registering');
    setMessage('Detecting face and generating embedding...');

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Detect face and generate embedding client-side
      setMessage('Detecting face...');
      const { embedding } = await detectAndEmbed(canvas);

      // Send embedding to API
      setMessage('Registering your face...');
      const formData = new FormData();
      formData.append('embedding', JSON.stringify(embedding));

      const response = await fetch('/api/face-recognition/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register face');
      }

      setStatus('success');
      setMessage('Face registered successfully!');
      stopCamera();
      toast.success('Face registered successfully!');

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error('Error registering face:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register face';
      setError(errorMessage);
      setStatus('error');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Register Your Face</CardTitle>
        <CardDescription>
          Register your face for attendance recognition. Ensure good lighting and face the camera directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status === 'success' && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {message}
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
                Click "Start Camera" to begin
              </p>
            </div>
          )}

          {status === 'registering' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>{message}</p>
              </div>
            </div>
          )}
        </div>

        {message && status !== 'success' && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              variant="outline"
              onClick={() => {
                stopCamera();
                onCancel();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}

          {status === 'idle' && (
            <Button
              onClick={startCamera}
              disabled={isLoading}
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          )}

          {status === 'capturing' && (
            <Button
              onClick={captureAndRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Capture & Register'
              )}
            </Button>
          )}

          {status === 'success' && (
            <Button onClick={onSuccess} variant="default">
              Done
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
