import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Activity, Server, Users, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHealth } from '../api/health'
import type { HealthResponse } from '../api/types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export function DashboardPage() {
  const { admin } = useAuth()
  const [health, setHealth] = useState<HealthResponse | null>(null)

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null))
  }, [])

  const stats = [
    {
      label: 'API holati',
      value: health?.status === 'ok' ? 'Ishlayapti' : 'Noma\'lum',
      sub: 'Health check',
      icon: Server,
      color: health?.status === 'ok' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50',
      ok: health?.status === 'ok',
    },
    {
      label: 'Hisob holati',
      value: admin?.status === 'active' ? 'Faol' : 'Nofaol',
      sub: 'Sizning profilingiz',
      icon: Activity,
      color: admin?.status === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50',
      ok: admin?.status === 'active',
    },
    {
      label: 'Username',
      value: `@${admin?.username ?? '—'}`,
      sub: 'Tizim identifikatori',
      icon: UserCheck,
      color: 'text-blue-600 bg-blue-50',
      ok: true,
    },
    {
      label: 'Adminlar',
      value: 'Boshqaruv',
      sub: 'CRUD operatsiyalar',
      icon: Users,
      color: 'text-violet-600 bg-violet-50',
      ok: true,
    },
  ]

  return (
    <div>
      <PageHeader
        breadcrumb="Dashboard"
        title={`Salom, ${admin?.first_name}!`}
        description="Boshqaruv paneliga xush kelibsiz. Quyida tizim va hisobingiz haqida qisqa ma'lumot."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="!p-5">
              <div className="flex items-start justify-between">
                <div className={`rounded-lg p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span
                  className={`h-2 w-2 rounded-full ${stat.ok ? 'bg-emerald-400' : 'bg-amber-400'}`}
                />
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{stat.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Profil ma'lumotlari</h2>
            <dl className="divide-y divide-slate-100">
              <InfoRow label="To'liq ism" value={`${admin?.first_name} ${admin?.last_name}`} />
              <InfoRow label="Username" value={`@${admin?.username}`} />
              <InfoRow label="Telefon" value={admin?.phone ?? '—'} />
              <InfoRow
                label="Holat"
                value={
                  <Badge variant={admin?.status === 'active' ? 'success' : 'danger'}>
                    {admin?.status === 'active' ? 'Faol' : 'Nofaol'}
                  </Badge>
                }
              />
              <InfoRow
                label="Ro'yxatdan o'tgan"
                value={
                  admin?.created_at
                    ? new Date(admin.created_at).toLocaleDateString('uz', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'
                }
              />
            </dl>
            <Link
              to="/profile"
              className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Profilni tahrirlash &rarr;
            </Link>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Tezkor amallar</h2>
            <div className="grid gap-3">
              <QuickAction
                to="/bot"
                title="Telegram bot"
                desc="Token, start xabari va foydalanuvchilar"
              />
              <QuickAction
                to="/admins"
                title="Adminlar ro'yxati"
                desc="Barcha adminlarni ko'rish va boshqarish"
              />
              <QuickAction
                to="/profile"
                title="Profil sozlamalari"
                desc="Shaxsiy ma'lumotlarni yangilash"
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

function QuickAction({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/50"
    >
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <span className="text-slate-400">&rarr;</span>
    </Link>
  )
}
