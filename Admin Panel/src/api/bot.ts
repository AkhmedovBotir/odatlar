import type {
  BotSettings,
  BotTokenInfo,
  BotUser,
  BotUserDetailsResponse,
  BotUserListResponse,
  PaginationMeta,
  UpdateBotSettingsRequest,
  UpdateBotTokenRequest,
} from './types'
import { apiRequest } from './client'

export async function getBotSettings(): Promise<BotSettings> {
  return apiRequest<BotSettings>('/api/v1/bot/settings')
}

export async function getBotToken(): Promise<BotTokenInfo> {
  return apiRequest<BotTokenInfo>('/api/v1/bot/token')
}

export async function updateBotToken(body: UpdateBotTokenRequest): Promise<BotTokenInfo> {
  return apiRequest<BotTokenInfo>('/api/v1/bot/token', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteBotToken(): Promise<void> {
  await apiRequest<void>('/api/v1/bot/token', { method: 'DELETE' })
}

export async function updateBotSettings(body: UpdateBotSettingsRequest): Promise<BotSettings> {
  return apiRequest<BotSettings>('/api/v1/bot/settings', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function listBotUsers(
  page = 1,
  limit = 10,
  search = '',
): Promise<{ data: BotUser[]; meta: PaginationMeta }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  if (search.trim()) params.set('search', search.trim())

  const response = await apiRequest<BotUserListResponse>(
    `/api/v1/bot/users?${params}`,
  )

  return {
    data: response.data,
    meta: {
      page: response.page,
      limit: response.limit,
      total: response.total,
    },
  }
}

export async function getBotUserById(id: number): Promise<BotUserDetailsResponse> {
  return apiRequest<BotUserDetailsResponse>(`/api/v1/bot/users/${id}`)
}
