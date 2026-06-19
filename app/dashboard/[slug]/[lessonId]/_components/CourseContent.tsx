"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useContructUrl } from "@/hooks/use-construct-url";
import {
  BookIcon,
  CheckCircle,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import { LessonChat } from "./LessonChat";

interface iAppProps {
  data: LessonContentType;
}

function formatTime(time: number) {
  if (!Number.isFinite(time)) return "0:00";

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function VideoPlayer({
  thumbnailKey,
  videoKey,
}: {
  thumbnailKey: string;
  videoKey: string;
}) {
  const videoUrl = useContructUrl(videoKey);
  const thumbnailUrl = useContructUrl(thumbnailKey);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  const progress = useMemo(() => {
    if (!duration || !Number.isFinite(duration)) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 2500);
  }, []);

  useEffect(() => {
    resetControlsTimeout();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  }, []);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isSeeking) return;
    setCurrentTime(video.currentTime);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    resetControlsTimeout();
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  const handleVolumeChange = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    const nextVolume = Math.max(0, Math.min(1, value));
    video.volume = nextVolume;
    video.muted = nextVolume === 0;

    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!nextMuted && video.volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = (value / 100) * duration;
    setCurrentTime(nextTime);
    video.currentTime = nextTime;
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.min(
      Math.max(0, video.currentTime + seconds),
      duration || video.currentTime + seconds,
    );
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          e.preventDefault();
          skipTime(5);
          break;
        case "arrowleft":
          e.preventDefault();
          skipTime(-5);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "j":
          e.preventDefault();
          skipTime(-10);
          break;
        case "l":
          e.preventDefault();
          skipTime(10);
          break;
      }
    },
    [togglePlay, duration],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!videoKey) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
        <BookIcon className="size-16 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          This lesson doesn't have video yet
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group aspect-video bg-black rounded-lg relative overflow-hidden shadow-2xl"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        className="w-full h-full object-cover bg-black"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onClick={togglePlay}
        playsInline
      />

      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition"
        >
          <div className="flex items-center justify-center size-20 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
            <Play className="size-10 text-white fill-white ml-1" />
          </div>
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pt-16 pb-3">
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progress}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={(e) => {
                const target = e.target as HTMLInputElement;
                handleSeek(Number(target.value));
                setIsSeeking(false);
              }}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => skipTime(-10)}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                <SkipBack className="size-5" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                {isPlaying ? (
                  <Pause className="size-5 fill-white" />
                ) : (
                  <Play className="size-5 fill-white" />
                )}
              </button>

              <button
                type="button"
                onClick={() => skipTime(10)}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                <SkipForward className="size-5" />
              </button>

              <div className="flex items-center gap-2 ml-1">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-white/10 transition"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="size-5" />
                  ) : (
                    <Volume2 className="size-5" />
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-24 accent-white cursor-pointer"
                />
              </div>

              <div className="text-sm tabular-nums ml-2 text-white/90">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSettings((prev) => !prev)}
                  className="p-2 rounded-full hover:bg-white/10 transition"
                >
                  <Settings className="size-5" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-12 right-0 w-40 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-md shadow-xl p-2">
                    <p className="text-xs text-white/60 px-2 py-1">
                      Playback speed
                    </p>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          playbackRate === rate
                            ? "bg-white/10 text-white"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        {rate === 1 ? "Normal" : `${rate}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                {isFullscreen ? (
                  <Minimize className="size-5" />
                ) : (
                  <Maximize className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseContent({ data }: iAppProps) {
  const [pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        markLessonComplete(data.id, data.chapter.course.slug),
      );

      if (error) {
        toast.error("Failed to create course");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col h-full bg-background pl-6">
      <VideoPlayer
        thumbnailKey={data.thumbnailKey ?? ""}
        videoKey={data.videoKey ?? ""}
      />

      <div className="py-4 border-b">
        {data.lessonProgress.length > 0 ? (
          <Button
            variant="outline"
            className="bg-green-500/10 text-green-500 hover:text-green-600"
          >
            <CheckCircle className="size-4 mr-2 text-green-500" />
            Completed
          </Button>
        ) : (
          <Button variant="outline" onClick={onSubmit} disabled={pending}>
            <CheckCircle className="size-4 mr-2 text-green-500" />
            Mark as Complete
          </Button>
        )}
      </div>

      <div className="space-y-3 pt-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {data.title}
        </h1>
        {data.description && (
          <RenderDescription json={JSON.parse(data.description)} />
        )}
      </div>

      <div className="lg:col-span-1">
        <LessonChat lessonId={data.id} />
      </div>
    </div>
  );
}
