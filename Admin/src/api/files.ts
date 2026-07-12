import type {
  CreateGuideFileRequest,
  GuideFile,
  GuideFileListResponse,
  GuideFileUploadResponse,
  UpdateGuideFileRequest,
} from './types'
import { apiRequest, apiUploadRequest } from './client'

export async function uploadGuideFile(file: File): Promise<GuideFileUploadResponse> {
  return apiUploadRequest<GuideFileUploadResponse>('/api/v1/bot/guides/upload/file', file)
}

export async function listGuideFiles(): Promise<GuideFile[]> {
  const res = await apiRequest<GuideFileListResponse>('/api/v1/bot/guides/files')
  return res.data
}

export async function getGuideFile(id: string): Promise<GuideFile> {
  return apiRequest<GuideFile>(`/api/v1/bot/guides/files/${id}`)
}

export async function createGuideFile(body: CreateGuideFileRequest): Promise<GuideFile> {
  return apiRequest<GuideFile>('/api/v1/bot/guides/files', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateGuideFile(id: string, body: UpdateGuideFileRequest): Promise<GuideFile> {
  return apiRequest<GuideFile>(`/api/v1/bot/guides/files/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteGuideFile(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/bot/guides/files/${id}`, { method: 'DELETE' })
}
