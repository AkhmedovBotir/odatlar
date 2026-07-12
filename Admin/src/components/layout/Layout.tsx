import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Bosh sahifa'
  if (pathname.startsWith('/stats')) return 'Statistika'
  if (pathname.startsWith('/surveys/responses')) return "So'rovnoma javoblari"
  if (pathname.startsWith('/surveys')) return "So'rovnomalar"
  if (pathname.startsWith('/guides/videos')) return 'Qo\'llanmalar — Videolar'
  if (pathname.startsWith('/guides/courses')) return 'Qo\'llanmalar — Kurslar'
  if (pathname.startsWith('/guides/files')) return 'Qo\'llanmalar — Fayllar'
  if (pathname.startsWith('/notifications')) return 'Bildirishnomalar'
  if (pathname.startsWith('/bot')) return 'Telegram bot'
  if (pathname.startsWith('/xp')) return 'XP tizimi'
  if (pathname.startsWith('/admins')) return 'Adminlar'
  if (pathname.startsWith('/profile')) return 'Profil'
  return 'Admin panel'
}

export function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pageTitle = getPageTitle(location.pathname)

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <Header pageTitle={pageTitle} onMenuToggle={() => setSidebarOpen((open) => !open)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
