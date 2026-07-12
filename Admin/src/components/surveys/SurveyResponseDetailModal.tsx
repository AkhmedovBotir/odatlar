import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getSurveyResponse } from '../../api/surveyResponses'
import type { SurveyResponseDetail } from '../../types/surveyResponse'
import { QUESTION_TYPE_LABELS } from '../../types/survey'
import { useSnackbar } from '../../context/SnackbarContext'
import { getApiErrorMessage } from '../../lib/apiMessage'
import { formatAnswerValue, formatDateTime } from '../../lib/surveyResponseUtils'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { SURVEY_STATUS_LABELS } from '../../types/survey'

function statusVariant(status: string): 'neutral' | 'success' | 'warning' {
  switch (status) {
    case 'published':
      return 'success'
    case 'closed':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function SurveyResponseDetailModal({
  responseId,
  onClose,
}: {
  responseId: string
  onClose: () => void
}) {
  const snackbar = useSnackbar()
  const [detail, setDetail] = useState<SurveyResponseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSurveyResponse(responseId)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((err) => {
        if (!cancelled) {
          snackbar.error(getApiErrorMessage(err, 'Yuklashda xato'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [responseId])

  const answerableQuestions = detail?.questions.filter((q) => q.type !== 'section') ?? []

  return (
    <Modal title={`Javob #${responseId}`} onClose={onClose} size="lg">
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {detail && !loading && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <span className="font-medium text-slate-900">{detail.surveyTitle}</span>
            <Badge variant={statusVariant(detail.surveyStatus)}>
              {SURVEY_STATUS_LABELS[detail.surveyStatus]}
            </Badge>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600">{formatDateTime(detail.createdAt)}</span>
          </div>

          <div className="space-y-3">
            {detail.questions.map((question) => {
              if (question.type === 'section') {
                return (
                  <div
                    key={question.id}
                    className="border-b border-slate-200 pb-1 pt-2 text-sm font-semibold text-slate-800"
                  >
                    {question.title}
                  </div>
                )
              }

              const answer = detail.answers[question.id]
              const hasAnswer = answer != null && answer !== ''

              return (
                <div
                  key={question.id}
                  className="rounded-lg border border-slate-100 bg-white px-4 py-3"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {question.title || question.id}
                    </p>
                    <span className="text-xs text-slate-400">
                      {QUESTION_TYPE_LABELS[question.type]}
                    </span>
                    {question.required && (
                      <Badge variant="neutral" className="!px-1.5 !py-0 text-[10px]">
                        Majburiy
                      </Badge>
                    )}
                  </div>
                  {question.description && (
                    <p className="mb-2 text-xs text-slate-500">{question.description}</p>
                  )}
                  <p
                    className={`text-sm leading-relaxed ${
                      hasAnswer ? 'text-slate-800' : 'italic text-slate-400'
                    }`}
                  >
                    {hasAnswer ? formatAnswerValue(answer) : 'Javob berilmagan'}
                  </p>
                </div>
              )
            })}

            {answerableQuestions.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">Savollar topilmadi</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
