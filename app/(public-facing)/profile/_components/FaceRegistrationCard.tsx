'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RegisterFace from '@/components/face-recognition/RegisterFace';

interface FaceRegistrationCardProps {
  userId: string;
}

export default function FaceRegistrationCard({ userId }: FaceRegistrationCardProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  useEffect(() => {
    checkRegistrationStatus();
  }, [userId]);

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/face-recognition/check');
      const data = await response.json();
      setIsRegistered(data.registered || false);
    } catch (error) {
      console.error('Error checking face registration status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSuccess = () => {
    setIsRegistered(true);
    setShowRegisterDialog(false);
    toast.success('Face registered successfully!');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Face Recognition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Face registration status:</span>
            {isLoading ? (
              <Badge variant="secondary">Checking...</Badge>
            ) : isRegistered ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Registered
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Registered
              </Badge>
            )}
          </div>

          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-background flex items-center justify-center">
                  <Camera className="h-16 w-16 text-muted-foreground" />
                </div>
                {/* Face detection frame overlay */}
                <div className="absolute inset-0 border-2 border-primary rounded-full opacity-50" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-16 h-1 bg-primary" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-16 h-1 bg-primary" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 h-16 w-1 bg-primary" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 h-16 w-1 bg-primary" />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            This face will be used for identity verification during online classes and attendance.
          </p>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowRegisterDialog(true)}
              variant={isRegistered ? "outline" : "default"}
              className="flex-1"
            >
              {isRegistered ? 'Update Face' : 'Register Face'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isRegistered ? 'Update Face Registration' : 'Register Your Face'}
            </DialogTitle>
            <DialogDescription>
              Position your face in front of the camera and ensure good lighting for best results.
            </DialogDescription>
          </DialogHeader>
          <RegisterFace
            onSuccess={handleRegisterSuccess}
            onCancel={() => setShowRegisterDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
