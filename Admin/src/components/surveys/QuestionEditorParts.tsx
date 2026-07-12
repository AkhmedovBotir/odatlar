import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

export function EditorSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string
  description?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-slate-200 bg-white px-4 py-4">{children}</div>}
    </div>
  )
}

export function QuestionEditorShell({
  index,
  total,
  isSection,
  typeLabel,
  required,
  disabled,
  onMoveUp,
  onMoveDown,
  onDelete,
  header,
  children,
}: {
  index: number
  total: number
  isSection: boolean
  typeLabel: string
  required?: boolean
  disabled?: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  header: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border shadow-sm ${
        isSection ? 'border-violet-200 bg-violet-50/20' : 'border-slate-200 bg-white'
      }`}
    >
      <div
        className={`flex items-center gap-3 border-b px-4 py-3 ${
          isSection ? 'border-violet-100 bg-violet-50/60' : 'border-slate-100 bg-slate-50/80'
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
            isSection ? 'bg-violet-600 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{typeLabel}</p>
          {required && !isSection && (
            <p className="text-[10px] font-medium text-red-500">Majburiy savol</p>
          )}
        </div>
        {!disabled && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-white disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-white disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div className="space-y-5 p-5">
        {header}
        {children}
      </div>
    </div>
  )
}
