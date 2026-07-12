import type { HealthResponse } from './types'
import { apiRequest } from './client'

export async function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health', {}, false)
}
