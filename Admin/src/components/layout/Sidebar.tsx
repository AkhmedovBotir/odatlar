import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  LogOut,
  Shield,
  Bot,
  Trophy,
  BarChart3,
  BookOpen,
  Video,
  GraduationCap,
  FileText,
  Bell,
  ClipboardList,
  ChevronDown,
  X,
  Inbox,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

type NavItem = {
  to: string
  icon: typeof LayoutDashboard
  label: string
  end?: boolean
}

const mainNav: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Bosh sahifa', end: true },
  { to: '/stats', icon: BarChart3, label: 'Statistika' },
]

const contentNav: NavItem[] = [
  { to: '/surveys', icon: ClipboardList, label: "So'rovnomalar" },
  { to: '/surveys/responses', icon: Inbox, label: "So'rovnoma javoblari" },
]

const guideItems: NavItem[] = [
  { to: '/guides/videos', icon: Video, label: 'Videolar' },
  { to: '/guides/courses', icon: GraduationCap, label: 'Kurslar' },
  { to: '/guides/files', icon: FileText, label: 'Fayllar' },
]

const communicationNav: NavItem[] = [
  { to: '/notifications', icon: Bell, label: 'Bildirishnomalar' },
]

const settingsNav: NavItem[] = [
  { to: '/bot', icon: Bot, label: 'Telegram bot' },
  { to: '/xp', icon: Trophy, label: 'XP tizimi' },
]

const systemNav: NavItem[] = [
  { to: '/admins', icon: Users, label: 'Adminlar' },
  { to: '/profile', icon: UserCircle, label: 'Profil' },
]

function NavItemLink({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate: () => void
}) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
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
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 first:mt-0">
      {children}
    </p>
  )
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { admin, logout } = useAuth()
  const location = useLocation()
  const guidesActive = location.pathname.startsWith('/guides')
  const [guidesOpen, setGuidesOpen] = useState(guidesActive)

  useEffect(() => {
    if (guidesActive) setGuidesOpen(true)
  }, [guidesActive])

  function handleNavigate() {
    onClose()
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-slate-900 text-white transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">Odatlar Bot</p>
              <p className="text-xs text-slate-400">Admin panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 lg:hidden"
            aria-label="Menyuni yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <nav className="space-y-0.5">
            <SectionLabel>Umumiy</SectionLabel>
            {mainNav.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={handleNavigate} />
            ))}

            <SectionLabel>Kontent</SectionLabel>
            {contentNav.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={handleNavigate} />
            ))}

            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setGuidesOpen((o) => !o)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  guidesActive
                    ? 'bg-slate-800 text-slate-200'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">Qo&apos;llanmalar</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${guidesOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {guidesOpen && (
                <div className="mt-0.5 space-y-0.5 pl-3">
                  {guideItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={handleNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
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
                </div>
              )}
            </div>

            <SectionLabel>Bog&apos;lanish</SectionLabel>
            {communicationNav.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={handleNavigate} />
            ))}

            <SectionLabel>Sozlamalar</SectionLabel>
            {settingsNav.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={handleNavigate} />
            ))}

            <SectionLabel>Tizim</SectionLabel>
            {systemNav.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={handleNavigate} />
            ))}
          </nav>
        </div>

        <div className="shrink-0 border-t border-slate-800 p-4">
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
            onClick={() => {
              onClose()
              logout()
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>
    </>
  )
}
