import { useState } from 'react'
import { Check, Copy, ExternalLink, Link2 } from 'lucide-react'
import type { SurveyStatus } from '../../types/survey'
import { Button } from '../ui/Form'

function statusHint(status?: SurveyStatus): string | null {
  switch (status) {
    case 'draft':
      return 'Forma faqat nashr qilingandan keyin ishlaydi.'
    case 'closed':
      return 'So\'rovnoma yopilgan — forma javob qabul qilmaydi.'
    default:
      return null
  }
}

export function SurveyResponseUrl({
  url,
  status,
  variant = 'full',
}: {
  url: string
  status?: SurveyStatus
  variant?: 'inline' | 'card' | 'full'
}) {
  const [copied, setCopied] = useState(false)
  const hint = statusHint(status)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="Javob berish havolasini nusxalash"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void handleCopy()
          }}
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4 text-slate-500" />
          )}
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title="Javob berish formasini ochish"
          className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="min-w-0 truncate font-mono text-xs text-slate-600" title={url}>
            {url}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => void handleCopy()}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? 'Nusxalandi' : 'Havolani nusxalash'}
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
            onClick={(e) => e.stopPropagation()}
          >
            <Button type="button" variant="outline" size="sm">
              <ExternalLink className="h-3.5 w-3.5" />
              Ochish
            </Button>
          </a>
        </div>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={url}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-slate-600 hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {status === 'published' && (
        <p className="text-xs text-emerald-700">Nashr qilingan — havolani ulashishingiz mumkin.</p>
      )}
    </div>
  )
}
