import type {
  CreateGuideVideoRequest,
  GuideUploadResponse,
  GuideVideo,
  GuideVideoListResponse,
  UpdateGuideVideoRequest,
} from './types'
import { apiRequest, apiUploadRequest, getApiBase } from './client'

export function resolveMediaUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  if (pathOrUrl.startsWith('/')) {
    return `${getApiBase()}${pathOrUrl}`
  }
  return pathOrUrl
}

export async function uploadGuidePoster(file: File): Promise<GuideUploadResponse> {
  return apiUploadRequest<GuideUploadResponse>('/api/v1/bot/guides/upload/poster', file)
}

export async function uploadGuideVideo(file: File): Promise<GuideUploadResponse> {
  return apiUploadRequest<GuideUploadResponse>('/api/v1/bot/guides/upload/video', file)
}

export async function listGuideVideos(): Promise<GuideVideo[]> {
  const res = await apiRequest<GuideVideoListResponse>('/api/v1/bot/guides/videos')
  return res.data
}

export async function getGuideVideo(id: string): Promise<GuideVideo> {
  return apiRequest<GuideVideo>(`/api/v1/bot/guides/videos/${id}`)
}

export async function createGuideVideo(body: CreateGuideVideoRequest): Promise<GuideVideo> {
  return apiRequest<GuideVideo>('/api/v1/bot/guides/videos', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateGuideVideo(
  id: string,
  body: UpdateGuideVideoRequest,
): Promise<GuideVideo> {
  return apiRequest<GuideVideo>(`/api/v1/bot/guides/videos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteGuideVideo(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/bot/guides/videos/${id}`, { method: 'DELETE' })
}
