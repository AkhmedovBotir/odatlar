import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';
import type { Dominant } from '@/lib/types';
import type { ServerXPAward } from '@/lib/xp';

const LOG_PREFIX = '[DominantsAPI]';

interface DominantListResponse {
  data: Dominant[];
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

function normalizeDominant(item: Dominant): Dominant {
  return {
    ...item,
    pros: item.pros ?? [],
    cons: item.cons ?? [],
    notes: item.notes ?? '',
    sessionsCompleted: item.sessionsCompleted ?? 0,
  };
}

export async function fetchDominants(): Promise<Dominant[]> {
  console.log(`${LOG_PREFIX} GET /dominants`);
  const result = await request<DominantListResponse>('/bot-runtime/dominants');
  console.log(`${LOG_PREFIX} dominants yuklandi`, result.data.length);
  return result.data.map(normalizeDominant);
}

export interface CreateDominantPayload {
  title: string;
  type: Dominant['type'];
  cue: string;
  reward: string;
  pros: string[];
  cons: string[];
  notes: string;
}

export async function createDominant(payload: CreateDominantPayload): Promise<Dominant & ServerXPAward> {
  console.log(`${LOG_PREFIX} POST /dominants`, payload);
  const result = await request<Dominant & ServerXPAward>('/bot-runtime/dominants', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeDominant(result);
}

export async function updateDominant(
  id: string,
  payload: { title: string; cue: string; reward: string }
): Promise<Dominant> {
  console.log(`${LOG_PREFIX} PUT /dominants/${id}`, payload);
  const result = await request<Dominant>(`/bot-runtime/dominants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return normalizeDominant(result);
}

export async function deleteDominant(id: string): Promise<void> {
  console.log(`${LOG_PREFIX} DELETE /dominants/${id}`);
  await request<void>(`/bot-runtime/dominants/${id}`, { method: 'DELETE' });
}

export interface CompleteSessionPayload {
  type: Dominant['type'];
  pros: string[];
  cons: string[];
  notes: string;
}

export async function completeDominantSession(
  id: string,
  payload: CompleteSessionPayload
): Promise<Dominant & ServerXPAward> {
  console.log(`${LOG_PREFIX} POST /dominants/${id}/session`, payload);
  const result = await request<Dominant & ServerXPAward>(`/bot-runtime/dominants/${id}/session`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeDominant(result);
}
