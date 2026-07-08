import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listAdmins, createAdmin, updateAdmin, updateAdminStatus, deleteAdmin } from '../api/admin'
import type { Admin, AdminStatus, CreateAdminRequest, UpdateAdminRequest } from '../api/types'
import { ApiClientError } from '../api/client'
import { Button, Input, PasswordInput } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Alert } from '../components/ui/Alert'

type FormMode = 'create' | 'edit' | null

const emptyForm: CreateAdminRequest = {
  first_name: '',
  last_name: '',
  username: '',
  phone: '',
  password: '',
}

export function AdminsPage() {
  const { admin: currentAdmin } = useAuth()

  const [admins, setAdmins] = useState<Admin[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateAdminRequest>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await listAdmins(page, limit)
      setAdmins(result.data)
      setTotal(result.meta.total)
      setTotalPages(Math.max(1, Math.ceil(result.meta.total / result.meta.limit)))
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Yuklashda xato')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  const filtered = search.trim()
    ? admins.filter(
        (a) =>
          `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
          a.username.toLowerCase().includes(search.toLowerCase()) ||
          a.phone.includes(search),
      )
    : admins

  function openCreate() {
    setForm(emptyForm)
    setEditingId(null)
    setFormMode('create')
    setFormError('')
  }

  function openEdit(admin: Admin) {
    setForm({
      first_name: admin.first_name,
      last_name: admin.last_name,
      username: admin.username,
      phone: admin.phone,
      password: '',
    })
    setEditingId(admin.id)
    setFormMode('edit')
    setFormError('')
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    try {
      if (formMode === 'create') {
        await createAdmin(form)
      } else if (formMode === 'edit' && editingId) {
        const body: UpdateAdminRequest = {
          first_name: form.first_name,
          last_name: form.last_name,
          username: form.username,
          phone: form.phone,
        }
        if (form.password) body.password = form.password
        await updateAdmin(editingId, body)
      }
      closeForm()
      fetchAdmins()
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Saqlashda xato')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(admin: Admin) {
    const nextStatus: AdminStatus = admin.status === 'active' ? 'inactive' : 'active'
    setTogglingId(admin.id)
    setError('')
    try {
      await updateAdminStatus(admin.id, { status: nextStatus })
      fetchAdmins()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Status o\'zgartirishda xato')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteAdmin(deleteId)
      setDeleteId(null)
      fetchAdmins()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'O\'chirishda xato')
      setDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Boshqaruv"
        title="Adminlar"
        description={`Jami ${total} ta admin ro'yxatdan o'tgan`}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Yangi admin
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <Card padding={false}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Admin
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Username
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Telefon
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Holat
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Yuklanmoqda...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    Adminlar topilmadi
                  </td>
                </tr>
              ) : (
                filtered.map((admin) => (
                  <tr key={admin.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {admin.first_name[0]}
                          {admin.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {admin.first_name} {admin.last_name}
                          </p>
                          <p className="text-xs text-slate-400">ID: {admin.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">@{admin.username}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {admin.phone}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        disabled={togglingId === admin.id || admin.id === currentAdmin?.id}
                        onClick={() => handleToggleStatus(admin)}
                        title={
                          admin.id === currentAdmin?.id
                            ? 'O\'z statusingizni o\'zgartira olmaysiz'
                            : 'Statusni o\'zgartirish'
                        }
                        className="disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Badge
                          variant={admin.status === 'active' ? 'success' : 'danger'}
                        >
                          {togglingId === admin.id
                            ? '...'
                            : admin.status === 'active'
                              ? 'Faol'
                              : 'Nofaol'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(admin)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Tahrirlash"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {admin.id !== currentAdmin?.id && (
                          <button
                            type="button"
                            onClick={() => setDeleteId(admin.id)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-500">
              Sahifa {page} / {totalPages} &middot; Jami {total}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {formMode && (
          <Modal
            onClose={closeForm}
            title={formMode === 'create' ? 'Yangi admin qo\'shish' : 'Adminni tahrirlash'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Ism"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
                <Input
                  label="Familiya"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
              <Input
                label="Telefon"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <PasswordInput
                label={formMode === 'create' ? 'Parol' : 'Yangi parol'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={formMode === 'create'}
                hint={formMode === 'edit' ? 'O\'zgartirmasangiz bo\'sh qoldiring' : undefined}
              />
              {formError && <Alert variant="error">{formError}</Alert>}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Bekor
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <Modal onClose={() => setDeleteId(null)} title="Adminni o'chirish" size="sm">
            <p className="text-sm text-slate-600">
              Bu amalni qaytarib bo'lmaydi. Admin butunlay o'chiriladi. Davom etasizmi?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>
                Bekor
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
