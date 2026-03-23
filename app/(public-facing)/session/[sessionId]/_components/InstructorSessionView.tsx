'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Camera, 
  CameraOff,
  Mic, 
  MicOff,
  MonitorUp, 
  FileText,
  BarChart3,
  MessageSquare,
  Users,
  Pause,
  Play,
  Square,
  Volume2,
  Circle,
  Bell,
  Send,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Maximize,
  Minimize
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRealTimeAttendance } from '@/hooks/useRealTimeAttendance';
import { useRouter } from 'next/navigation';

const LiveSessionRoom = dynamic(
  () => import('@/components/livekit/LiveSessionRoom'),
  { ssr: false }
);

const VideoDisplay = dynamic(
  () => import('@/components/livekit/VideoDisplay'),
  { ssr: false }
);

interface InstructorSessionViewProps {
  session: any;
  user: any;
}

export default function InstructorSessionView({ session, user }: InstructorSessionViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Dr. Smith', time: '10:01 AM', text: "Welcome everyone! Today we'll cover neural networks.", isInstructor: true },
    { id: 2, sender: 'Alex Chen', time: '10:02 AM', text: 'Excited for this topic!', isInstructor: false },
    { id: 3, sender: 'Maria Garcia', time: '10:03 AM', text: 'Will we cover backpropagation today?', isInstructor: false },
    { id: 4, sender: 'Dr. Smith', time: '10:04 AM', text: "Yes, we'll get to backpropagation in the second half.", isInstructor: true }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [notifications] = useState([
    { id: 1, type: 'join', text: 'Alex Chen joined the session', time: '10:00 AM', icon: '👤' },
    { id: 2, type: 'join', text: 'Maria Garcia joined the session', time: '10:01 AM', icon: '👤' },
    { id: 3, type: 'warning', text: 'Face not detected for Sara Ahmed (3 attempts)', time: '10:05 AM', icon: '⚠️' }
  ]);

  // Session management state
  const [sessionStatus, setSessionStatus] = useState<'not-started' | 'ongoing' | 'paused' | 'ended'>('not-started');
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const roomName = `session-${session.id}`;
  const participantName = user.name || user.email;
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Timer effect
  useEffect(() => {
    if (sessionStatus === 'ongoing') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionStatus]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (videoContainerRef.current?.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Start session
  const handleStartSession = async () => {
    const actualStartTime = new Date().toISOString();
    setSessionStatus('ongoing');
    toast.success('Session started!');

    try {
      const response = await fetch(`/api/session/${session.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ongoing', actualStartTime })
      });
      if (!response.ok) {
        toast.error('Failed to update database, but session is running locally');
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // Pause session
  const handlePauseSession = async () => {
    setSessionStatus('paused');
    toast.info('Session paused');
    try {
      await fetch(`/api/session/${session.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Paused' })
      });
    } catch (err) {
      console.error('Error pausing session:', err);
    }
  };

  // Resume session
  const handleResumeSession = async () => {
    setSessionStatus('ongoing');
    toast.success('Session resumed');
    try {
      await fetch(`/api/session/${session.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ongoing' })
      });
    } catch (err) {
      console.error('Error resuming session:', err);
    }
  };

  // End session
  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session? This action cannot be undone.')) {
      return;
    }

    setIsEndingSession(true);
    setSessionStatus('ended');

    try {
      const response = await fetch(`/api/session/${session.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Completed',
          endTime: new Date().toISOString(),
          duration: elapsedTime
        })
      });

      if (response.ok) {
        toast.success('Session ended. Redirecting to attendance report…');
        setTimeout(() => {
          router.push(`/session/${session.id}/attendance`);
        }, 2000);
      } else {
        toast.error('Failed to end session in database');
        setSessionStatus('ongoing');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
      setSessionStatus('ongoing');
    } finally {
      setIsEndingSession(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: user.name,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        text: newMessage,
        isInstructor: true
      }]);
      setNewMessage('');
    }
  };

  return (
    <LiveSessionRoom
      roomName={roomName}
      participantName={participantName}
      onDisconnect={() => toast.info('Session ended')}
    >
      {(liveKitProps) => (
        <InstructorSessionContent
          session={session}
          user={user}
          messages={messages}
          setMessages={setMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          notifications={notifications}
          handleSendMessage={handleSendMessage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isExporting={isExporting}
          setIsExporting={setIsExporting}
          sessionStatus={sessionStatus}
          elapsedTime={elapsedTime}
          formatTime={formatTime}
          handleStartSession={handleStartSession}
          handlePauseSession={handlePauseSession}
          handleResumeSession={handleResumeSession}
          handleEndSession={handleEndSession}
          isEndingSession={isEndingSession}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          videoContainerRef={videoContainerRef}
          liveKitProps={liveKitProps}
        />
      )}
    </LiveSessionRoom>
  );
}

// Separate component that uses LiveKit context
function InstructorSessionContent({
  session,
  user,
  messages,
  setMessages,
  newMessage,
  setNewMessage,
  isRecording,
  setIsRecording,
  notifications,
  handleSendMessage,
  searchQuery,
  setSearchQuery,
  isExporting,
  setIsExporting,
  sessionStatus,
  elapsedTime,
  formatTime,
  handleStartSession,
  handlePauseSession,
  handleResumeSession,
  handleEndSession,
  isEndingSession,
  isFullscreen,
  toggleFullscreen,
  videoContainerRef,
  liveKitProps
}: any) {
  const { isMuted, isCameraOff, isScreenSharing, toggleMute, toggleCamera, toggleScreenShare, isConnected } = liveKitProps;

  // Real-time attendance tracking (without LiveKit participants for now)
  const {
    participants: attendanceParticipants,
    statistics,
    isLoading: isLoadingAttendance,
    refresh: refreshAttendance,
    exportAttendance,
    isConnected: isAttendanceConnected
  } = useRealTimeAttendance({
    classId: session.id,
    refreshInterval: 5000,
    enabled: true,
    liveKitParticipants: [] // Pass empty array for now, API will provide data
  });

  // Filter participants based on search
  const filteredParticipants = attendanceParticipants.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAttendance('csv');
      toast.success('Attendance exported successfully!');
    } catch (error) {
      toast.error('Failed to export attendance');
    } finally {
      setIsExporting(false);
    }
  };

  return (
        <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold">{session.Course.title}</h1>
                {sessionStatus === 'ongoing' && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white animate-pulse">
                    Live
                  </Badge>
                )}
                {sessionStatus === 'paused' && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                    Paused
                  </Badge>
                )}
                {sessionStatus === 'not-started' && (
                  <Badge variant="secondary">
                    Not Started
                  </Badge>
                )}
                {sessionStatus === 'ended' && (
                  <Badge variant="destructive">
                    Ended
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">Session: {session.title}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(elapsedTime)}
                </span>
                <span>📅 {new Date(session.startTime).toLocaleDateString()}</span>
                <span>🕐 {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sessionStatus === 'not-started' && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handleStartSession}
                >
                  <Play className="h-4 w-4" />
                  Start Session
                </Button>
              )}
              {sessionStatus === 'ongoing' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handlePauseSession}
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              {sessionStatus === 'paused' && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={handleResumeSession}
                >
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              )}
              {(sessionStatus === 'ongoing' || sessionStatus === 'paused') && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleEndSession}
                  disabled={isEndingSession}
                >
                  <Square className="h-4 w-4" />
                  {isEndingSession ? 'Ending...' : 'End Session'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-[280px_1fr_340px] gap-6">
          {/* Left Sidebar - Chat & Notifications */}
          <div className="space-y-4">
            {/* Live Chat */}
            <Card className="shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Live Chat</h3>
              </div>
              <div className="p-4">
                <div className="space-y-2 h-64 overflow-y-auto mb-3">
                  {messages.map((msg: any) => (
                    <div 
                      key={msg.id} 
                      className={`p-2 rounded text-sm ${
                        msg.isInstructor ? 'bg-orange-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-xs">{msg.sender}</div>
                      <div className="text-xs text-gray-500">{msg.time}</div>
                      <div className="mt-1 text-gray-700">{msg.text}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="text-sm h-9"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSendMessage}
                    className="bg-orange-500 hover:bg-orange-600 h-9 px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="shadow-sm">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500 text-white">
                    {notifications.length}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {notifications.map((notif: any) => (
                    <div 
                      key={notif.id} 
                      className={`p-2 rounded text-xs ${
                        notif.type === 'warning' 
                          ? 'bg-yellow-50 border border-yellow-200' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base">{notif.icon}</span>
                        <div className="flex-1">
                          <div className="text-gray-700">{notif.text}</div>
                          <div className="text-gray-500 mt-1">{notif.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content - Video/Screen Share */}
          <div className="space-y-4">
            {/* Video Area with Fullscreen Support */}
            <div 
              ref={videoContainerRef}
              className={`relative ${isFullscreen ? 'bg-black' : ''}`}
            >
              <Card className={`shadow-sm overflow-hidden ${isFullscreen ? 'border-0 rounded-none' : ''}`}>
                <div className={`bg-gray-800 relative ${isFullscreen ? 'h-screen' : 'aspect-video'}`}>
                  <VideoDisplay />
                  
                  {/* Fullscreen Toggle Button - Bottom Right */}
                  <button
                    onClick={toggleFullscreen}
                    className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-all z-10"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </button>

                  {/* Session Status Overlays */}
                  {sessionStatus === 'not-started' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                      <div className="text-center text-white">
                        <Play className="h-16 w-16 mx-auto mb-4 opacity-75" />
                        <p className="text-lg font-semibold mb-2">Session Not Started</p>
                        <p className="text-sm opacity-75">Click "Start Session" to begin</p>
                      </div>
                    </div>
                  )}
                  {sessionStatus === 'paused' && (
                    <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 z-10">
                      <Pause className="h-4 w-4" />
                      Session Paused
                    </div>
                  )}
                  {sessionStatus === 'ended' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                      <div className="text-center text-white">
                        <Square className="h-16 w-16 mx-auto mb-4 opacity-75" />
                        <p className="text-lg font-semibold mb-2">Session Ended</p>
                        <p className="text-sm opacity-75">Redirecting to summary...</p>
                      </div>
                    </div>
                  )}

                  {/* Floating Controls (Google Meet Style) - Only in Fullscreen */}
                  {isFullscreen && (
                    <>
                      {/* Bottom Center - Media Controls */}
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
                        <div className="bg-gray-900/95 backdrop-blur-sm rounded-full px-6 py-4 shadow-2xl">
                          <div className="flex items-center gap-4">
                            {/* Camera Control */}
                            <button
                              onClick={toggleCamera}
                              disabled={sessionStatus !== 'ongoing'}
                              className={`relative p-4 rounded-full transition-all ${
                                sessionStatus !== 'ongoing' 
                                  ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                                  : isCameraOff 
                                    ? 'bg-gray-700 hover:bg-gray-600' 
                                    : 'bg-blue-500 hover:bg-blue-600'
                              }`}
                              title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
                            >
                              {isCameraOff ? (
                                <CameraOff className="h-6 w-6 text-white" />
                              ) : (
                                <Camera className="h-6 w-6 text-white" />
                              )}
                            </button>

                            {/* Microphone Control */}
                            <button
                              onClick={toggleMute}
                              disabled={sessionStatus !== 'ongoing'}
                              className={`relative p-4 rounded-full transition-all ${
                                sessionStatus !== 'ongoing' 
                                  ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                                  : isMuted 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-green-500 hover:bg-green-600'
                              }`}
                              title={isMuted ? 'Unmute' : 'Mute'}
                            >
                              {isMuted ? (
                                <MicOff className="h-6 w-6 text-white" />
                              ) : (
                                <Mic className="h-6 w-6 text-white" />
                              )}
                            </button>

                            {/* Screen Share Control */}
                            <button
                              onClick={toggleScreenShare}
                              disabled={sessionStatus !== 'ongoing'}
                              className={`relative p-4 rounded-full transition-all ${
                                sessionStatus !== 'ongoing' 
                                  ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                                  : isScreenSharing 
                                    ? 'bg-purple-500 hover:bg-purple-600' 
                                    : 'bg-gray-700 hover:bg-gray-600'
                              }`}
                              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                            >
                              <MonitorUp className="h-6 w-6 text-white" />
                            </button>

                            {/* Record Control */}
                            <button
                              onClick={() => {
                                setIsRecording(!isRecording);
                                toast.success(isRecording ? 'Recording stopped' : 'Recording started');
                              }}
                              disabled={sessionStatus !== 'ongoing'}
                              className={`relative p-4 rounded-full transition-all ${
                                sessionStatus !== 'ongoing' 
                                  ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                                  : isRecording 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-gray-700 hover:bg-gray-600'
                              }`}
                              title={isRecording ? 'Stop recording' : 'Start recording'}
                            >
                              <Circle className={`h-6 w-6 text-white ${isRecording ? 'fill-white' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Top Left - Session Tools */}
                      <div className="absolute top-4 left-4 z-30">
                        <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 shadow-2xl">
                          <div className="flex flex-col gap-2">
                            <button 
                              className="p-2 hover:bg-gray-700 rounded transition-colors text-white"
                              disabled={sessionStatus !== 'ongoing'}
                              title="Presentation"
                            >
                              <FileText className="h-5 w-5" />
                            </button>
                            <button 
                              className="p-2 hover:bg-gray-700 rounded transition-colors text-white"
                              disabled={sessionStatus !== 'ongoing'}
                              title="Share Materials"
                            >
                              <FileText className="h-5 w-5" />
                            </button>
                            <button 
                              className="p-2 hover:bg-gray-700 rounded transition-colors text-white"
                              disabled={sessionStatus !== 'ongoing'}
                              title="Launch Poll"
                            >
                              <BarChart3 className="h-5 w-5" />
                            </button>
                            <button 
                              className="p-2 hover:bg-gray-700 rounded transition-colors text-white"
                              disabled={sessionStatus !== 'ongoing'}
                              title="Mute All"
                            >
                              <Volume2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Media Controls - Only show when NOT in fullscreen */}
            {!isFullscreen && (
              <Card className="shadow-sm">
                <div className="p-6">
                  <div className="flex items-center justify-center gap-3">
                  {/* Camera Control */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={toggleCamera}
                      disabled={sessionStatus !== 'ongoing'}
                      className={`relative p-4 rounded-full transition-all ${
                        sessionStatus !== 'ongoing' 
                          ? 'bg-gray-200 cursor-not-allowed opacity-50' 
                          : isCameraOff 
                            ? 'bg-gray-200 hover:bg-gray-300' 
                            : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {isCameraOff ? (
                        <CameraOff className={`h-6 w-6 ${sessionStatus !== 'ongoing' ? 'text-gray-400' : 'text-gray-700'}`} />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                      {!isCameraOff && sessionStatus === 'ongoing' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                    <span className="text-xs font-medium text-gray-700">
                      {isCameraOff ? 'Camera Off' : 'Camera On'}
                    </span>
                  </div>

                  {/* Microphone Control */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={toggleMute}
                      disabled={sessionStatus !== 'ongoing'}
                      className={`relative p-4 rounded-full transition-all ${
                        sessionStatus !== 'ongoing' 
                          ? 'bg-gray-200 cursor-not-allowed opacity-50' 
                          : isMuted 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {isMuted ? (
                        <MicOff className="h-6 w-6 text-white" />
                      ) : (
                        <Mic className="h-6 w-6 text-white" />
                      )}
                      {!isMuted && sessionStatus === 'ongoing' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </button>
                    <span className="text-xs font-medium text-gray-700">
                      {isMuted ? 'Muted' : 'Unmuted'}
                    </span>
                  </div>

                  {/* Screen Share Control */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={toggleScreenShare}
                      disabled={sessionStatus !== 'ongoing'}
                      className={`relative p-4 rounded-full transition-all ${
                        sessionStatus !== 'ongoing' 
                          ? 'bg-gray-200 cursor-not-allowed opacity-50' 
                          : isScreenSharing 
                            ? 'bg-purple-500 hover:bg-purple-600' 
                            : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      <MonitorUp className={`h-6 w-6 ${
                        sessionStatus !== 'ongoing' 
                          ? 'text-gray-400' 
                          : isScreenSharing 
                            ? 'text-white' 
                            : 'text-gray-700'
                      }`} />
                      {isScreenSharing && sessionStatus === 'ongoing' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </button>
                    <span className="text-xs font-medium text-gray-700">
                      {isScreenSharing ? 'Sharing' : 'Share Screen'}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-16 w-px bg-gray-300 mx-2" />

                  {/* Record Control */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => {
                        setIsRecording(!isRecording);
                        toast.success(isRecording ? 'Recording stopped' : 'Recording started');
                      }}
                      disabled={sessionStatus !== 'ongoing'}
                      className={`relative p-4 rounded-full transition-all ${
                        sessionStatus !== 'ongoing' 
                          ? 'bg-gray-200 cursor-not-allowed opacity-50' 
                          : isRecording 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      <Circle className={`h-6 w-6 ${
                        sessionStatus !== 'ongoing' 
                          ? 'text-gray-400' 
                          : isRecording 
                            ? 'text-white fill-white' 
                            : 'text-gray-700'
                      }`} />
                      {isRecording && sessionStatus === 'ongoing' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </button>
                    <span className="text-xs font-medium text-gray-700">
                      {isRecording ? 'Recording' : 'Record'}
                    </span>
                  </div>
                </div>
                
                {/* Status Text */}
                {sessionStatus !== 'ongoing' && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      {sessionStatus === 'not-started' && 'Start the session to enable controls'}
                      {sessionStatus === 'paused' && 'Session paused - controls disabled'}
                      {sessionStatus === 'ended' && 'Session ended'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
            )}

            {/* Session Tools - Only show when NOT in fullscreen */}
            {!isFullscreen && (
            <Card className="shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Session Tools</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start gap-2"
                    disabled={sessionStatus !== 'ongoing'}
                  >
                    <FileText className="h-4 w-4" />
                    Presentation
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start gap-2"
                    disabled={sessionStatus !== 'ongoing'}
                  >
                    <FileText className="h-4 w-4" />
                    Share Materials
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start gap-2"
                    disabled={sessionStatus !== 'ongoing'}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Launch Poll
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start gap-2"
                    disabled={sessionStatus !== 'ongoing'}
                  >
                    <Volume2 className="h-4 w-4" />
                    Mute All
                  </Button>
                </div>
              </div>
            </Card>
            )}
          </div>

          {/* Right Sidebar - Attendance */}
          <div className="space-y-4">
            {/* Attendance Summary */}
            <Card className="shadow-sm">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Attendance Summary</h3>
                  <div className="flex items-center gap-2">
                    {isAttendanceConnected ? (
                      <Badge className="bg-green-500 text-white gap-1">
                        <Wifi className="h-3 w-3" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <WifiOff className="h-3 w-3" />
                        Offline
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={refreshAttendance}
                    disabled={isLoadingAttendance}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingAttendance ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600"
                    onClick={() => window.open(`/session/${session.id}/attendance`, '_blank')}
                  >
                    <Users className="h-4 w-4" />
                    View Monitoring
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Attendance Rate</span>
                    <span className="font-semibold">{statistics.attendanceRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500" 
                      style={{ width: `${statistics.attendanceRate}%` }} 
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <Users className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                    <div className="text-2xl font-bold">{statistics.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">{statistics.present}</div>
                    <div className="text-xs text-gray-600">Present</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <Wifi className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">{statistics.online}</div>
                    <div className="text-xs text-gray-600">Online</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
                    <div className="text-2xl font-bold text-red-600">{statistics.absent}</div>
                    <div className="text-xs text-gray-600">Absent</div>
                  </div>
                </div>

                {/* Participants Header */}
                <div className="mb-3">
                  <h4 className="text-sm font-semibold mb-2">
                    Participants ({filteredParticipants.length})
                  </h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search students..." 
                      className="pl-9 h-9 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Participants List */}
                {isLoadingAttendance && filteredParticipants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Loading attendance...</p>
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No participants found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredParticipants.map((participant) => {
                      const initials = participant.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase();
                      
                      const statusColor = 
                        participant.status === 'present' ? 'bg-green-500' :
                        participant.status === 'checking' ? 'bg-yellow-500' :
                        'bg-red-500';
                      
                      const avatarColor = 
                        participant.verified ? 'bg-orange-500' : 
                        participant.isOnline ? 'bg-blue-500' : 
                        'bg-gray-400';

                      return (
                        <div 
                          key={participant.id} 
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors"
                        >
                          <div className="relative">
                            <div className={`h-9 w-9 rounded-full ${avatarColor} text-white flex items-center justify-center text-xs font-semibold flex-shrink-0`}>
                              {participant.image ? (
                                <img 
                                  src={participant.image} 
                                  alt={participant.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                initials
                              )}
                            </div>
                            {participant.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate flex items-center gap-1">
                              {participant.name}
                              {participant.isOnline && (
                                <Wifi className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} />
                              {participant.status === 'present' && `Present • ${Math.round(participant.confidence * 100)}%`}
                              {participant.status === 'checking' && 'Checking...'}
                              {participant.status === 'absent' && 'Absent'}
                            </div>
                          </div>
                          {participant.verified ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : participant.status === 'checking' ? (
                            <RefreshCw className="h-5 w-5 text-yellow-600 flex-shrink-0 animate-spin" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
