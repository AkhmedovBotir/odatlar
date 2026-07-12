import type { AdminLeaderboardResponse, AdminStats } from './types'
import { apiRequest } from './client'

export async function getStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>('/api/v1/bot/stats')
}

export async function getLeaderboard(limit = 20): Promise<AdminLeaderboardResponse> {
  const params = new URLSearchParams({ limit: String(limit) })
  return apiRequest<AdminLeaderboardResponse>(`/api/v1/bot/leaderboard?${params}`)
}
