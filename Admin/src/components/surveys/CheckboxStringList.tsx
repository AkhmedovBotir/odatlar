import { Button } from '../ui/Form'

export function CheckboxStringList({
  label,
  options,
  value,
  onChange,
  disabled,
  hint,
  emptyMessage = 'Ro\'yxat yuklanmadi',
  selectedFooter,
  unselectedFooter = 'Tanlanmagan — tur uchun default formatlar qo\'llanadi',
}: {
  label: string
  options: string[]
  value?: string[]
  onChange: (value: string[] | undefined) => void
  disabled?: boolean
  hint?: string
  emptyMessage?: string
  selectedFooter?: (count: number) => string
  unselectedFooter?: string
}) {
  const selected = new Set(value ?? [])

  function toggle(item: string) {
    if (disabled) return
    const next = new Set(selected)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    const arr = [...next]
    onChange(arr.length ? arr : undefined)
  }

  function selectAll() {
    if (disabled || !options.length) return
    onChange([...options])
  }

  function clearAll() {
    if (disabled) return
    onChange(undefined)
  }

  if (!options.length) {
    return <div className="text-xs text-slate-500">{emptyMessage}</div>
  }

  const footer =
    selected.size > 0
      ? (selectedFooter?.(selected.size) ??
        `${selected.size} ta tanlangan — API ga string[] sifatida yuboriladi`)
      : unselectedFooter

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {!disabled && (
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
              Hammasi
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
              Tozalash
            </Button>
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {options.map((item) => {
            const checked = selected.has(item)
            return (
              <label
                key={item}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition ${
                  checked ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(item)}
                />
                <span className="font-mono">{item}</span>
              </label>
            )
          })}
        </div>
      </div>
      <p className="text-xs text-slate-400">{footer}</p>
    </div>
  )
}
