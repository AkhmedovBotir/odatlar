import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { submitSurveyResponse } from '../../api/surveys'
import { parseDescriptionDelta } from '../../lib/deltaUtils'
import { countAnswerableQuestions, prepareQuestions, validateAnswers } from '../../lib/surveyUtils'
import QuestionField from './QuestionField'

export default function SurveyForm({ survey }) {
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  const isClosed = survey.status === 'closed'
  const isReadOnly = isClosed || submitted
  const settings = survey.settings ?? {}
  const questions = useMemo(
    () => prepareQuestions(survey.questions ?? [], settings),
    [survey.questions, settings],
  )
  const emailQuestion = settings.collectEmail
    ? questions.find((q) => q.type === 'email')
    : null
  const visibleQuestions = emailQuestion
    ? questions.filter((q) => q.id !== emailQuestion.id)
    : questions
  const answerableCount = countAnswerableQuestions(questions)
  const answeredCount = questions.filter(
    (q) => q.type !== 'section' && answers[q.id] !== undefined && answers[q.id] !== '',
  ).length
  const progress = answerableCount ? Math.round((answeredCount / answerableCount) * 100) : 0

  function setAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    setErrors((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isReadOnly) return

    const validationErrors = validateAnswers(questions, answers)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      setSubmitError('Iltimos, majburiy savollarni to\'ldiring')
      const firstId = Object.keys(validationErrors)[0]
      document.getElementById(`question-${firstId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const result = await submitSurveyResponse(survey.id, answers)
      setSubmitted(result)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError(err.message || 'Javob yuborilmadi')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-2xl px-4 py-16 text-center"
      >
        <div className="rounded-lg border border-emerald-200 bg-white p-10 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
            ✓
          </div>
          <h2 className="text-2xl font-medium text-slate-800">
            {submitted.confirmationMessage || 'Javobingiz uchun rahmat!'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Javobingiz muvaffaqiyatli qabul qilindi.
          </p>
        </div>
      </motion.div>
    )
  }

  const description = parseDescriptionDelta(survey.description)

  return (
    <form onSubmit={handleSubmit} className="pb-16">
      {/* Google Forms style header */}
      <div className="border-t-[10px] border-violet-600 bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <h1 className="text-3xl font-normal text-slate-800">{survey.title}</h1>
          {description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          )}
          {isClosed && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Bu so'rovnoma yopilgan. Javoblar qabul qilinmaydi.
            </div>
          )}
          <p className="mt-4 text-xs text-red-500">* Majburiy savol</p>
        </div>
      </div>

      {settings.showProgressBar !== false && answerableCount > 0 && (
        <div className="mx-auto max-w-2xl px-4 pt-6">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full bg-violet-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      <div className="mx-auto mt-6 max-w-2xl space-y-3 px-4">
        {emailQuestion && (
          <div id={`question-${emailQuestion.id}`}>
            <QuestionField
              question={emailQuestion}
              index={0}
              value={answers[emailQuestion.id]}
              onChange={(val) => setAnswer(emailQuestion.id, val)}
              error={errors[emailQuestion.id]}
              disabled={isReadOnly}
              surveyId={survey.id}
              onUploadError={setUploadError}
            />
          </div>
        )}

        {visibleQuestions.map((question, index) => (
          <div key={question.id} id={`question-${question.id}`}>
            <QuestionField
              question={question}
              index={index}
              value={answers[question.id]}
              onChange={(val) => setAnswer(question.id, val)}
              error={errors[question.id]}
              disabled={isReadOnly}
              surveyId={survey.id}
              onUploadError={setUploadError}
            />
          </div>
        ))}

        {(submitError || uploadError) && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError || uploadError}
          </div>
        )}

        {!isClosed && (
          <div className="flex items-center gap-4 pt-4">
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.01 }}
              whileTap={{ scale: submitting ? 1 : 0.99 }}
              className="rounded bg-violet-600 px-8 py-2.5 text-sm font-medium text-white shadow transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Yuborilmoqda...' : 'Yuborish'}
            </motion.button>
            <button
              type="button"
              onClick={() => {
                setAnswers({})
                setErrors({})
              }}
              className="text-sm text-violet-700 hover:underline"
            >
              Tozalash
            </button>
          </div>
        )}
      </div>

      <p className="mx-auto mt-10 max-w-2xl px-4 text-center text-xs text-slate-400">
        Odatlar Bot so'rovnomasi
      </p>
    </form>
  )
}
