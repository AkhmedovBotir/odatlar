import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSnackbar } from '../context/SnackbarContext'
import { updateAdmin } from '../api/admin'
import type { UpdateAdminRequest } from '../api/types'
import { getApiErrorMessage } from '../lib/apiMessage'
import { Button, Input, PasswordInput } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export function ProfilePage() {
  const { admin, updateAdmin: setAdmin, refreshProfile } = useAuth()
  const snackbar = useSnackbar()

  const [form, setForm] = useState({
    first_name: admin?.first_name ?? '',
    last_name: admin?.last_name ?? '',
    username: admin?.username ?? '',
    phone: admin?.phone ?? '',
    password: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!admin) return

    setSaving(true)

    const body: UpdateAdminRequest = {
      first_name: form.first_name,
      last_name: form.last_name,
      username: form.username,
      phone: form.phone,
    }
    if (form.password) body.password = form.password

    try {
      const updated = await updateAdmin(admin.id, body)
      setAdmin(updated)
      setForm((f) => ({ ...f, password: '' }))
      snackbar.success('Profil muvaffaqiyatli yangilandi')
      await refreshProfile()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Saqlashda xato'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Hisob"
        title="Profil"
        description="Shaxsiy ma'lumotlaringiz va parolingizni boshqaring"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white shadow-lg shadow-blue-600/20">
                {admin?.first_name?.[0]}
                {admin?.last_name?.[0]}
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                {admin?.first_name} {admin?.last_name}
              </h2>
              <p className="text-sm text-slate-500">@{admin?.username}</p>
              <div className="mt-3">
                <Badge variant={admin?.status === 'active' ? 'success' : 'danger'}>
                  {admin?.status === 'active' ? 'Faol' : 'Nofaol'}
                </Badge>
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              <ProfileInfo icon={User} label="ID" value={String(admin?.id ?? '—')} />
              <ProfileInfo icon={Phone} label="Telefon" value={admin?.phone ?? '—'} />
              <ProfileInfo icon={Mail} label="Username" value={`@${admin?.username}`} />
              <ProfileInfo
                icon={Calendar}
                label="Yaratilgan"
                value={
                  admin?.created_at
                    ? new Date(admin.created_at).toLocaleDateString('uz')
                    : '—'
                }
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2"
        >
          <Card>
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Ma'lumotlarni tahrirlash
            </h2>
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
                label="Yangi parol"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="O'zgartirmasangiz bo'sh qoldiring"
                hint="Kamida 8 ta belgi"
              />

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function ProfileInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
}
