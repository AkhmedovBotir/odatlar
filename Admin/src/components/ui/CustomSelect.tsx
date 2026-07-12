import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export function parseSelectOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = []

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const el = child as ReactElement<{
      value?: string | number
      children?: ReactNode
      disabled?: boolean
    }>
    if (el.type !== 'option') return

    const value = String(el.props.value ?? '')
    const label =
      typeof el.props.children === 'string' || typeof el.props.children === 'number'
        ? String(el.props.children)
        : value

    options.push({
      value,
      label,
      disabled: el.props.disabled,
    })
  })

  return options
}

type CustomSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label?: string
  error?: string
  children: ReactNode
}

export function CustomSelect({
  className = '',
  label,
  error,
  children,
  value,
  defaultValue,
  disabled,
  onChange,
  name,
  id,
}: CustomSelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const options = useMemo(() => parseSelectOptions(children), [children])
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const currentValue = value != null ? String(value) : defaultValue != null ? String(defaultValue) : ''
  const selected = options.find((opt) => opt.value === currentValue) ?? options[0]

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function selectValue(nextValue: string) {
    if (disabled) return
    onChange?.({
      target: { value: nextValue, name },
      currentTarget: { value: nextValue, name },
    } as React.ChangeEvent<HTMLSelectElement>)
    setOpen(false)
  }

  return (
    <div className={`block space-y-1.5 ${className}`} ref={rootRef}>
      {label && (
        <span id={`${selectId}-label`} className="text-sm font-medium text-slate-700">
          {label}
        </span>
      )}

      <div className="relative">
        <button
          type="button"
          id={selectId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={label ? `${selectId}-label` : undefined}
          disabled={disabled}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 py-2.5 text-left text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300'
          }`}
        >
          <span className={`truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
            {selected?.label ?? 'Tanlang'}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <ul
            role="listbox"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {options.map((option) => {
              const isSelected = option.value === currentValue
              return (
                <li key={`${option.value}-${option.label}`} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    disabled={option.disabled}
                    onClick={() => selectValue(option.value)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
