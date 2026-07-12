'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock3, Heart, MessageCircle, PlayCircle, Send } from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import VideoPlayer from '@/components/qollanma/VideoPlayer';
import type { ExternalVideo, GuideVideoComment } from '@/lib/guide';
import {
  fetchGuideVideo,
  fetchGuideVideoComments,
  postGuideVideoComment,
  toggleGuideVideoLike,
} from '@/lib/guidesApi';

interface VideoDetailProps {
  videoId: string;
}

function formatCommentTime(value: string): string {
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function VideoDetail({ videoId }: VideoDetailProps) {
  const router = useRouter();
  const [video, setVideo] = useState<ExternalVideo | null>(null);
  const [comments, setComments] = useState<GuideVideoComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);

  const loadRemote = useCallback(async () => {
    setLoading(true);
    try {
      const [remoteVideo, remoteComments] = await Promise.all([
        fetchGuideVideo(videoId),
        fetchGuideVideoComments(videoId),
      ]);
      setVideo(remoteVideo);
      setComments(remoteComments);
    } catch (error) {
      console.error('[VideoDetail] video yuklash xatosi', error);
      router.replace('/qollanma');
    } finally {
      setLoading(false);
    }
  }, [videoId, router]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  const handleLike = async () => {
    if (!video || liking) return;
    setLiking(true);
    try {
      const result = await toggleGuideVideoLike(video.id);
      setVideo((prev) =>
        prev
          ? {
              ...prev,
              likedByMe: result.likedByMe,
              likesCount: result.likesCount,
            }
          : prev
      );
    } catch (error) {
      console.error('[VideoDetail] like xatosi', error);
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (event: FormEvent) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!video || !text || submitting) return;

    setSubmitting(true);
    try {
      const created = await postGuideVideoComment(video.id, text);
      setComments((prev) => [created, ...prev]);
      setCommentText('');
      setVideo((prev) =>
        prev
          ? {
              ...prev,
              commentsCount: (prev.commentsCount ?? 0) + 1,
            }
          : prev
      );
    } catch (error) {
      console.error('[VideoDetail] comment xatosi', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-800/50" />
      </PageContainer>
    );
  }

  if (!video) return null;

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-lg shadow-black/20"
      >
        <VideoPlayer src={video.src} poster={video.poster} />

        <div className="border-t border-slate-700/50 p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-violet-800/40 bg-violet-950/30 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-400">
              video
            </span>
            {video.durationMin ? (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                {video.durationMin} daqiqa
              </span>
            ) : null}
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-violet-950/50 ring-2 ring-violet-500/30">
              <PlayCircle className="h-5 w-5 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white md:text-2xl">{video.title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{video.description}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              disabled={liking}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                video.likedByMe
                  ? 'border-rose-500/40 bg-rose-950/30 text-rose-300'
                  : 'border-slate-700/60 bg-slate-800/60 text-slate-300 hover:border-rose-500/30 hover:text-rose-200'
              } disabled:opacity-50`}
            >
              <Heart className={`h-4 w-4 ${video.likedByMe ? 'fill-current' : ''}`} />
              {video.likesCount ?? 0}
            </button>
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-slate-300">
              <MessageCircle className="h-4 w-4" />
              {video.commentsCount ?? comments.length}
            </span>
          </div>
        </div>
      </motion.div>

      <section className="mt-5 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 md:p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
          Izohlar
        </h2>

        <form onSubmit={handleComment} className="mb-5 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Fikringizni yozing..."
            maxLength={2000}
            className="min-w-0 flex-1 rounded-xl border border-slate-700/60 bg-slate-800/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Yuborish
          </button>
        </form>

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">Hali izoh yo&apos;q. Birinchi bo&apos;lib yozing!</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-xl border px-3 py-3 ${
                  comment.isMine
                    ? 'border-violet-700/40 bg-violet-950/20'
                    : 'border-slate-700/50 bg-slate-800/40'
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{comment.authorName}</p>
                  <time className="text-[10px] text-slate-500">
                    {formatCommentTime(comment.createdAt)}
                  </time>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </PageContainer>
  );
}
