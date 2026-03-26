'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Hand, 
  LogOut,
  CheckCircle2,
  Send,
  Maximize,
  Minimize,
  Clock,
  Link2,
  ExternalLink,
  BarChart3,
  FileText,
  RefreshCw,
  Pen
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const ContinuousAttendanceWidget = dynamic(
  () => import('@/components/attendance/ContinuousAttendanceWidget'),
  { ssr: false }
);

const LiveSessionRoom = dynamic(
  () => import('@/components/livekit/LiveSessionRoom'),
  { ssr: false }
);

const VideoDisplay = dynamic(
  () => import('@/components/livekit/VideoDisplay'),
  { ssr: false }
);

const Whiteboard = dynamic(
  () => import('@/components/session-tools/Whiteboard'),
  { ssr: false }
);

// ─── Student Resources Tab ────────────────────────────────────────────────────
function StudentResourcesTab({ sessionId, sessionActive, instructorName }: {
  sessionId: string;
  sessionActive: boolean;
  instructorName: string;
}) {
  const [resources, setResources] = useState<{ id: string; title: string; fileUrl: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/materials`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchResources();
    if (!sessionActive) return;
    const interval = setInterval(fetchResources, 15_000); // poll every 15s
    return () => clearInterval(interval);
  }, [fetchResources, sessionActive]);

  if (loading && resources.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading materials…</span>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-xs text-gray-500">No materials shared yet.</p>
        <p className="text-xs text-gray-400">The instructor will share resources here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">Shared Materials ({resources.length})</p>
        <button onClick={fetchResources} className="text-gray-400 hover:text-gray-600">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
      {resources.map(r => (
        <a
          key={r.id}
          href={r.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
        >
          <div className="h-9 w-9 rounded bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Link2 className="h-4 w-4 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600 truncate">
              {r.title}
            </p>
            <p className="text-xs text-gray-500 truncate">Shared by {instructorName}</p>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-orange-500 flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}

// ─── Student Poll Widget ──────────────────────────────────────────────────────
function StudentPollWidget({ sessionId, userId, sessionActive }: {
  sessionId: string;
  userId: string;
  sessionActive: boolean;
}) {
  const [poll, setPoll] = useState<{
    id: string;
    question: string;
    options: string[];
    counts: Record<string, number>;
    totalVotes: number;
    myVote: string | null;
    active: boolean;
  } | null>(null);
  const [voting, setVoting] = useState(false);

  const fetchPoll = useCallback(async () => {
    try {
      const res = await fetch(`/api/session/${sessionId}/poll`);
      if (res.ok) {
        const data = await res.json();
        setPoll(data.poll);
      }
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    if (!sessionActive) return;
    fetchPoll();
    const interval = setInterval(fetchPoll, 5_000); // poll every 5s
    return () => clearInterval(interval);
  }, [fetchPoll, sessionActive]);

  const handleVote = async (option: string) => {
    if (!poll || poll.myVote || voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: option }),
      });
      if (res.ok) {
        toast.success('Vote submitted!');
        fetchPoll();
      }
    } finally {
      setVoting(false);
    }
  };

  if (!poll) return null;

  const maxVotes = Math.max(...Object.values(poll.counts), 1);

  return (
    <Card className="shadow-sm border-orange-200 bg-orange-50/50 mt-4">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold text-orange-700">Live Poll</span>
          <Badge className="bg-orange-500 text-white text-xs animate-pulse ml-auto">Active</Badge>
        </div>

        <p className="text-sm font-medium">{poll.question}</p>

        <div className="space-y-2">
          {poll.options.map(option => {
            const count = poll.counts[option] ?? 0;
            const pct = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0;
            const isMyVote = poll.myVote === option;
            const isLeading = count === maxVotes && count > 0;

            return (
              <button
                key={option}
                onClick={() => handleVote(option)}
                disabled={!!poll.myVote || voting}
                className={`w-full text-left rounded-lg border transition-all ${
                  isMyVote
                    ? 'border-orange-500 bg-orange-100'
                    : poll.myVote
                    ? 'border-gray-200 bg-white cursor-default'
                    : 'border-gray-200 bg-white hover:border-orange-400 hover:bg-orange-50 cursor-pointer'
                }`}
              >
                <div className="p-2.5 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={isMyVote ? 'font-semibold text-orange-700' : ''}>
                      {option} {isMyVote && '✓'}
                    </span>
                    {poll.myVote && (
                      <span className={`text-xs ${isLeading ? 'font-semibold text-orange-600' : 'text-gray-500'}`}>
                        {count} ({pct}%)
                      </span>
                    )}
                  </div>
                  {poll.myVote && (
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isLeading ? 'bg-orange-500' : 'bg-blue-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!poll.myVote && (
          <p className="text-xs text-gray-500 text-center">Tap an option to vote</p>
        )}
        {poll.myVote && (
          <p className="text-xs text-gray-500 text-center">{poll.totalVotes} total vote{poll.totalVotes !== 1 ? 's' : ''}</p>
        )}
      </div>
    </Card>
  );
}

interface StudentSessionViewProps {
  session: any;
  user: any;
}

export default function StudentSessionView({ session, user }: StudentSessionViewProps) {
  const router = useRouter();
  const [handRaised, setHandRaised] = useState(false);
  const [attendanceVerified, setAttendanceVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'not-started' | 'ongoing' | 'paused' | 'ended'>(() => {
    if (session.status === 'Ongoing')   return 'ongoing';
    if (session.status === 'Paused')    return 'paused';
    if (session.status === 'Completed' || session.status === 'Cancelled') return 'ended';
    return 'not-started';
  });
  const [elapsedTime, setElapsedTime] = useState<number>(() => {
    // Seed from actual start time if session is already ongoing
    if ((session.status === 'Ongoing' || session.status === 'Paused') && session.actualStartTime) {
      return Math.floor((Date.now() - new Date(session.actualStartTime).getTime()) / 1000);
    }
    return 0;
  });
  const [isLeaving, setIsLeaving] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const instructorName = session.liveClass?.instructor?.name ?? 'Instructor';
  const courseTitle = session.liveClass?.title ?? session.title;

  const [messages, setMessages] = useState([
    { id: 1, sender: instructorName, time: '8:40 PM', text: "Welcome everyone. We'll start in 5 mins." },
    { id: 2, sender: 'Maria Lopez', time: '8:45 PM', text: 'Will this be recorded?' },
    { id: 3, sender: 'Maria Lopez', time: '8:45 PM', text: 'Lect Slides - Week 6.pdf' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const roomName = `session-${session.id}`;
  const participantName = user.name || user.email;

  // Poll session status — syncs with instructor's Start / Pause / End actions
  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        const response = await fetch(`/api/session/${session.id}/status`);
        if (!response.ok) {
          console.error('[Student Poll] GET failed:', response.status);
          return;
        }
        const data = await response.json();
        console.log('[Student Poll] status:', data.status, '| actualStartTime:', data.actualStartTime);

        const map: Record<string, 'not-started' | 'ongoing' | 'paused' | 'ended'> = {
          Scheduled:  'not-started',
          Ongoing:    'ongoing',
          Paused:     'paused',
          Completed:  'ended',
          Cancelled:  'ended',
        };
        const newStatus = map[data.status] ?? 'not-started';

        setSessionStatus(prev => {
          // Sync elapsed time from actualStartTime when transitioning into 'ongoing'
          if (prev !== 'ongoing' && newStatus === 'ongoing' && data.actualStartTime) {
            setElapsedTime(Math.floor((Date.now() - new Date(data.actualStartTime).getTime()) / 1000));
          }
          // Show toast on state changes
          if (prev !== newStatus) {
            if (newStatus === 'ongoing')  toast.success('Session started!');
            if (newStatus === 'paused')   toast.info('Session paused by instructor');
            if (newStatus === 'ended') {
              toast.info('Session ended by instructor. Redirecting…');
              setTimeout(() => router.push('/dashboard'), 3000);
            }
          }
          return newStatus;
        });
      } catch (error) {
        console.error('Error checking session status:', error);
      }
    };

    checkSessionStatus();
    const interval = setInterval(checkSessionStatus, 5000);
    return () => clearInterval(interval);
  }, [session.id, router]);

  // Timer — only counts when session is 'ongoing', pauses on 'paused', resets on 'not-started'
  useEffect(() => {
    if (sessionStatus === 'ongoing') {
      timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (sessionStatus === 'not-started') setElapsedTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStatus]);

  // Format time as HH:MM:SS — shows dashes when session hasn't started
  const formatTime = (seconds: number) => {
    if (sessionStatus === 'not-started') return '--:--:--';
    const hrs  = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle leave session
  const handleLeaveSession = async () => {
    if (!confirm('Are you sure you want to leave this session?')) {
      return;
    }

    setIsLeaving(true);
    try {
      toast.info('Leaving session...');
      // Give time for toast to show
      setTimeout(() => {
        router.push(`/dashboard`);
      }, 1000);
    } catch (error) {
      console.error('Error leaving session:', error);
      toast.error('Failed to leave session');
    } finally {
      setIsLeaving(false);
    }
  };

  // Handle raise hand — notifies instructor via API
  const handleRaiseHand = async () => {
    const newRaised = !handRaised;
    setHandRaised(newRaised);
    try {
      await fetch(`/api/session/${session.id}/raise-hand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raised: newRaised, name: user.name }),
      });
    } catch (err) {
      console.error('[RaiseHand]', err);
    }
    if (newRaised) {
      toast.success('Hand raised — the instructor has been notified.');
    } else {
      toast.info('Hand lowered');
    }
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

  const handleFaceRecognized = async (userId: string, confidence: number) => {
    try {
      const response = await fetch('/api/attendance/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: session.id,
          confidence
        })
      });

      if (response.ok) {
        setAttendanceVerified(true);
        toast.success('Attendance verified!');
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        sender: user.name,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        text: newMessage
      }]);
      setNewMessage('');
    }
  };

  return (
    <LiveSessionRoom
      roomName={roomName}
      participantName={participantName}
      onDisconnect={() => toast.info('Disconnected from session')}
    >
      {({ isMuted, isCameraOff, isScreenSharing, toggleMute, toggleCamera, isConnected }) => (
        <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold mb-1">Live Class Session</h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Main Content */}
          <div className="space-y-4">
            {/* Course Info Bar */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-base font-semibold">
                      {courseTitle}
                    </h2>
                    {sessionStatus === 'ongoing' && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 text-xs animate-pulse">
                        LIVE
                      </Badge>
                    )}
                    {sessionStatus === 'paused' && (
                      <Badge className="bg-yellow-500 text-white px-2 py-0.5 text-xs">
                        PAUSED
                      </Badge>
                    )}
                    {sessionStatus === 'not-started' && (
                      <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                        Not Started
                      </Badge>
                    )}
                    {sessionStatus === 'ended' && (
                      <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                        Ended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Session: {session.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Instructor: {instructorName} • {new Date(session.startTime).toLocaleDateString()} • {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <Clock className="h-4 w-4" />
                    {formatTime(elapsedTime)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {sessionStatus === 'ongoing'     ? 'Session in progress' :
                     sessionStatus === 'paused'      ? 'Session paused' :
                     sessionStatus === 'not-started' ? 'Waiting to start' :
                     'Session ended'}
                  </span>
                </div>
              </div>
            </div>

            {/* Video Area with Fullscreen Support */}
            <div 
              ref={videoContainerRef}
              className={`relative ${isFullscreen ? 'bg-black' : ''}`}
            >
              <Card className={`overflow-hidden shadow-sm ${isFullscreen ? 'border-0 rounded-none' : ''}`}>
                <div className={`bg-black relative ${isFullscreen ? 'h-screen' : 'aspect-video'}`}>
                  {/* LiveKit Video Display */}
                  <VideoDisplay />

                  {/* Whiteboard overlay — appears when instructor opens whiteboard */}
                  {showWhiteboard && (
                    <Whiteboard
                      sessionId={session.id}
                      isInstructor={false}
                      onClose={() => setShowWhiteboard(false)}
                    />
                  )}

                  {/* Whiteboard notification button */}
                  {!showWhiteboard && sessionStatus === 'ongoing' && (
                    <button
                      onClick={() => setShowWhiteboard(true)}
                      className="absolute top-4 left-4 bg-orange-500/90 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10 transition-all"
                      title="View Whiteboard"
                    >
                      <Pen className="h-3.5 w-3.5" />
                      Whiteboard
                    </button>
                  )}
                  
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

                  {/* Floating Controls (Google Meet Style) - Only in Fullscreen */}
                  {isFullscreen && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
                      <div className="bg-gray-900/95 backdrop-blur-sm rounded-full px-6 py-4 shadow-2xl">
                        <div className="flex items-center gap-4">
                          {/* Microphone Control */}
                          <button
                            onClick={toggleMute}
                            className={`relative p-4 rounded-full transition-all ${
                              isMuted 
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

                          {/* Camera Control */}
                          <button
                            onClick={toggleCamera}
                            className={`relative p-4 rounded-full transition-all ${
                              isCameraOff 
                                ? 'bg-gray-700 hover:bg-gray-600' 
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
                          >
                            {isCameraOff ? (
                              <VideoOff className="h-6 w-6 text-white" />
                            ) : (
                              <Video className="h-6 w-6 text-white" />
                            )}
                          </button>

                          {/* Raise Hand Control */}
                          <button
                            onClick={handleRaiseHand}
                            className={`relative p-4 rounded-full transition-all ${
                              handRaised 
                                ? 'bg-orange-500 hover:bg-orange-600' 
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                            title={handRaised ? 'Lower hand' : 'Raise hand'}
                          >
                            <Hand className="h-6 w-6 text-white" />
                            {handRaised && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border-2 border-white animate-pulse" />
                            )}
                          </button>

                          {/* Leave Session Control */}
                          <button
                            onClick={handleLeaveSession}
                            disabled={isLeaving}
                            className="relative p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
                            title="Leave session"
                          >
                            <LogOut className="h-6 w-6 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
              
              {/* Controls - Only show when NOT in fullscreen */}
              {!isFullscreen && (
              <Card className="overflow-hidden shadow-sm mt-4">
              <div className="bg-white p-6">
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={toggleMute}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-200'} transition-colors`}>
                      {isMuted ? (
                        <MicOff className="h-6 w-6 text-white" />
                      ) : (
                        <Mic className="h-6 w-6 text-gray-700" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{isMuted ? 'Muted' : 'Unmute'}</span>
                  </button>
                  
                  <button
                    onClick={toggleCamera}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`p-4 rounded-full ${isCameraOff ? 'bg-gray-200' : 'bg-gray-200'} transition-colors`}>
                      {isCameraOff ? (
                        <VideoOff className="h-6 w-6 text-gray-700" />
                      ) : (
                        <Video className="h-6 w-6 text-gray-700" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{isCameraOff ? 'Camera On' : 'Stop Video'}</span>
                  </button>
                  
                  <button
                    onClick={handleRaiseHand}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`p-4 rounded-full ${handRaised ? 'bg-orange-500' : 'bg-gray-200'} transition-colors relative`}>
                      <Hand className={`h-6 w-6 ${handRaised ? 'text-white' : 'text-gray-700'}`} />
                      {handRaised && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      {handRaised ? 'Hand Raised' : 'Raise Hand'}
                      {handRaised && <span className="text-orange-500 ml-1">●</span>}
                    </span>
                  </button>
                  
                  <button
                    onClick={handleLeaveSession}
                    disabled={isLeaving}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="p-4 rounded-full bg-red-500 transition-colors disabled:opacity-50">
                      <LogOut className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">{isLeaving ? 'Leaving...' : 'Leave Session'}</span>
                  </button>
                </div>
              </div>
            </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* File Notification */}
            {/* <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Instructor shared a new file:</div>
              <div className="text-sm font-medium">Lecture Slides - Week 6.pdf</div>
            </div> */}

            {/* Attendance Verification - Continuous 1-min polling */}
            <ContinuousAttendanceWidget
              classId={session.id}
              userId={user.id}
              sessionActive={sessionStatus === 'ongoing'}
            />

            {/* Live Poll — appears automatically when instructor launches one */}
            <StudentPollWidget
              sessionId={session.id}
              userId={user.id}
              sessionActive={sessionStatus === 'ongoing'}
            />

            {/* Tabs */}
            <Card className="shadow-sm">
              <div className="border-b">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'chat'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveTab('participants')}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'participants'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Participants
                  </button>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'resources'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Resources
                  </button>
                </div>
              </div>

              <div className="p-4">
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-80">
                    {/* Chat messages area */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                      {messages.map((msg) => {
                        const isOwnMessage = msg.sender === user.name;
                        return (
                          <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                              {/* Sender name and time */}
                              <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-xs font-semibold text-gray-700">
                                  {msg.sender}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {msg.time}
                                </span>
                              </div>
                              {/* Message bubble */}
                              <div className={`rounded-2xl px-4 py-2 ${
                                isOwnMessage 
                                  ? 'bg-orange-500 text-white rounded-tr-sm' 
                                  : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                              }`}>
                                <p className="text-sm leading-relaxed break-words">
                                  {msg.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Input area */}
                    <div className="border-t pt-3">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                          />
                          {newMessage && (
                            <button
                              onClick={() => setNewMessage('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="bg-orange-500 hover:bg-orange-600 rounded-full h-10 w-10 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Press Enter to send
                      </p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'participants' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">10 participants</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Online
                      </Badge>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {[
                        { name: 'Dr. Smith', role: 'Instructor', status: 'presenting' },
                        { name: 'Maria Lopez', role: 'Student', status: 'online' },
                        { name: 'Alex Chen', role: 'Student', status: 'online' },
                        { name: 'Sarah Kim', role: 'Student', status: 'online' },
                        { name: 'James Wilson', role: 'Student', status: 'online' },
                        { name: 'Emily Brown', role: 'Student', status: 'online' },
                      ].map((participant, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
                          <div className="relative">
                            <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-semibold">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                              participant.status === 'presenting' ? 'bg-blue-500' : 'bg-green-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {participant.name}
                              {participant.role === 'Instructor' && (
                                <Badge variant="secondary" className="ml-2 text-xs">Host</Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {participant.status === 'presenting' ? 'Presenting' : 'Attending'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTab === 'resources' && (
                  <StudentResourcesTab sessionId={session.id} sessionActive={sessionStatus === 'ongoing'} instructorName={instructorName} />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
      )}
    </LiveSessionRoom>
  );
}
