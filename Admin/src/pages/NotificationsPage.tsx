import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  Bell,
  Send,
  Eye,
  Search,
  Users,
} from 'lucide-react'
import {
  listNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  sendNotification,
} from '../api/notifications'
import { listBotUsers } from '../api/bot'
import type { BotUser } from '../api/types'
import type {
  AdminNotification,
  CreateNotificationRequest,
  NotificationTarget,
  NotificationType,
  UpdateNotificationRequest,
} from '../types/notification'
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
  defaultPayload,
  parsePayload,
} from '../types/notification'
import { useSnackbar } from '../context/SnackbarContext'
import { getApiErrorMessage } from '../lib/apiMessage'
import { NotificationPayloadForm } from '../components/notifications/NotificationPayloadForm'
import { Button, Input, Textarea, Select } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

type FormMode = 'create' | 'edit' | 'view' | null

type NotifForm = {
  type: NotificationType
  title: string
  preview: string
  target: NotificationTarget
  target_user_ids: number[]
  payload: Record<string, unknown>
}

function emptyForm(): NotifForm {
  return {
    type: 'tizim',
    title: '',
    preview: '',
    target: 'all',
    target_user_ids: [],
    payload: defaultPayload('tizim'),
  }
}

function toForm(n: AdminNotification): NotifForm {
  return {
    type: n.type,
    title: n.title,
    preview: n.preview ?? '',
    target: n.target ?? 'all',
    target_user_ids: n.targetUserIds ?? [],
    payload: parsePayload(n.payload),
  }
}

function toRequest(form: NotifForm): CreateNotificationRequest | UpdateNotificationRequest {
  return {
    type: form.type,
    title: form.title.trim(),
    preview: form.preview.trim() || undefined,
    payload: form.payload,
    target: form.target,
    target_user_ids: form.target === 'selected' ? form.target_user_ids : undefined,
  }
}

export function NotificationsPage() {
  const snackbar = useSnackbar()
  const [items, setItems] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)

  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<NotifForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  const [sendId, setSendId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [users, setUsers] = useState<BotUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await listNotifications())
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Yuklashda xato'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  async function loadUsers() {
    setUsersLoading(true)
    try {
      const res = await listBotUsers(1, 100, userSearch)
      setUsers(res.data)
    } catch {
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (formMode && form.target === 'selected') {
      loadUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMode, form.target, userSearch])

  function openCreate() {
    setForm(emptyForm())
    setEditingId(null)
    setFormMode('create')
    setUserSearch('')
  }

  function openEdit(n: AdminNotification) {
    setForm(toForm(n))
    setEditingId(n.id)
    setFormMode('edit')
    setUserSearch('')
  }

  function openView(n: AdminNotification) {
    setForm(toForm(n))
    setEditingId(n.id)
    setFormMode('view')
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setForm(emptyForm())
    setUserSearch('')
  }

  function handleTypeChange(type: NotificationType) {
    setForm((f) => ({ ...f, type, payload: defaultPayload(type) }))
  }

  function toggleUser(id: number) {
    setForm((f) => ({
      ...f,
      target_user_ids: f.target_user_ids.includes(id)
        ? f.target_user_ids.filter((x) => x !== id)
        : [...f.target_user_ids, id],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      snackbar.error('Sarlavha majburiy')
      return
    }
    if (form.target === 'selected' && form.target_user_ids.length === 0) {
      snackbar.error('Kamida bitta foydalanuvchi tanlang')
      return
    }

    setSaving(true)
    try {
      if (formMode === 'create') {
        await createNotification(toRequest(form) as CreateNotificationRequest)
        snackbar.success('Draft yaratildi')
      } else if (formMode === 'edit' && editingId) {
        await updateNotification(editingId, toRequest(form) as UpdateNotificationRequest)
        snackbar.success('Draft yangilandi')
      }
      closeForm()
      await fetchItems()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Saqlashda xato'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSend() {
    if (!sendId) return
    setSending(true)
    try {
      await sendNotification(sendId)
      setSendId(null)
      snackbar.success('Bildirishnoma yuborildi')
      await fetchItems()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Yuborishda xato'))
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteNotification(deleteId)
      setDeleteId(null)
      snackbar.success('Draft o\'chirildi')
      await fetchItems()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'O\'chirishda xato'))
    } finally {
      setDeleting(false)
    }
  }

  const isReadonly = formMode === 'view'

  return (
    <div>
      <PageHeader
        breadcrumb="Bog'lanish"
        title="Bildirishnomalar"
        description="Draft yaratish va foydalanuvchilarga yuborish"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Yangi draft
          </Button>
        }
      />

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Bildirishnoma
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tur
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Maqsad
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Holat
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Yetkazildi
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Yuklanmoqda...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    Hali bildirishnomalar yo'q
                  </td>
                </tr>
              ) : (
                items.map((n) => (
                  <tr key={n.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{n.title}</p>
                      {n.preview && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{n.preview}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="primary">{NOTIFICATION_TYPE_LABELS[n.type]}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {n.target === 'selected'
                        ? `Tanlangan (${n.targetUserIds?.length ?? 0})`
                        : 'Barchasi'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={n.status === 'sent' ? 'success' : 'neutral'}>
                        {n.status === 'sent' ? 'Yuborilgan' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {n.status === 'sent' ? (n.deliveryCount ?? 0) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        {n.status === 'draft' ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(n)}
                              title="Tahrirlash"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSendId(n.id)}
                              title="Yuborish"
                            >
                              <Send className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteId(n.id)}
                              title="O'chirish"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openView(n)}
                            title="Ko'rish"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {formMode && (
          <Modal
            title={
              formMode === 'create'
                ? 'Yangi draft'
                : formMode === 'edit'
                  ? 'Draftni tahrirlash'
                  : 'Bildirishnoma'
            }
            onClose={closeForm}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Tur"
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value as NotificationType)}
                disabled={isReadonly}
              >
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {NOTIFICATION_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>

              <Input
                label="Sarlavha"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                disabled={isReadonly}
              />

              <Textarea
                label="Qisqa matn (preview)"
                value={form.preview}
                onChange={(e) => setForm({ ...form, preview: e.target.value })}
                rows={2}
                disabled={isReadonly}
              />

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Payload</p>
                <NotificationPayloadForm
                  type={form.type}
                  payload={form.payload}
                  onChange={(payload) => setForm({ ...form, payload })}
                  disabled={isReadonly}
                />
              </div>

              {!isReadonly && (
                <>
                  <Select
                    label="Maqsad"
                    value={form.target}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        target: e.target.value as NotificationTarget,
                        target_user_ids:
                          e.target.value === 'all' ? [] : form.target_user_ids,
                      })
                    }
                  >
                    <option value="all">Barcha foydalanuvchilar</option>
                    <option value="selected">Tanlangan foydalanuvchilar</option>
                  </Select>

                  {form.target === 'selected' && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Users className="h-4 w-4" />
                        Foydalanuvchilar ({form.target_user_ids.length} tanlangan)
                      </div>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Qidirish..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="max-h-40 space-y-1 overflow-y-auto">
                        {usersLoading ? (
                          <p className="py-4 text-center text-xs text-slate-400">Yuklanmoqda...</p>
                        ) : users.length === 0 ? (
                          <p className="py-4 text-center text-xs text-slate-400">
                            Foydalanuvchilar topilmadi
                          </p>
                        ) : (
                          users.map((u) => (
                            <label
                              key={u.id}
                              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white"
                            >
                              <input
                                type="checkbox"
                                checked={form.target_user_ids.includes(u.id)}
                                onChange={() => toggleUser(u.id)}
                                className="rounded border-slate-300"
                              />
                              <span className="text-sm text-slate-700">
                                {u.first_name} {u.last_name}
                                {u.username ? ` (@${u.username})` : ''}
                              </span>
                              <span className="ml-auto font-mono text-xs text-slate-400">#{u.id}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {isReadonly && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-600">
                  <p>
                    Maqsad:{' '}
                    {form.target === 'selected'
                      ? `Tanlangan (${form.target_user_ids.length})`
                      : 'Barchasi'}
                  </p>
                </div>
              )}

              {!isReadonly && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                    Bekor qilish
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                  </Button>
                </div>
              )}
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sendId && (
          <Modal title="Bildirishnomani yuborish" onClose={() => setSendId(null)} size="sm">
            <p className="text-sm text-slate-600">
              Bu bildirishnoma foydalanuvchilarga yuboriladi. Draft holatidan chiqib, qayta
              tahrirlab bo'lmaydi.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSendId(null)} disabled={sending}>
                Bekor qilish
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? 'Yuborilmoqda...' : 'Yuborish'}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <Modal title="Draftni o'chirish" onClose={() => setDeleteId(null)} size="sm">
            <p className="text-sm text-slate-600">Bu draftni o'chirmoqchimisiz?</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                Bekor qilish
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'O\'chirilmoqda...' : 'O\'chirish'}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
