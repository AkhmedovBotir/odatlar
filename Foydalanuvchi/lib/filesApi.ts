import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';
import { resolveMediaUrl } from '@/lib/guidesApi';
import type { GuideFile } from '@/lib/guide';

const LOG_PREFIX = '[FilesAPI]';

interface GuideFileListResponse {
  data: GuideFile[];
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

  return (await response.json()) as T;
}

function normalizeFile(item: GuideFile): GuideFile {
  return {
    ...item,
    ext: item.ext?.toLowerCase() ?? '',
    sizeLabel: item.sizeLabel ?? '—',
    url: resolveMediaUrl(item.url),
  };
}

export async function fetchGuideFiles(): Promise<GuideFile[]> {
  console.log(`${LOG_PREFIX} GET /guides/files`);
  const result = await request<GuideFileListResponse>('/bot-runtime/guides/files');
  return result.data.map(normalizeFile);
}
