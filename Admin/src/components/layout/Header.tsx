import { Bell, ChevronRight, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../ui/Badge'

export function Header({
  pageTitle,
  onMenuToggle,
}: {
  pageTitle: string
  onMenuToggle: () => void
}) {
  const { admin } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label="Menyuni ochish"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hidden shrink-0 hover:text-slate-700 sm:inline">
            Panel
          </Link>
          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
          <span className="truncate font-medium text-slate-900">{pageTitle}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {admin?.first_name} {admin?.last_name}
            </p>
            <div className="flex items-center justify-end gap-1.5">
              <Badge variant={admin?.status === 'active' ? 'success' : 'danger'}>
                {admin?.status === 'active' ? 'Faol' : 'Nofaol'}
              </Badge>
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-sm">
            {admin?.first_name?.[0]}
            {admin?.last_name?.[0]}
          </div>
        </div>
      </div>
    </header>
  )
}
