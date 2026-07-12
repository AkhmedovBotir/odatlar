import type {
  CreateGuideCourseRequest,
  GuideCourse,
  GuideCourseListResponse,
  UpdateGuideCourseRequest,
} from '../types/guideCourse'
import { apiRequest } from './client'

export async function listGuideCourses(): Promise<GuideCourse[]> {
  const res = await apiRequest<GuideCourseListResponse>('/api/v1/bot/guides/courses')
  return res.data
}

export async function getGuideCourse(id: string): Promise<GuideCourse> {
  const course = await apiRequest<GuideCourse>(`/api/v1/bot/guides/courses/${id}`)
  return {
    ...course,
    children: normalizeChildren(course.children),
  }
}

export async function createGuideCourse(body: CreateGuideCourseRequest): Promise<GuideCourse> {
  return apiRequest<GuideCourse>('/api/v1/bot/guides/courses', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateGuideCourse(
  id: string,
  body: UpdateGuideCourseRequest,
): Promise<GuideCourse> {
  return apiRequest<GuideCourse>(`/api/v1/bot/guides/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteGuideCourse(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/bot/guides/courses/${id}`, { method: 'DELETE' })
}

function normalizeChildren(children: GuideCourse['children']): GuideCourse['children'] {
  if (!children) return []
  if (typeof children === 'string') {
    try {
      return JSON.parse(children) as GuideCourse['children']
    } catch {
      return []
    }
  }
  return children
}
