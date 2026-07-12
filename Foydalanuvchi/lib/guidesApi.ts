import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';
import type { ExternalVideo, GuideVideoComment } from '@/lib/guide';

const LOG_PREFIX = '[GuidesAPI]';

interface GuideVideoListResponse {
  data: ExternalVideo[];
}

interface GuideVideoCommentListResponse {
  data: GuideVideoComment[];
}

interface GuideVideoLikeResponse {
  likedByMe: boolean;
  likesCount: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const initData = getTelegramInitData();
  if (!initData) {
    throw new Error('Telegram initData topilmadi');
  }

  const response = await fetch(`${runtimeConfig.botApiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed: ${response.status} ${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function hasTelegramSession(): boolean {
  return Boolean(getTelegramInitData());
}

function apiOrigin(): string {
  return runtimeConfig.botApiBase.replace(/\/api\/v1\/?$/, '');
}

function isApiRelativePath(path: string): boolean {
  return (
    path.startsWith('/api/') ||
    path.startsWith('/uploads/') ||
    path.startsWith('api/') ||
    path.startsWith('uploads/')
  );
}

/** Tashqi URL yoki `/api/v1/uploads/...` yo‘lini to‘liq media URL ga aylantiradi. */
export function resolveMediaUrl(path?: string): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    if (isApiRelativePath(trimmed)) {
      return `${apiOrigin()}${trimmed}`;
    }
    return trimmed;
  }

  return `${apiOrigin()}/${trimmed.replace(/^\/+/, '')}`;
}

function pickVideoSrc(item: ExternalVideo & Record<string, unknown>): string {
  const candidates = [item.src, item.url, item.video_url, item.videoUrl];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function pickPoster(item: ExternalVideo & Record<string, unknown>): string | undefined {
  const candidates = [item.poster, item.poster_url, item.posterUrl, item.thumbnail];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeVideo(item: ExternalVideo): ExternalVideo {
  const raw = item as ExternalVideo & Record<string, unknown>;
  const src = pickVideoSrc(raw);
  const poster = pickPoster(raw);

  return {
    ...item,
    src: resolveMediaUrl(src),
    poster: poster ? resolveMediaUrl(poster) : undefined,
    likesCount: item.likesCount ?? 0,
    commentsCount: item.commentsCount ?? 0,
    likedByMe: item.likedByMe ?? false,
  };
}

export async function fetchGuideVideos(): Promise<ExternalVideo[]> {
  console.log(`${LOG_PREFIX} GET /guides/videos`);
  const result = await request<GuideVideoListResponse>('/bot-runtime/guides/videos');
  return result.data.map(normalizeVideo);
}

export async function fetchGuideVideo(id: string): Promise<ExternalVideo> {
  console.log(`${LOG_PREFIX} GET /guides/videos/${id}`);
  const result = await request<ExternalVideo | { data: ExternalVideo }>(
    `/bot-runtime/guides/videos/${id}`
  );
  const item = 'data' in result && result.data ? result.data : result;
  return normalizeVideo(item);
}

export async function toggleGuideVideoLike(id: string): Promise<GuideVideoLikeResponse> {
  console.log(`${LOG_PREFIX} POST /guides/videos/${id}/like`);
  return request<GuideVideoLikeResponse>(`/bot-runtime/guides/videos/${id}/like`, {
    method: 'POST',
  });
}

export async function fetchGuideVideoComments(id: string): Promise<GuideVideoComment[]> {
  console.log(`${LOG_PREFIX} GET /guides/videos/${id}/comments`);
  const result = await request<GuideVideoCommentListResponse>(
    `/bot-runtime/guides/videos/${id}/comments`
  );
  return result.data;
}

export async function postGuideVideoComment(
  id: string,
  text: string
): Promise<GuideVideoComment> {
  console.log(`${LOG_PREFIX} POST /guides/videos/${id}/comments`);
  return request<GuideVideoComment>(`/bot-runtime/guides/videos/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
