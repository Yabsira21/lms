'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera } from 'lucide-react';
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
      setIsRegistered(data.hasRegistered || false);
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
            Face Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Face registration status:</span>
            {isLoading ? (
              <Badge variant="secondary">Checking...</Badge>
            ) : isRegistered ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                Registered
              </Badge>
            ) : (
              <Badge variant="destructive">
                Not Registered
              </Badge>
            )}
          </div>

          {/* Face placeholder with frame */}
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Face silhouette */}
                <div className="h-32 w-32 rounded-full bg-background flex items-center justify-center border-2 border-muted-foreground/20">
                  <svg
                    className="h-20 w-20 text-muted-foreground/40"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                
                {/* Corner brackets for face detection frame */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-primary" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-primary" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-primary" />
              </div>
            </div>
            
            {/* Camera icon in top right */}
            <div className="absolute top-3 right-3">
              <div className="bg-background/80 backdrop-blur-sm rounded-full p-2">
                <Camera className="h-5 w-5 text-muted-foreground" />
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
              className={`flex-1 ${!isRegistered ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
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
