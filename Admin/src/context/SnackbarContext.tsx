import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

type SnackbarVariant = 'success' | 'error' | 'info'

type SnackbarItem = {
  id: string
  message: string
  variant: SnackbarVariant
}

type SnackbarContextValue = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

const variantStyles: Record<
  SnackbarVariant,
  { container: string; icon: typeof CheckCircle2 }
> = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: CheckCircle2,
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900',
    icon: AlertCircle,
  },
  info: {
    container: 'border-blue-200 bg-blue-50 text-blue-900',
    icon: Info,
  },
}

function SnackbarToast({
  item,
  onClose,
}: {
  item: SnackbarItem
  onClose: (id: string) => void
}) {
  const style = variantStyles[item.variant]
  const Icon = style.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${style.container}`}
      role="status"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm leading-relaxed">{item.message}</p>
      <button
        type="button"
        onClick={() => onClose(item.id)}
        className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
        aria-label="Yopish"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackbarItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (message: string, variant: SnackbarVariant) => {
      const trimmed = message.trim()
      if (!trimmed) return

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setItems((prev) => [...prev.slice(-4), { id, message: trimmed, variant }])

      const timer = setTimeout(() => remove(id), 4000)
      timersRef.current.set(id, timer)
    },
    [remove],
  )

  const value = useMemo<SnackbarContextValue>(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
    }),
    [push],
  )

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(100vw-2rem,24rem)] flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <SnackbarToast key={item.id} item={item} onClose={remove} />
          ))}
        </AnimatePresence>
      </div>
    </SnackbarContext.Provider>
  )
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext)
  if (!ctx) {
    throw new Error('useSnackbar SnackbarProvider ichida ishlatilishi kerak')
  }
  return ctx
}
