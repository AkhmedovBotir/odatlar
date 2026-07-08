import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';
import type { GoodHabit, HabitHistoryEntry } from '@/lib/types';
import type { ServerXPAward } from '@/lib/xp';
import { daysAgoKey, todayKey } from '@/lib/habits';

const LOG_PREFIX = '[IndicatorsAPI]';

interface IndicatorListResponse {
  data: GoodHabit[];
}

interface IndicatorHistoryResponse {
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

export async function fetchIndicators(): Promise<GoodHabit[]> {
  console.log(`${LOG_PREFIX} GET /indicators`);
  const result = await request<IndicatorListResponse>('/bot-runtime/indicators');
  console.log(`${LOG_PREFIX} indicators yuklandi`, result.data);
  return result.data.map((item) => ({
    ...item,
    kind: 'indicator' as const,
    completedToday: false,
    streak: 0,
    todayIndicatorValue: item.todayIndicatorValue ?? null,
  }));
}

export async function fetchIndicatorHistory(
  from = daysAgoKey(29),
  to = todayKey()
): Promise<HabitHistoryEntry[]> {
  console.log(`${LOG_PREFIX} GET /indicators/history`, { from, to });
  const result = await request<IndicatorHistoryResponse>(
    `/bot-runtime/indicators/history?from=${from}&to=${to}`
  );
  console.log(`${LOG_PREFIX} history yuklandi`, result.data.length);
  return result.data;
}

export async function createIndicator(payload: {
  name: string;
  benefits: string[];
}): Promise<GoodHabit> {
  console.log(`${LOG_PREFIX} POST /indicators`, payload);
  const created = await request<GoodHabit>('/bot-runtime/indicators', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    ...created,
    kind: 'indicator',
    completedToday: false,
    streak: 0,
    todayIndicatorValue: created.todayIndicatorValue ?? null,
  };
}

export async function updateIndicator(
  id: string,
  payload: { name: string; benefits: string[] }
): Promise<GoodHabit> {
  console.log(`${LOG_PREFIX} PUT /indicators/${id}`, payload);
  const updated = await request<GoodHabit>(`/bot-runtime/indicators/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return {
    ...updated,
    kind: 'indicator',
    completedToday: false,
    streak: 0,
    todayIndicatorValue: updated.todayIndicatorValue ?? null,
  };
}

export async function deleteIndicator(id: string): Promise<void> {
  console.log(`${LOG_PREFIX} DELETE /indicators/${id}`);
  await request<void>(`/bot-runtime/indicators/${id}`, { method: 'DELETE' });
}

export async function logIndicator(
  id: string,
  payload: { value_id: string; value_label: string; is_empty: boolean }
): Promise<GoodHabit & ServerXPAward> {
  console.log(`${LOG_PREFIX} POST /indicators/${id}/log`, payload);
  const updated = await request<GoodHabit & ServerXPAward>(`/bot-runtime/indicators/${id}/log`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    ...updated,
    kind: 'indicator',
    completedToday: false,
    streak: 0,
    todayIndicatorValue: updated.todayIndicatorValue ?? null,
  };
}
