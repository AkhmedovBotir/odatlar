import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';
import { resolveMediaUrl } from '@/lib/guidesApi';

function apiOrigin(): string {
  return runtimeConfig.botApiBase.replace(/\/api\/v1\/?$/, '');
}

function isApiMediaUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/api/') || url.startsWith('/uploads/')) return true;
  try {
    const origin = apiOrigin();
    return url.startsWith(origin);
  } catch {
    return false;
  }
}

export function normalizeVideoSrc(raw?: string | null): string {
  if (!raw) return '';
  return resolveMediaUrl(raw);
}

export function guessVideoMimeType(src: string): string | undefined {
  const lower = src.split('?')[0]?.toLowerCase() ?? '';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.ogg') || lower.endsWith('.ogv')) return 'video/ogg';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  if (lower.endsWith('.mp4') || lower.endsWith('.m4v')) return 'video/mp4';
  return undefined;
}

/** API yoki auth talab qiladigan manbalarni blob URL ga aylantiradi. */
export async function loadVideoPlaybackUrl(src: string): Promise<string> {
  const resolved = normalizeVideoSrc(src);
  if (!resolved) return '';

  const initData = getTelegramInitData();
  const needsAuthFetch = Boolean(initData) && isApiMediaUrl(resolved);

  if (!needsAuthFetch) {
    return resolved;
  }

  const response = await fetch(resolved, {
    headers: {
      'X-Telegram-Init-Data': initData!,
    },
  });

  if (!response.ok) {
    throw new Error(`Video yuklanmadi: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export function revokeVideoPlaybackUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
