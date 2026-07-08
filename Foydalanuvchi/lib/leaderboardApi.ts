import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';
import type { LeaderboardEntry } from '@/lib/types';

const LOG_PREFIX = '[LeaderboardAPI]';

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  current_user_rank: number;
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

export function hasTelegramSession(): boolean {
  return Boolean(getTelegramInitData());
}

function normalizeEntry(entry: LeaderboardEntry & { is_me?: boolean }): LeaderboardEntry {
  return {
    rank: entry.rank,
    name: entry.name,
    xp: entry.xp,
    level: entry.level,
    isMe: entry.is_me ?? entry.isMe,
  };
}

export async function fetchLeaderboard(limit = 20): Promise<LeaderboardResponse> {
  console.log(`${LOG_PREFIX} GET /leaderboard`, { limit });
  const result = await request<{
    data: Array<LeaderboardEntry & { is_me?: boolean }>;
    current_user_rank: number;
  }>(`/bot-runtime/leaderboard?limit=${limit}`);

  return {
    data: result.data.map(normalizeEntry),
    current_user_rank: result.current_user_rank,
  };
}
