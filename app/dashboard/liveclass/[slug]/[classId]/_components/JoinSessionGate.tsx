'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FaceRegistrationCard from '@/app/(public-facing)/profile/_components/FaceRegistrationCard';

interface JoinSessionGateProps {
  sessionId: string;
  userId: string;
  isInstructor: boolean;
}

export default function JoinSessionGate({
  sessionId,
  userId,
  isInstructor,
}: JoinSessionGateProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  const continueToSession = () => {
    router.push(`/session/${sessionId}`);
  };

  const checkAndJoin = async () => {
    if (isInstructor) {
      continueToSession();
      return;
    }

    try {
      setIsChecking(true);
      const response = await fetch('/api/face-recognition/check');
      if (!response.ok) {
        toast.error('Unable to verify face registration right now.');
        return;
      }
      const data = await response.json();
      if (data.hasRegistered) {
        continueToSession();
        return;
      }
      setShowRegistration(true);
    } catch (error) {
      console.error('Face registration pre-check failed:', error);
      toast.error('Unable to verify face registration right now.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <Button className="w-full" size="lg" onClick={checkAndJoin} disabled={isChecking}>
        <VideoIcon className="size-4 mr-2" />
        {isChecking
          ? 'Checking...'
          : isInstructor
            ? 'Start Live Session'
            : 'Join Live Session'}
      </Button>

      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Face Registration Required</DialogTitle>
            <DialogDescription>
              You need to register your face before joining this live session.
            </DialogDescription>
          </DialogHeader>

          <FaceRegistrationCard userId={userId} />

          <div className="flex justify-end">
            <Button onClick={checkAndJoin} disabled={isChecking}>
              {isChecking ? 'Checking...' : "Done, Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
