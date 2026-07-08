import type { Admin } from '../api/types'

const TOKEN_KEY = 'odatlar_token'
const ADMIN_KEY = 'odatlar_admin'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredAdmin(): Admin | null {
  const raw = localStorage.getItem(ADMIN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Admin
  } catch {
    return null
  }
}

export function saveAuth(admin: Admin, token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}
