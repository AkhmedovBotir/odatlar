import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, LineChart, Sparkles, Target, TrendingUp } from 'lucide-react'
import { getXpSettings, updateXpSettings } from '../api/xp'
import type { XPSettings } from '../api/types'
import { ApiClientError } from '../api/client'
import { Button, Input } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'

type FormState = {
  practice_complete_xp: string
  indicator_log_xp: string
  dominant_create_xp: string
  dominant_session_xp: string
  level_up_xp: string
}

const XP_MIN = 0
const XP_MAX = 100000
const LEVEL_UP_MIN = 1
const LEVEL_UP_MAX = 1000000

function toForm(s: XPSettings): FormState {
  return {
    practice_complete_xp: String(s.practice_complete_xp),
    indicator_log_xp: String(s.indicator_log_xp),
    dominant_create_xp: String(s.dominant_create_xp),
    dominant_session_xp: String(s.dominant_session_xp),
    level_up_xp: String(s.level_up_xp),
  }
}

export function XpSettingsPage() {
  const [settings, setSettings] = useState<XPSettings | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getXpSettings()
      setSettings(data)
      setForm(toForm(data))
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Yuklashda xato')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  function setField(key: keyof FormState, value: string) {
    setForm((f) => (f ? { ...f, [key]: value.replace(/[^\d]/g, '') } : f))
  }

  function validate(f: FormState): string | null {
    const fields: { key: keyof FormState; label: string; min: number; max: number }[] = [
      { key: 'practice_complete_xp', label: 'Amaliyot XP', min: XP_MIN, max: XP_MAX },
      { key: 'indicator_log_xp', label: 'Indikator XP', min: XP_MIN, max: XP_MAX },
      { key: 'dominant_create_xp', label: 'Dominanta yaratish XP', min: XP_MIN, max: XP_MAX },
      { key: 'dominant_session_xp', label: 'Dominanta sessiyasi XP', min: XP_MIN, max: XP_MAX },
      { key: 'level_up_xp', label: 'Daraja XP', min: LEVEL_UP_MIN, max: LEVEL_UP_MAX },
    ]
    for (const field of fields) {
      const raw = f[field.key]
      if (raw === '') return `${field.label} kiritilishi shart`
      const num = Number(raw)
      if (!Number.isFinite(num) || num < field.min || num > field.max) {
        return `${field.label} ${field.min} – ${field.max} oralig'ida bo'lishi kerak`
      }
    }
    return null
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form) return

    const validationError = validate(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    try {
      const data = await updateXpSettings({
        practice_complete_xp: Number(form.practice_complete_xp),
        indicator_log_xp: Number(form.indicator_log_xp),
        dominant_create_xp: Number(form.dominant_create_xp),
        dominant_session_xp: Number(form.dominant_session_xp),
        level_up_xp: Number(form.level_up_xp),
      })
      setSettings(data)
      setForm(toForm(data))
      showSuccess('XP sozlamalari saqlandi')
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Saqlashda xato')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const levelUpXp = form ? Number(form.level_up_xp) || 0 : 0

  return (
    <div>
      <PageHeader
        breadcrumb="Geymifikatsiya"
        title="XP mukofot tizimi"
        description={
          settings?.updated_at
            ? `Oxirgi yangilanish: ${new Date(settings.updated_at).toLocaleString('uz')}`
            : 'Har bir amal uchun beriladigan XP va daraja sozlamalari'
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

      {form && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Odatlar</h3>
                  <p className="text-xs text-slate-500">Amaliyot va indikatorlar</p>
                </div>
              </div>
              <div className="space-y-4">
                <Input
                  label="Amaliyotni bajarish (XP)"
                  inputMode="numeric"
                  value={form.practice_complete_xp}
                  onChange={(e) => setField('practice_complete_xp', e.target.value)}
                  hint="Amaliyot bajarilganda beriladi. Bekor qilinganda ayiriladi. 0 – 100000"
                  required
                />
                <Input
                  label="Indikator kiritish (XP)"
                  inputMode="numeric"
                  value={form.indicator_log_xp}
                  onChange={(e) => setField('indicator_log_xp', e.target.value)}
                  hint="Indikator qiymati kiritilganda beriladi. 0 – 100000"
                  required
                />
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Dominantalar</h3>
                  <p className="text-xs text-slate-500">Yaratish va sessiyalar</p>
                </div>
              </div>
              <div className="space-y-4">
                <Input
                  label="Dominanta yaratish (XP)"
                  inputMode="numeric"
                  value={form.dominant_create_xp}
                  onChange={(e) => setField('dominant_create_xp', e.target.value)}
                  hint="Yangi dominanta yaratilganda beriladi. 0 – 100000"
                  required
                />
                <Input
                  label="Sessiyani yakunlash (XP)"
                  inputMode="numeric"
                  value={form.dominant_session_xp}
                  onChange={(e) => setField('dominant_session_xp', e.target.value)}
                  hint="Dominanta sessiyasi yakunlanganda beriladi. 0 – 100000"
                  required
                />
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Daraja (level)</h3>
                <p className="text-xs text-slate-500">
                  Formula: <span className="font-mono">level = (xp / level_up_xp) + 1</span>
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Bir daraja uchun kerakli XP"
                inputMode="numeric"
                value={form.level_up_xp}
                onChange={(e) => setField('level_up_xp', e.target.value)}
                hint="Har bir yangi daraja uchun to'planishi kerak XP. 1 – 1000000"
                required
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <LineChart className="h-3.5 w-3.5" />
                  Namuna
                </div>
                {levelUpXp >= 1 ? (
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>
                      <span className="font-mono">0 – {(levelUpXp - 1).toLocaleString('uz')}</span> XP → 1-daraja
                    </li>
                    <li>
                      <span className="font-mono">
                        {levelUpXp.toLocaleString('uz')} – {(levelUpXp * 2 - 1).toLocaleString('uz')}
                      </span>{' '}
                      XP → 2-daraja
                    </li>
                    <li>
                      <span className="font-mono">
                        {(levelUpXp * 2).toLocaleString('uz')} – {(levelUpXp * 3 - 1).toLocaleString('uz')}
                      </span>{' '}
                      XP → 3-daraja
                    </li>
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">To'g'ri qiymat kiriting</p>
                )}
              </div>
            </div>
          </Card>

          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-800">
              XP hech qachon 0 dan pastga tushmaydi. Sozlamalar o'zgartirilsa faqat keyingi amallarga
              ta'sir qiladi — o'tgan XP qayta hisoblanmaydi.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => settings && setForm(toForm(settings))}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
