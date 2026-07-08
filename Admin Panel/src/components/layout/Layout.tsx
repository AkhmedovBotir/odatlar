import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const pageTitles: Record<string, string> = {
  '/': 'Bosh sahifa',
  '/bot': 'Telegram bot',
  '/admins': 'Adminlar',
  '/profile': 'Profil',
}

export function Layout() {
  const location = useLocation()
  const pageTitle = pageTitles[location.pathname] ?? 'Admin panel'

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header pageTitle={pageTitle} />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
