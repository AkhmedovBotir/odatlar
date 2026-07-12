import type { Admin, AdminAuthResponse, AdminLoginRequest, AdminProfileResponse } from './types'
import { apiRequest } from './client'

export async function loginAdmin(credentials: AdminLoginRequest): Promise<AdminAuthResponse> {
  return apiRequest<AdminAuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }, false)
}

export async function getMe(): Promise<Admin> {
  const response = await apiRequest<AdminProfileResponse>('/api/v1/auth/profile')
  return response.admin
}
