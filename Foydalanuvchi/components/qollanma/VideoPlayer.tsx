'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  loadVideoPlaybackUrl,
  normalizeVideoSrc,
  revokeVideoPlaybackUrl,
} from '@/lib/videoMedia';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackUrlRef = useRef('');

  const [playbackUrl, setPlaybackUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  const resolvedPoster = poster ? normalizeVideoSrc(poster) : undefined;

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setPlaying(false);
    setHasStarted(false);
    setCurrentTime(0);
    setDuration(0);

    if (playbackUrlRef.current) {
      revokeVideoPlaybackUrl(playbackUrlRef.current);
      playbackUrlRef.current = '';
    }

    if (!src) {
      setPlaybackUrl('');
      setLoading(false);
      setError('Video manzili topilmadi');
      return;
    }

    loadVideoPlaybackUrl(src)
      .then((url) => {
        if (!active) {
          revokeVideoPlaybackUrl(url);
          return;
        }
        playbackUrlRef.current = url;
        setPlaybackUrl(url);
      })
      .catch((err) => {
        if (!active) return;
        console.error('[VideoPlayer] yuklash xatosi', err);
        setError('Videoni yuklab bo\'lmadi');
        setPlaybackUrl('');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (playbackUrlRef.current) {
        revokeVideoPlaybackUrl(playbackUrlRef.current);
        playbackUrlRef.current = '';
      }
    };
  }, [src]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;

    if (video.paused) {
      try {
        await video.play();
        setHasStarted(true);
        setPlaying(true);
        scheduleHideControls();
      } catch (err) {
        console.error('[VideoPlayer] play xatosi', err);
        setError('Videoni ijro etib bo\'lmadi');
      }
    } else {
      video.pause();
      setPlaying(false);
      setShowControls(true);
    }
  }, [playbackUrl, scheduleHideControls]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    revealControls();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (err) {
      console.error('[VideoPlayer] fullscreen xatosi', err);
    }
    revealControls();
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(duration)) return;
    video.currentTime = value;
    setCurrentTime(value);
    revealControls();
  };

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    loadVideoPlaybackUrl(src)
      .then((url) => {
        if (playbackUrlRef.current) revokeVideoPlaybackUrl(playbackUrlRef.current);
        playbackUrlRef.current = url;
        setPlaybackUrl(url);
      })
      .catch(() => setError('Videoni yuklab bo\'lmadi'))
      .finally(() => setLoading(false));
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`group relative aspect-video overflow-hidden bg-black ${className}`}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      onClick={() => {
        if (!loading && !error) togglePlay();
      }}
    >
      {playbackUrl ? (
        <video
          ref={videoRef}
          key={playbackUrl}
          className="h-full w-full object-contain"
          src={playbackUrl}
          poster={resolvedPoster}
          playsInline
          preload="metadata"
          autoPlay={autoPlay}
          muted={muted}
          onPlay={() => {
            setPlaying(true);
            setHasStarted(true);
            setError(null);
          }}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onProgress={(e) => {
            const video = e.currentTarget;
            if (video.buffered.length > 0) {
              setBuffered(video.buffered.end(video.buffered.length - 1));
            }
          }}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          onError={() => setError('Videoni ijro etib bo\'lmadi')}
        />
      ) : resolvedPoster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolvedPoster} alt="" className="h-full w-full object-cover opacity-70" />
      ) : null}

      {loading && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
          <Loader2 className="h-10 w-10 animate-spin text-violet-300" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              retryLoad();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <RotateCcw className="h-4 w-4" />
            Qayta urinish
          </button>
        </div>
      )}

      {!error && !playing && !loading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Ijro etish"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950/75 ring-2 ring-violet-400/60 transition-transform hover:scale-105">
            <Play className="ml-1 h-8 w-8 fill-white text-white" />
          </span>
        </button>
      )}

      {!error && playbackUrl && (
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-10 transition-opacity duration-200 ${
            showControls || !hasStarted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative mb-2 h-1.5 rounded-full bg-white/20">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/35"
              style={{ width: `${bufferProgress}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-violet-400"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Video vaqti"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
                aria-label={playing ? 'Pauza' : 'Ijro etish'}
              >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
                aria-label={muted ? 'Ovozni yoqish' : 'Ovozni o\'chirish'}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>

              <span className="text-xs font-medium tabular-nums text-slate-200">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
              aria-label={fullscreen ? 'Kichik ekran' : 'To\'liq ekran'}
            >
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
