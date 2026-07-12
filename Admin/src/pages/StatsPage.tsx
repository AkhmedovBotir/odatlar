import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  CheckCircle2,
  Crown,
  Flame,
  LineChart,
  Medal,
  Phone,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { getLeaderboard, getStats } from '../api/stats'
import type { AdminLeaderboardEntry, AdminStats } from '../api/types'
import { useSnackbar } from '../context/SnackbarContext'
import { getApiErrorMessage } from '../lib/apiMessage'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { TabNav } from '../components/ui/TabNav'
import { Button, Select } from '../components/ui/Form'

type Tab = 'users' | 'activity' | 'xp' | 'leaderboard'

const tabs: { id: Tab; label: string; icon: typeof Users; description: string }[] = [
  { id: 'users', label: 'Foydalanuvchilar', icon: Users, description: 'Ro\'yxat va faollik' },
  { id: 'activity', label: 'Faoliyat', icon: LineChart, description: 'Amaliyotlar va dominantalar' },
  { id: 'xp', label: 'XP tizimi', icon: Zap, description: 'Tajriba ballari' },
  { id: 'leaderboard', label: 'Reyting', icon: Crown, description: 'XP bo\'yicha top' },
]

const nf = new Intl.NumberFormat('uz')

function fmt(n: number): string {
  return nf.format(n)
}

function fmtFloat(n: number): string {
  return n.toLocaleString('uz', { maximumFractionDigits: 2 })
}

export function StatsPage() {
  const snackbar = useSnackbar()
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [leaders, setLeaders] = useState<AdminLeaderboardEntry[]>([])
  const [leadersTotal, setLeadersTotal] = useState(0)
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [leadersLoading, setLeadersLoading] = useState(false)

  const loadLeaders = useCallback(async (lim: number) => {
    setLeadersLoading(true)
    try {
      const res = await getLeaderboard(lim)
      setLeaders(res.data)
      setLeadersTotal(res.total)
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Reytingni yuklashda xato'))
    } finally {
      setLeadersLoading(false)
    }
  }, [])

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, leadersRes] = await Promise.all([getStats(), getLeaderboard(limit)])
      setStats(statsRes)
      setLeaders(leadersRes.data)
      setLeadersTotal(leadersRes.total)
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Statistikani yuklashda xato'))
    }
  }, [limit])

  useEffect(() => {
    setLoading(true)
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  async function handleRefresh() {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
  }

  function handleLimitChange(value: number) {
    setLimit(value)
    loadLeaders(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Analitika"
        title="Statistika va reyting"
        description={
          stats?.generated_at
            ? `Yangilangan: ${new Date(stats.generated_at).toLocaleString('uz')}`
            : 'Umumiy ko\'rsatkichlar va XP reytingi'
        }
        action={
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Yangilash
          </Button>
        }
      />

      <TabNav tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {stats && activeTab === 'users' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={Users}
            color="text-blue-600 bg-blue-50"
            label="Jami foydalanuvchi"
            value={fmt(stats.users.total)}
            delay={0}
          />
          <StatCard
            icon={UserPlus}
            color="text-emerald-600 bg-emerald-50"
            label="Bugun qo'shilgan"
            value={fmt(stats.users.new_today)}
            delay={0.03}
          />
          <StatCard
            icon={UserPlus}
            color="text-teal-600 bg-teal-50"
            label="Bu hafta qo'shilgan"
            value={fmt(stats.users.new_this_week)}
            delay={0.06}
          />
          <StatCard
            icon={Flame}
            color="text-orange-600 bg-orange-50"
            label="Bu hafta faol"
            value={fmt(stats.users.active_this_week)}
            delay={0.09}
          />
          <StatCard
            icon={Phone}
            color="text-violet-600 bg-violet-50"
            label="Telefon raqami bor"
            value={fmt(stats.users.with_phone)}
            delay={0.12}
          />
          <StatCard
            icon={Star}
            color="text-amber-600 bg-amber-50"
            label="Premium"
            value={fmt(stats.users.premium)}
            delay={0.15}
          />
        </div>
      )}

      {stats && activeTab === 'activity' && (
        <div className="grid gap-4 md:grid-cols-3">
          <ActivityCard
            icon={CheckCircle2}
            color="text-emerald-600 bg-emerald-50"
            title="Amaliyotlar"
            totalItems={stats.practices.total_items}
            totalEntries={stats.practices.total_entries}
            entriesToday={stats.practices.entries_today}
            entriesLabel="Bajarilishlar"
          />
          <ActivityCard
            icon={LineChart}
            color="text-blue-600 bg-blue-50"
            title="Indikatorlar"
            totalItems={stats.indicators.total_items}
            totalEntries={stats.indicators.total_entries}
            entriesToday={stats.indicators.entries_today}
            entriesLabel="Kiritishlar"
          />
          <ActivityCard
            icon={Target}
            color="text-violet-600 bg-violet-50"
            title="Dominantalar"
            totalItems={stats.dominants.total_items}
            totalEntries={stats.dominants.total_entries}
            entriesToday={stats.dominants.entries_today}
            entriesLabel="Sessiyalar"
          />
        </div>
      )}

      {stats && activeTab === 'xp' && (
        <Card>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <XpMetric icon={Sparkles} label="Jami XP" value={fmt(stats.xp.total_xp)} color="text-amber-600" />
            <XpMetric icon={TrendingUp} label="O'rtacha XP" value={fmtFloat(stats.xp.avg_xp)} color="text-blue-600" />
            <XpMetric icon={Award} label="Eng yuqori XP" value={fmt(stats.xp.max_xp)} color="text-emerald-600" />
            <XpMetric icon={Crown} label="Eng yuqori daraja" value={fmt(stats.xp.max_level)} color="text-violet-600" />
            <XpMetric icon={Medal} label="O'rtacha daraja" value={fmtFloat(stats.xp.avg_level)} color="text-teal-600" />
            <XpMetric icon={Zap} label="Daraja chegarasi (XP)" value={fmt(stats.xp.level_up_xp)} color="text-slate-600" />
          </div>
        </Card>
      )}

      {activeTab === 'leaderboard' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Jami foydalanuvchilar: <span className="font-semibold text-slate-900">{fmt(leadersTotal)}</span>
            </p>
            <div className="w-32">
              <Select value={limit} onChange={(e) => handleLimitChange(Number(e.target.value))}>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
                <option value={100}>Top 100</option>
              </Select>
            </div>
          </div>

          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Foydalanuvchi
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Telegram ID
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      XP
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Daraja
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                          Yuklanmoqda...
                        </div>
                      </td>
                    </tr>
                  ) : leaders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                        Hali reyting yo'q
                      </td>
                    </tr>
                  ) : (
                    leaders.map((entry) => (
                      <tr key={entry.bot_user_id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-3.5">
                          <RankBadge rank={entry.rank} />
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-900">{entry.name}</p>
                          <p className="text-xs text-slate-400">
                            {entry.username ? `@${entry.username}` : '—'}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                          {entry.telegram_id}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                          {fmt(entry.xp)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Badge variant="primary">{entry.level}-daraja</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
  delay = 0,
}: {
  icon: typeof Users
  color: string
  label: string
  value: string
  delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="!p-5">
        <div className={`inline-flex rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </Card>
    </motion.div>
  )
}

function ActivityCard({
  icon: Icon,
  color,
  title,
  totalItems,
  totalEntries,
  entriesToday,
  entriesLabel,
}: {
  icon: typeof Users
  color: string
  title: string
  totalItems: number
  totalEntries: number
  entriesToday: number
  entriesLabel: string
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <dl className="space-y-2.5">
        <MetricRow label="Jami soni" value={fmt(totalItems)} />
        <MetricRow label={entriesLabel} value={fmt(totalEntries)} />
        <MetricRow label="Bugun" value={fmt(entriesToday)} highlight />
      </dl>
    </Card>
  )
}

function MetricRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`text-sm font-semibold ${highlight ? 'text-emerald-600' : 'text-slate-900'}`}>
        {value}
      </dd>
    </div>
  )
}

function XpMetric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <Icon className={`h-6 w-6 shrink-0 ${color}`} />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }): ReactNode {
  const styles: Record<number, string> = {
    1: 'bg-amber-100 text-amber-700 ring-amber-500/30',
    2: 'bg-slate-200 text-slate-700 ring-slate-400/30',
    3: 'bg-orange-100 text-orange-700 ring-orange-500/30',
  }
  const style = styles[rank]
  if (style) {
    return (
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1 ring-inset ${style}`}
      >
        {rank}
      </span>
    )
  }
  return <span className="pl-2 text-sm font-medium text-slate-500">{rank}</span>
}
