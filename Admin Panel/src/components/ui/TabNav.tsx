import type { LucideIcon } from 'lucide-react'

export function TabNav<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon: LucideIcon; description?: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <nav className="flex overflow-x-auto" role="tablist">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`group relative flex min-w-0 flex-1 flex-col items-start gap-0.5 border-b-2 px-5 py-4 text-left transition sm:items-center sm:text-center ${
                isActive
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span
                className={`inline-flex items-center gap-2 text-sm font-semibold ${
                  isActive ? 'text-blue-700' : 'text-slate-600 group-hover:text-slate-900'
                }`}
              >
                <tab.icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {tab.label}
              </span>
              {tab.description && (
                <span
                  className={`hidden text-xs sm:block ${
                    isActive ? 'text-blue-600/70' : 'text-slate-400'
                  }`}
                >
                  {tab.description}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
