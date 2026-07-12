import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function Alert({
  children,
  variant = 'error',
}: {
  children: ReactNode
  variant?: 'error' | 'success' | 'info'
}) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  }

  const Icon = variant === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
