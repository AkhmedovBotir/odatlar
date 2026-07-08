import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, UserCircle, LogOut, Shield, Bot, Trophy, BarChart3 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Bosh sahifa', end: true },
  { to: '/stats', icon: BarChart3, label: 'Statistika' },
  { to: '/bot', icon: Bot, label: 'Telegram bot' },
  { to: '/xp', icon: Trophy, label: 'XP tizimi' },
  { to: '/admins', icon: Users, label: 'Adminlar' },
  { to: '/profile', icon: UserCircle, label: 'Profil' },
]

export function Sidebar() {
  const { admin, logout } = useAuth()

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">Odatlar Bot</p>
          <p className="text-xs text-slate-400">Admin panel</p>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Menyu
        </p>
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-800 p-4">
        {admin && (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
              {admin.first_name[0]}
              {admin.last_name[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">
                {admin.first_name} {admin.last_name}
              </p>
              <p className="truncate text-xs text-slate-500">@{admin.username}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </button>
      </div>
    </aside>
  )
}
