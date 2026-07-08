import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

function isEmptyHtml(html: string): boolean {
  const trimmed = html.trim()
  return !trimmed || trimmed === '<p><br></p>' || trimmed === '<p></p>'
}

export function RichTextEditor({
  label,
  value,
  onChange,
  hint,
}: {
  label?: string
  value: string
  onChange: (html: string) => void
  hint?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  onChangeRef.current = onChange
  valueRef.current = value

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    host.innerHTML = ''
    const editorEl = document.createElement('div')
    host.appendChild(editorEl)

    const quill = new Quill(editorEl, {
      theme: 'snow',
      placeholder: 'Xabar matnini kiriting...',
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

    if (valueRef.current) {
      quill.clipboard.dangerouslyPasteHTML(valueRef.current)
    }

    const handleChange = () => {
      const html = quill.root.innerHTML
      onChangeRef.current(isEmptyHtml(html) ? '' : html)
    }

    quill.on('text-change', handleChange)
    quillRef.current = quill

    return () => {
      quill.off('text-change', handleChange)
      quillRef.current = null
      host.innerHTML = ''
    }
  }, [])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return

    const current = isEmptyHtml(quill.root.innerHTML) ? '' : quill.root.innerHTML
    const next = value || ''
    if (current !== next) {
      if (next) {
        quill.clipboard.dangerouslyPasteHTML(next)
      } else {
        quill.setText('')
      }
    }
  }, [value])

  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      <div
        ref={hostRef}
        className="quill-wrapper overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm"
      />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  )
}
