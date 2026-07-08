export const runtimeConfig = {
  botApiBase: process.env.NEXT_PUBLIC_BOT_API_BASE ?? 'http://localhost:8080/api/v1',
  botUsername: process.env.NEXT_PUBLIC_BOT_USERNAME ?? '',
} as const;
