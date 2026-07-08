import type {
  Admin,
  AdminListResponse,
  CreateAdminRequest,
  PaginationMeta,
  UpdateAdminRequest,
  UpdateAdminStatusRequest,
} from './types'
import { apiRequest } from './client'

export async function listAdmins(page = 1, limit = 10): Promise<{ data: Admin[]; meta: PaginationMeta }> {
  const response = await apiRequest<AdminListResponse>(
    `/api/v1/admins?page=${page}&limit=${limit}`,
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

export async function getAdmin(id: number): Promise<Admin> {
  return apiRequest<Admin>(`/api/v1/admins/${id}`)
}

export async function createAdmin(body: CreateAdminRequest): Promise<Admin> {
  return apiRequest<Admin>('/api/v1/admins', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateAdmin(id: number, body: UpdateAdminRequest): Promise<Admin> {
  return apiRequest<Admin>(`/api/v1/admins/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function updateAdminStatus(id: number, body: UpdateAdminStatusRequest): Promise<Admin> {
  return apiRequest<Admin>(`/api/v1/admins/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function deleteAdmin(id: number): Promise<void> {
  await apiRequest<void>(`/api/v1/admins/${id}`, {
    method: 'DELETE',
  })
}
