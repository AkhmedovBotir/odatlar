import { Link } from 'react-router-dom'
import {
  Calendar,
  ClipboardList,
  Hash,
  HelpCircle,
  Lock,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react'
import type { Survey, SurveyStatus } from '../../types/survey'
import { SURVEY_STATUS_LABELS } from '../../types/survey'
import { deltaToText, parseDescriptionDelta } from '../../lib/deltaUtils'
import { getSurveyResponseUrl } from '../../lib/surveyUtils'
import { SurveyResponseUrl } from './SurveyResponseUrl'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Form'

function statusVariant(status: SurveyStatus): 'neutral' | 'success' | 'warning' {
  switch (status) {
    case 'draft':
      return 'neutral'
    case 'published':
      return 'success'
    case 'closed':
      return 'warning'
  }
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function SurveyCard({
  survey,
  onPublish,
  onClose,
  onDelete,
}: {
  survey: Survey
  onPublish: () => void
  onClose: () => void
  onDelete: () => void
}) {
  const desc = survey.description
    ? deltaToText(parseDescriptionDelta(survey.description))
    : ''
  const questionCount = survey.questionCount ?? survey.questions?.length ?? 0
  const responseUrl = getSurveyResponseUrl(survey)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900">{survey.title}</h3>
              <p className="mt-0.5 font-mono text-xs text-slate-500">{survey.id}</p>
            </div>
          </div>
          <Badge variant={statusVariant(survey.status)}>
            {SURVEY_STATUS_LABELS[survey.status]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        {desc ? (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-600">{desc}</p>
        ) : (
          <p className="mb-4 text-sm italic text-slate-400">Tavsif kiritilmagan</p>
        )}

        {responseUrl && (
          <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Javob berish havolasi
            </p>
            <SurveyResponseUrl url={responseUrl} status={survey.status} variant="card" />
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2">
            <HelpCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{questionCount} savol</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2">
            <Hash className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>Tartib: {survey.sortOrder ?? 0}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>Yangilangan: {formatDate(survey.updatedAt)}</span>
          </div>
          {survey.publishedAt && (
            <div className="col-span-2 flex items-center gap-1.5 rounded-lg bg-emerald-50/50 px-2.5 py-2 text-emerald-700">
              <Send className="h-3.5 w-3.5 shrink-0" />
              <span>Nashr: {formatDate(survey.publishedAt)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-4 py-3">
        <Link to={`/surveys/${survey.id}/edit`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Pencil className="h-3.5 w-3.5" />
            {survey.status === 'closed' ? "Ko'rish" : 'Tahrirlash'}
          </Button>
        </Link>
        <div className="flex items-center gap-0.5">
          {survey.status === 'draft' && (
            <Button variant="ghost" size="sm" title="Nashr qilish" onClick={onPublish}>
              <Send className="h-4 w-4 text-emerald-600" />
            </Button>
          )}
          {survey.status === 'published' && (
            <Button variant="ghost" size="sm" title="Yopish" onClick={onClose}>
              <Lock className="h-4 w-4 text-amber-600" />
            </Button>
          )}
          <Button variant="ghost" size="sm" title="O'chirish" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </article>
  )
}

export function SurveyStatCard({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  value: number
  icon: typeof ClipboardList
  active?: boolean
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-xl border bg-white p-4 text-left shadow-sm transition ${
        active
          ? 'border-blue-600 ring-2 ring-blue-600/20'
          : 'border-slate-200 hover:border-slate-300'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-2xl font-bold tabular-nums text-slate-900">{value}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-600">{label}</p>
    </Tag>
  )
}
