import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';
import type { GoodHabit, HabitHistoryEntry } from '@/lib/types';
import type { ServerXPAward } from '@/lib/xp';
import { daysAgoKey, todayKey } from '@/lib/habits';

const LOG_PREFIX = '[PracticesAPI]';

interface PracticeListResponse {
  data: GoodHabit[];
}

interface PracticeHistoryResponse {
  data: HabitHistoryEntry[];
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

export async function fetchPractices(): Promise<GoodHabit[]> {
  console.log(`${LOG_PREFIX} GET /practices`);
  const result = await request<PracticeListResponse>('/bot-runtime/practices');
  console.log(`${LOG_PREFIX} practices yuklandi`, result.data);
  return result.data;
}

export async function fetchPracticeHistory(
  from = daysAgoKey(29),
  to = todayKey()
): Promise<HabitHistoryEntry[]> {
  console.log(`${LOG_PREFIX} GET /practices/history`, { from, to });
  const result = await request<PracticeHistoryResponse>(
    `/bot-runtime/practices/history?from=${from}&to=${to}`
  );
  console.log(`${LOG_PREFIX} history yuklandi`, result.data.length);
  return result.data;
}

export async function createPractice(payload: {
  name: string;
  benefits: string[];
}): Promise<GoodHabit> {
  console.log(`${LOG_PREFIX} POST /practices`, payload);
  return request<GoodHabit>('/bot-runtime/practices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePractice(
  id: string,
  payload: { name: string; benefits: string[] }
): Promise<GoodHabit> {
  console.log(`${LOG_PREFIX} PUT /practices/${id}`, payload);
  return request<GoodHabit>(`/bot-runtime/practices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePractice(id: string): Promise<void> {
  console.log(`${LOG_PREFIX} DELETE /practices/${id}`);
  await request<void>(`/bot-runtime/practices/${id}`, { method: 'DELETE' });
}

export async function togglePractice(id: string): Promise<GoodHabit & ServerXPAward> {
  console.log(`${LOG_PREFIX} POST /practices/${id}/toggle`);
  return request<GoodHabit & ServerXPAward>(`/bot-runtime/practices/${id}/toggle`, {
    method: 'POST',
  });
}
