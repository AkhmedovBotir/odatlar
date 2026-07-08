import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';
import type { ArchiveDayItem } from '@/lib/habits';

const LOG_PREFIX = '[ArchiveAPI]';

export interface ArchiveResponse {
  days: { date: string; items: ArchiveDayItem[] }[];
  completedCount: number;
  missedCount: number;
}

async function request<T>(path: string): Promise<T> {
  const initData = getTelegramInitData();
  if (!initData) {
    throw new Error('Telegram initData topilmadi');
  }

  const response = await fetch(`${runtimeConfig.botApiBase}${path}`, {
    headers: {
      'X-Telegram-Init-Data': initData,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

export type ArchiveKind = 'practice' | 'indicator';

export async function fetchArchive(
  kind: ArchiveKind,
  from: string,
  to: string
): Promise<ArchiveResponse> {
  const params = new URLSearchParams({ kind, from, to });
  console.log(`${LOG_PREFIX} GET /archive`, { kind, from, to });
  const result = await request<ArchiveResponse>(`/bot-runtime/archive?${params}`);
  console.log(`${LOG_PREFIX} arxiv yuklandi`, {
    days: result.days.length,
    completedCount: result.completedCount,
    missedCount: result.missedCount,
  });
  return result;
}
