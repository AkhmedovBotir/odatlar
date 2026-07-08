import type { ApiErrorBody } from './types'
import { getToken, clearAuth, getStoredAdmin } from '../lib/storage'
import { appConfig } from '../config'

const API_BASE = appConfig.apiBaseUrl

export class ApiClientError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody
    return body.error ?? 'Noma\'lum xato'
  } catch {
    return 'Noma\'lum xato'
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401 && auth) {
    clearAuth()
  }

  if (res.status === 204) {
    return undefined as T
  }

  const contentType = res.headers.get('content-type')
  const hasJson = contentType?.includes('application/json')

  if (!res.ok) {
    const message = hasJson ? await parseErrorMessage(res) : 'Noma\'lum xato'
    throw new ApiClientError(res.status, message)
  }

  if (!hasJson) {
    return undefined as T
  }

  return (await res.json()) as T
}

export function getApiBase(): string {
  return API_BASE
}

export function getCurrentAdminFromStorage() {
  return getStoredAdmin()
}
