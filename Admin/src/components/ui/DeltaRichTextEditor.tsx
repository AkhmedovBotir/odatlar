import { useEffect, useRef } from 'react'
import Quill from 'quill'
import type { Delta } from 'quill'
import 'quill/dist/quill.snow.css'
import type { DeltaContent } from '../../types/delta'
import { emptyDelta, isEmptyDelta } from '../../lib/deltaUtils'

function toQuillDelta(value?: DeltaContent): Delta {
  return (value ?? emptyDelta()) as unknown as Delta
}

function fromQuillDelta(delta: Delta): DeltaContent | undefined {
  const content = delta as unknown as DeltaContent
  return isEmptyDelta(content) ? undefined : content
}

export function DeltaRichTextEditor({
  label,
  value,
  onChange,
  hint,
  disabled,
  placeholder = 'Matn kiriting...',
}: {
  label?: string
  value?: DeltaContent
  onChange: (delta: DeltaContent | undefined) => void
  hint?: string
  disabled?: boolean
  placeholder?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  const disabledRef = useRef(disabled)
  onChangeRef.current = onChange
  valueRef.current = value
  disabledRef.current = disabled

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    host.innerHTML = ''
    const editorEl = document.createElement('div')
    host.appendChild(editorEl)

    const quill = new Quill(editorEl, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
          ['clean'],
        ],
      },
    })

    quill.setContents(toQuillDelta(valueRef.current))
    quill.enable(!disabledRef.current)

    const handleChange = () => {
      onChangeRef.current(fromQuillDelta(quill.getContents()))
    }

    quill.on('text-change', handleChange)
    quillRef.current = quill

    return () => {
      quill.off('text-change', handleChange)
      quillRef.current = null
      host.innerHTML = ''
    }
  }, [placeholder])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return

    const current = fromQuillDelta(quill.getContents())
    const currentJson = JSON.stringify(current ?? null)
    const nextJson = JSON.stringify(value ?? null)
    if (currentJson !== nextJson) {
      quill.setContents(toQuillDelta(value))
    }
  }, [value])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return
    quill.enable(!disabled)
  }, [disabled])

  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      <div
        ref={hostRef}
        className={`quill-wrapper overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm ${
          disabled ? 'pointer-events-none opacity-60' : ''
        }`}
      />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  )
}
