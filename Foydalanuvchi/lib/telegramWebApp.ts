import { runtimeConfig } from '@/lib/runtimeConfig';

export interface TelegramUnsafeUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface BotUserProfile {
  id: number;
  telegram_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  language_code?: string;
  avatar_url?: string;
  is_bot?: boolean;
  is_premium?: boolean;
  xp?: number;
  level?: number;
  level_up_xp?: number;
  started_at?: string;
  last_start_at?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: TelegramUnsafeUser;
        };
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

const LOG_PREFIX = '[TelegramWebApp]';

function log(step: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`${LOG_PREFIX} ${step}`);
    return;
  }
  console.log(`${LOG_PREFIX} ${step}`, payload);
}

function parseTelegramUserFromInitData(raw?: string): TelegramUnsafeUser | null {
  if (!raw) return null;
  try {
    const params = new URLSearchParams(raw);
    const userRaw = params.get('user');
    if (!userRaw) return null;
    const user = JSON.parse(userRaw) as TelegramUnsafeUser;
    if (!user?.id) return null;
    return user;
  } catch {
    return null;
  }
}

export function getTelegramWebApp() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
}

export function getTelegramInitData(): string {
  const webApp = getTelegramWebApp();
  const fromSdk = webApp?.initData?.trim();
  if (fromSdk) return fromSdk;

  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('tgWebAppData')?.trim() ||
    params.get('initData')?.trim() ||
    ''
  );
}

export function getTelegramUser(): TelegramUnsafeUser | null {
  const webApp = getTelegramWebApp();
  return (
    webApp?.initDataUnsafe?.user ??
    parseTelegramUserFromInitData(webApp?.initData) ??
    parseTelegramUserFromInitData(getTelegramInitData()) ??
    null
  );
}

async function postWithInitData<T>(path: string): Promise<T> {
  const initData = getTelegramInitData();
  if (!initData) {
    throw new Error('Telegram initData topilmadi');
  }

  const response = await fetch(`${runtimeConfig.botApiBase}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

export async function initializeTelegramWebAppProfile(): Promise<{
  telegramUser: TelegramUnsafeUser | null;
  profile: BotUserProfile | null;
}> {
  const webApp = getTelegramWebApp();
  webApp?.ready?.();
  webApp?.expand?.();

  const telegramUser = getTelegramUser();
  const initData = getTelegramInitData();

  log('Mini App ochildi', {
    hasWebApp: Boolean(webApp),
    hasInitData: Boolean(initData),
    telegramUser,
  });

  if (!telegramUser?.id || !initData) {
    log('Telegram sessiyasi yo\'q — backend profil yuklanmaydi');
    return { telegramUser, profile: null };
  }

  try {
    log('POST /bot-runtime/webapp/open boshlandi');
    const opened = await postWithInitData<BotUserProfile>('/bot-runtime/webapp/open');
    log('POST /bot-runtime/webapp/open muvaffaqiyatli', opened);

    log('POST /bot-runtime/me boshlandi');
    const profile = await postWithInitData<BotUserProfile>('/bot-runtime/me');
    log('POST /bot-runtime/me muvaffaqiyatli', profile);

    return { telegramUser, profile };
  } catch (error) {
    console.error(`${LOG_PREFIX} Profil yuklash xatosi`, error);
    return { telegramUser, profile: null };
  }
}
