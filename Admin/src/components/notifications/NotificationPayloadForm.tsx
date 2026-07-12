import type { ReactNode } from 'react'
import type { NotificationPayload, NotificationType } from '../../types/notification'
import { Input, Textarea } from '../ui/Form'

function numField(
  label: string,
  value: unknown,
  onChange: (v: number) => void,
): ReactNode {
  return (
    <Input
      label={label}
      inputMode="numeric"
      value={value != null ? String(value) : ''}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
    />
  )
}

function strField(
  label: string,
  value: unknown,
  onChange: (v: string) => void,
  multiline = false,
): ReactNode {
  const val = typeof value === 'string' ? value : ''
  if (multiline) {
    return (
      <Textarea
        label={label}
        value={val}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
      />
    )
  }
  return <Input label={label} value={val} onChange={(e) => onChange(e.target.value)} />
}

export function NotificationPayloadForm({
  type,
  payload,
  onChange,
  disabled = false,
}: {
  type: NotificationType
  payload: NotificationPayload
  onChange: (payload: NotificationPayload) => void
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        {JSON.stringify(payload, null, 2)}
      </pre>
    )
  }

  function set(key: string, value: unknown) {
    onChange({ ...payload, [key]: value })
  }

  switch (type) {
    case 'mukofot':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {numField('XP', payload.xp, (v) => set('xp', v))}
          {numField('Tangalar', payload.coins, (v) => set('coins', v))}
          <div className="sm:col-span-2">
            {strField('Sabab', payload.reason, (v) => set('reason', v))}
          </div>
        </div>
      )
    case 'reyting':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {numField('Eski o\'rin', payload.oldRank, (v) => set('oldRank', v))}
          {numField('Yangi o\'rin', payload.newRank, (v) => set('newRank', v))}
          {numField('Jami foydalanuvchi', payload.totalUsers, (v) => set('totalUsers', v))}
          {numField('O\'zgarish', payload.delta, (v) => set('delta', v))}
        </div>
      )
    case 'eslatma':
      return (
        <div className="space-y-3">
          {strField('Odat nomi', payload.habitName, (v) => set('habitName', v))}
          {strField('Vaqt', payload.scheduledTime, (v) => set('scheduledTime', v))}
          {strField('Xabar', payload.message, (v) => set('message', v), true)}
        </div>
      )
    case 'tizim':
      return (
        <div className="space-y-3">
          {strField('Versiya', payload.version, (v) => set('version', v))}
          <Textarea
            label="Yangiliklar (har qator — bitta)"
            value={Array.isArray(payload.features) ? (payload.features as string[]).join('\n') : ''}
            onChange={(e) =>
              set(
                'features',
                e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            rows={4}
          />
          {strField('Tugma matni', payload.actionLabel, (v) => set('actionLabel', v))}
          {strField('Tugma havolasi', payload.actionHref, (v) => set('actionHref', v))}
        </div>
      )
    case 'yutuq':
      return (
        <div className="space-y-3">
          {numField('Seriya (kun)', payload.streak, (v) => set('streak', v))}
          {strField('Odat nomi', payload.habitName, (v) => set('habitName', v))}
          {strField('Nishon', payload.badgeLabel, (v) => set('badgeLabel', v))}
          {strField('Xabar', payload.message, (v) => set('message', v), true)}
        </div>
      )
    case 'mashq':
      return (
        <div className="space-y-3">
          {strField('Dominanta', payload.dominantTitle, (v) => set('dominantTitle', v))}
          {strField('Signal (cue)', payload.cue, (v) => set('cue', v))}
          {numField('Sessiyalar', payload.sessionsCompleted, (v) => set('sessionsCompleted', v))}
          {strField('Maslahat', payload.tip, (v) => set('tip', v), true)}
        </div>
      )
  }
}
