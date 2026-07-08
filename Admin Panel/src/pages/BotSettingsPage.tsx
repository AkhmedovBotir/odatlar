import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  Key,
  MessageSquare,
  Users,
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  getBotSettings,
  updateBotToken,
  deleteBotToken,
  updateBotSettings,
  listBotUsers,
  getBotUserById,
} from '../api/bot'
import type { BotSettings, BotStartSettings, BotUser } from '../api/types'
import { ApiClientError } from '../api/client'
import { Button, Input, PasswordInput, Toggle } from '../components/ui/Form'
import { RichTextEditor } from '../components/ui/RichTextEditor'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { TabNav } from '../components/ui/TabNav'
import { Modal } from '../components/ui/Modal'

type Tab = 'token' | 'start' | 'users'

const tabs: { id: Tab; label: string; icon: typeof Key; description: string }[] = [
  { id: 'token', label: 'Token', icon: Key, description: 'Bot autentifikatsiyasi' },
  { id: 'start', label: '/start', icon: MessageSquare, description: 'Xabar va tugma' },
  { id: 'users', label: 'Foydalanuvchilar', icon: Users, description: '/start bosganlar' },
]

export function BotSettingsPage() {
  const [settings, setSettings] = useState<BotSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('token')
  const [saving, setSaving] = useState(false)

  const [newToken, setNewToken] = useState('')
  const [start, setStart] = useState<BotStartSettings | null>(null)

  const [botUsers, setBotUsers] = useState<BotUser[]>([])
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<BotUser | null>(null)
  const [userModalLoading, setUserModalLoading] = useState(false)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getBotSettings()
      setSettings(data)
      setStart(data.start)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Yuklashda xato')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    setError('')
    try {
      const result = await listBotUsers(usersPage, 10, usersSearch)
      setBotUsers(result.data)
      setUsersTotal(result.meta.total)
      setUsersTotalPages(Math.max(1, Math.ceil(result.meta.total / result.meta.limit)))
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Foydalanuvchilarni yuklashda xato')
    } finally {
      setUsersLoading(false)
    }
  }, [usersPage, usersSearch])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab, loadUsers])

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleSaveToken(e: FormEvent) {
    e.preventDefault()
    if (!newToken.trim()) return
    setSaving(true)
    setError('')
    try {
      const token = await updateBotToken({ bot_token: newToken.trim() })
      setSettings((s) => (s ? { ...s, token } : s))
      setNewToken('')
      showSuccess('Bot token muvaffaqiyatli saqlandi')
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Saqlashda xato')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteToken() {
    if (!confirm('Bot tokenni o\'chirmoqchimisiz?')) return
    setSaving(true)
    setError('')
    try {
      await deleteBotToken()
      await loadSettings()
      showSuccess('Bot token o\'chirildi')
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'O\'chirishda xato')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveStart(e: FormEvent) {
    e.preventDefault()
    if (!start) return

    if (start.button.enabled && (!start.button.text.trim() || !start.button.web_app_url.trim())) {
      setError('Tugma yoqilganda matn va Web App URL majburiy')
      return
    }

    setSaving(true)
    setError('')
    try {
      const data = await updateBotSettings({ start })
      setSettings(data)
      setStart(data.start)
      showSuccess('/start sozlamalari saqlandi')
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Saqlashda xato')
    } finally {
      setSaving(false)
    }
  }

  function handleUsersSearch(e: FormEvent) {
    e.preventDefault()
    if (usersPage !== 1) {
      setUsersPage(1)
    } else {
      loadUsers()
    }
  }

  async function openUserModal(id: number) {
    setUserModalLoading(true)
    setError('')
    try {
      const user = await getBotUserById(id)
      setSelectedUser(user)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Foydalanuvchi ma\'lumotini olishda xato')
    } finally {
      setUserModalLoading(false)
    }
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
        breadcrumb="Telegram"
        title="Telegram bot"
        description={
          settings?.updated_at
            ? `Oxirgi yangilanish: ${new Date(settings.updated_at).toLocaleString('uz')}`
            : 'Token, start xabari va foydalanuvchilarni boshqaring'
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert variant="success">{success}</Alert>
        </div>
      )}

      <TabNav tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'token' && settings && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900">Joriy holat</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-slate-500">Token</dt>
                <dd>
                  <Badge variant={settings.token.has_token ? 'success' : 'neutral'}>
                    {settings.token.has_token ? 'Bor' : 'Yo\'q'}
                  </Badge>
                </dd>
              </div>
              {settings.token.has_token && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Maskalangan</dt>
                    <dd className="font-mono text-sm text-slate-700">
                      {settings.token.masked_token}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Bot username</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      @{settings.token.bot_username}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Holat</dt>
                    <dd>
                      <Badge variant={settings.token.is_active ? 'success' : 'danger'}>
                        {settings.token.is_active ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </dd>
                  </div>
                </>
              )}
            </dl>
            {settings.token.has_token && (
              <Button
                variant="danger"
                size="sm"
                className="mt-6"
                onClick={handleDeleteToken}
                disabled={saving}
              >
                <Trash2 className="h-4 w-4" />
                Tokenni o'chirish
              </Button>
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-base font-semibold text-slate-900">
              {settings.token.has_token ? 'Tokenni yangilash' : 'Token qo\'shish'}
            </h3>
            <form onSubmit={handleSaveToken} className="space-y-4">
              <PasswordInput
                label="Bot token"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
                hint="Telegram @BotFather dan olingan token"
                required
              />
              <Button type="submit" disabled={saving}>
                {saving ? 'Tekshirilmoqda...' : 'Saqlash'}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {activeTab === 'start' && start && (
        <Card>
          <form onSubmit={handleSaveStart} className="max-w-2xl space-y-4">
            <RichTextEditor
              label="Xabar matni"
              value={start.message}
              onChange={(html) => setStart({ ...start, message: html })}
              hint="Quill editor — matn HTML formatida saqlanadi"
            />

            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Web App tugmasi</h3>
              <Toggle
                label="Tugma yoqilgan"
                description="/start xabari ostida Web App tugmasi ko'rsatiladi"
                checked={start.button.enabled}
                onChange={(v) =>
                  setStart({
                    ...start,
                    button: { ...start.button, enabled: v },
                  })
                }
              />
              <Input
                label="Tugma matni"
                value={start.button.text}
                onChange={(e) =>
                  setStart({
                    ...start,
                    button: { ...start.button, text: e.target.value },
                  })
                }
                placeholder="🛒 Do'konni ochish"
                disabled={!start.button.enabled}
                required={start.button.enabled}
              />
              <Input
                label="Web App URL"
                value={start.button.web_app_url}
                onChange={(e) =>
                  setStart({
                    ...start,
                    button: { ...start.button, web_app_url: e.target.value },
                  })
                }
                placeholder="https://app.example.com"
                disabled={!start.button.enabled}
                required={start.button.enabled}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </form>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card padding={false}>
          <div className="border-b border-slate-100 px-5 py-4">
            <form onSubmit={handleUsersSearch} className="flex gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Qidirish (ism, username)..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <Button type="submit" variant="outline" size="sm">
                Qidirish
              </Button>
            </form>
            <p className="mt-2 text-xs text-slate-500">Jami: {usersTotal} ta foydalanuvchi</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Foydalanuvchi
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Telegram ID
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Telefon
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Til
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Premium
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Daraja / XP
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Oxirgi /start
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        Yuklanmoqda...
                      </div>
                    </td>
                  </tr>
                ) : botUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      Foydalanuvchilar topilmadi
                    </td>
                  </tr>
                ) : (
                  botUsers.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={`${user.first_name} avatar`}
                              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {user.first_name[0]}
                              {user.last_name?.[0] ?? ''}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {user.username ? `@${user.username}` : '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                        {user.telegram_id}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {user.phone || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="neutral">{user.language_code || '—'}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={user.is_premium ? 'success' : 'neutral'}>
                          {user.is_premium ? 'Ha' : 'Yo\'q'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="primary">{user.level}-daraja</Badge>
                          <span className="text-xs font-medium text-slate-600">
                            {user.xp.toLocaleString('uz')} XP
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {user.last_start_at
                          ? new Date(user.last_start_at).toLocaleString('uz')
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openUserModal(user.id)}
                        >
                          <Eye className="h-4 w-4" />
                          Ko'rish
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {usersTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-xs text-slate-500">
                Sahifa {usersPage} / {usersTotalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={usersPage <= 1}
                  onClick={() => setUsersPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={usersPage >= usersTotalPages}
                  onClick={() => setUsersPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {selectedUser && (
        <Modal
          title={`${selectedUser.first_name} ${selectedUser.last_name}`}
          onClose={() => setSelectedUser(null)}
          size="lg"
        >
          {userModalLoading ? (
            <div className="py-8 text-center text-slate-500">Yuklanmoqda...</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Telegram ID" value={String(selectedUser.telegram_id)} mono />
              <Info label="Username" value={selectedUser.username ? `@${selectedUser.username}` : '—'} />
              <Info label="Telefon" value={selectedUser.phone || '—'} />
              <Info label="Til" value={selectedUser.language_code || '—'} />
              <Info label="Bot user" value={selectedUser.is_bot ? 'Ha' : 'Yo\'q'} />
              <Info label="Premium" value={selectedUser.is_premium ? 'Ha' : 'Yo\'q'} />
              <Info label="Daraja" value={`${selectedUser.level}-daraja`} />
              <Info label="XP" value={`${selectedUser.xp.toLocaleString('uz')} XP`} />
              <Info
                label="Birinchi /start"
                value={selectedUser.started_at ? new Date(selectedUser.started_at).toLocaleString('uz') : '—'}
              />
              <Info
                label="Oxirgi /start"
                value={selectedUser.last_start_at ? new Date(selectedUser.last_start_at).toLocaleString('uz') : '—'}
              />
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-sm text-slate-900 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
    </div>
  )
}
