import type { UpdateXPSettingsRequest, XPSettings } from './types'
import { apiRequest } from './client'

export async function getXpSettings(): Promise<XPSettings> {
  return apiRequest<XPSettings>('/api/v1/bot/xp-settings')
}

export async function updateXpSettings(body: UpdateXPSettingsRequest): Promise<XPSettings> {
  return apiRequest<XPSettings>('/api/v1/bot/xp-settings', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}
