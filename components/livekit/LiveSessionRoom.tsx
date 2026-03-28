'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  useLocalParticipant,
  useRoomContext,
  useParticipants,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Loader2 } from 'lucide-react';

interface LiveSessionRoomProps {
  roomName: string;
  participantName: string;
  children: (props: {
    isMuted: boolean;
    isCameraOff: boolean;
    isScreenSharing: boolean;
    toggleMute: () => Promise<void>;
    toggleCamera: () => Promise<void>;
    toggleScreenShare: () => Promise<void>;
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
  
  // Sync state with actual LiveKit state
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Update state when LiveKit state changes
  useEffect(() => {
    if (localParticipant) {
      setIsMuted(!localParticipant.isMicrophoneEnabled);
      setIsCameraOff(!localParticipant.isCameraEnabled);
      setIsScreenSharing(localParticipant.isScreenShareEnabled);
    }
  }, [localParticipant]);

  const toggleMute = async () => {
    if (localParticipant) {
      try {
        const newState = !localParticipant.isMicrophoneEnabled;
        await localParticipant.setMicrophoneEnabled(newState);
        setIsMuted(!newState);
      } catch (error) {
        console.error('Error toggling microphone:', error);
      }
    }
  };

  const toggleCamera = async () => {
    if (localParticipant) {
      try {
        const newState = !localParticipant.isCameraEnabled;
        await localParticipant.setCameraEnabled(newState);
        setIsCameraOff(!newState);
      } catch (error) {
        console.error('Error toggling camera:', error);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (localParticipant) {
      try {
        const newState = !localParticipant.isScreenShareEnabled;
        await localParticipant.setScreenShareEnabled(newState);
        setIsScreenSharing(newState);
      } catch (error) {
        console.error('Error toggling screen share:', error);
      }
    }
  };

  return (
    <>
      {/* Render audio automatically */}
      <RoomAudioRenderer />
      
      {children({
        isMuted,
        isCameraOff,
        isScreenSharing,
        toggleMute,
        toggleCamera,
        toggleScreenShare,
        isConnected: room.state === 'connected',
      })}
    </>
  );
}

export default function LiveSessionRoom({
  roomName,
  participantName,
  children,
  onDisconnect,
}: LiveSessionRoomProps) {
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
            Check your LiveKit configuration and try again.
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
      video={false}  // Start with camera off
      audio={false}  // Start with microphone muted
      token={token}
      serverUrl={serverUrl}
      connect={true}
      onDisconnected={onDisconnect}
    >
      <RoomContent>{children}</RoomContent>
    </LiveKitRoom>
  );
}
