import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Admin, AdminLoginRequest } from '../api/types'
import { loginAdmin, getMe } from '../api/auth'
import { ApiClientError } from '../api/client'
import {
  clearAuth,
  getToken,
  getStoredAdmin,
  saveAuth,
} from '../lib/storage'

interface AuthContextValue {
  admin: Admin | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: AdminLoginRequest) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  updateAdmin: (admin: Admin) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(getStoredAdmin)
  const [isLoading, setIsLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setAdmin(null)
      setIsLoading(false)
      return
    }

    try {
      const profile = await getMe()
      setAdmin(profile)
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        clearAuth()
      }
      setAdmin(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = useCallback(async (credentials: AdminLoginRequest) => {
    const response = await loginAdmin(credentials)
    saveAuth(response.admin, response.token)
    setAdmin(response.admin)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setAdmin(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await getMe()
    setAdmin(profile)
    const token = getToken()
    if (token) {
      saveAuth(profile, token)
    }
  }, [])

  const updateAdmin = useCallback((next: Admin) => {
    setAdmin(next)
    const token = getToken()
    if (token) {
      saveAuth(next, token)
    }
  }, [])

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: !!admin,
      isLoading,
      login,
      logout,
      refreshProfile,
      updateAdmin,
    }),
    [admin, isLoading, login, logout, refreshProfile, updateAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak')
  return ctx
}
