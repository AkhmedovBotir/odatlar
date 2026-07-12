import {
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react'
import type { SurveyQuestion } from '../../types/survey'
import { QUESTION_TYPE_LABELS } from '../../types/survey'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Form'

export function QuestionOutline({
  questions,
  activeIndex,
  disabled,
  onSelect,
  onMove,
  onDelete,
}: {
  questions: SurveyQuestion[]
  activeIndex: number
  disabled?: boolean
  onSelect: (index: number) => void
  onMove: (index: number, dir: -1 | 1) => void
  onDelete: (index: number) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Savollar ro&apos;yxati</p>
        <p className="text-xs text-slate-500">{questions.length} ta element</p>
      </div>
      <div className="max-h-[min(480px,55vh)] overflow-y-auto p-2">
        {questions.map((q, i) => {
          const isSection = q.type === 'section'
          const isActive = i === activeIndex
          const label = q.title?.trim() || QUESTION_TYPE_LABELS[q.type]

          return (
            <div
              key={`${q.id}-${i}`}
              className={`group mb-1 flex items-stretch gap-1 rounded-lg transition ${
                isActive ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(i)}
                className="flex min-w-0 flex-1 items-start gap-2 px-2 py-2.5 text-left"
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    isSection
                      ? 'bg-violet-100 text-violet-700'
                      : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Badge variant={isSection ? 'primary' : 'neutral'} className="!px-1.5 !py-0 text-[10px]">
                      {QUESTION_TYPE_LABELS[q.type]}
                    </Badge>
                    {q.required && !isSection && (
                      <span className="text-[10px] font-medium text-red-500">Majburiy</span>
                    )}
                  </div>
                </div>
              </button>
              {!disabled && (
                <div className="flex shrink-0 flex-col justify-center gap-0.5 pr-1 opacity-0 transition group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="!px-1.5 !py-1"
                    onClick={() => onMove(i, -1)}
                    disabled={i === 0}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="!px-1.5 !py-1"
                    onClick={() => onMove(i, 1)}
                    disabled={i === questions.length - 1}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="!px-1.5 !py-1"
                    onClick={() => onDelete(i)}
                    disabled={questions.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
