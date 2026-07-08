import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';

const LOG_PREFIX = '[HabitSummaryAPI]';

export interface HabitWeekDay {
  date: string;
  label: string;
  rate: number;
  isToday: boolean;
}

export interface HabitSummary {
  completed: number;
  total: number;
  percent: number;
  week: HabitWeekDay[];
}

export type HabitSummaryKind = 'practice' | 'indicator';

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

export async function fetchHabitSummary(kind: HabitSummaryKind): Promise<HabitSummary> {
  console.log(`${LOG_PREFIX} GET /habits/summary`, { kind });
  const result = await request<HabitSummary>(`/bot-runtime/habits/summary?kind=${kind}`);
  console.log(`${LOG_PREFIX} summary yuklandi`, result);
  return result;
}
