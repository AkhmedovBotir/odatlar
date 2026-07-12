import { ApiClientError } from '../api/client'

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}
