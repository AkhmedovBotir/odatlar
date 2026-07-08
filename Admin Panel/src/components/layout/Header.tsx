import { Bell, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../ui/Badge'

export function Header({ pageTitle }: { pageTitle: string }) {
  const { admin } = useAuth()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-md lg:px-8">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-700">
          Panel
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-4">
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
