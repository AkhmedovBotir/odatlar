export const runtimeConfig = {
  botApiBase: process.env.NEXT_PUBLIC_BOT_API_BASE ?? 'https://api.milliycrm.uz/api/v1',
  botUsername: process.env.NEXT_PUBLIC_BOT_USERNAME ?? '',
} as const;
