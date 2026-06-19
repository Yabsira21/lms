'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  useLocalParticipant,
  useRoomContext,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Loader2 } from 'lucide-react';

interface CustomLiveKitRoomProps {
  roomName: string;
  participantName: string;
  children: (props: {
    isMuted: boolean;
    isCameraOff: boolean;
    toggleMute: () => void;
    toggleCamera: () => void;
    isConnected: boolean;
  }) => React.ReactNode;
  onDisconnect?: () => void;
}

function RoomContent({
  children,
}: {
  children: (props: any) => React.ReactNode;
}) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);

  const toggleMute = async () => {
    if (localParticipant) {
      const enabled = localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(!enabled);
      setIsMuted(enabled);
    }
  };

  const toggleCamera = async () => {
    if (localParticipant) {
      const enabled = localParticipant.isCameraEnabled;
      await localParticipant.setCameraEnabled(!enabled);
      setIsCameraOff(enabled);
    }
  };

  return (
    <>
      <RoomAudioRenderer />
      {children({
        isMuted,
        isCameraOff,
        toggleMute,
        toggleCamera,
        isConnected: room.state === 'connected',
      })}
    </>
  );
}

export default function CustomLiveKitRoom({
  roomName,
  participantName,
  children,
  onDisconnect,
}: CustomLiveKitRoomProps) {
  const [token, setToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const getToken = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomName,
            participantName,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get token');
        }

        const data = await response.json();
        setToken(data.token);
        setServerUrl(data.serverUrl);
      } catch (err) {
        console.error('Error getting token:', err);
        setError('Failed to connect to live session');
      } finally {
        setIsLoading(false);
      }
    };

    getToken();
  }, [roomName, participantName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Connecting to live session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center text-red-600">
          <p className="mb-2">{error}</p>
          <p className="text-sm text-gray-600">
            LiveKit is not configured. Using demo mode.
          </p>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return null;
  }

  return (
    <LiveKitRoom
      video={false}
      audio={false}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      onDisconnected={onDisconnect}
    >
      <RoomContent>{children}</RoomContent>
    </LiveKitRoom>
  );
}
