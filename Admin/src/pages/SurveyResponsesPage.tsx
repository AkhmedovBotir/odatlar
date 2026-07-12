import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  RefreshCw,
  Trash2,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { listSurveys } from '../api/surveys'
import {
  deleteSurveyResponse,
  getSurveyResponseSummary,
  listAllSurveyResponses,
  listSurveyResponses,
} from '../api/surveyResponses'
import { getSurvey } from '../api/surveys'
import type { Survey } from '../types/survey'
import type { SurveyQuestion } from '../types/survey'
import type {
  SurveyResponseItem,
  SurveyResponseSort,
  SurveyResponseSummary,
} from '../types/surveyResponse'
import { SURVEY_STATUS_LABELS } from '../types/survey'
import { useSnackbar } from '../context/SnackbarContext'
import { getApiErrorMessage } from '../lib/apiMessage'
import {
  formatAnswersPreview,
  formatDateTime,
} from '../lib/surveyResponseUtils'
import { SurveyResponseDetailModal } from '../components/surveys/SurveyResponseDetailModal'
import { SurveyStatCard } from '../components/surveys/SurveyCard'
import { Button, Input, Select } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

const ALL_SURVEYS = ''

export function SurveyResponsesPage() {
  const snackbar = useSnackbar()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedSurvey = searchParams.get('survey') ?? ALL_SURVEYS

  const [surveys, setSurveys] = useState<Survey[]>([])
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [summary, setSummary] = useState<SurveyResponseSummary | null>(null)
  const [items, setItems] = useState<SurveyResponseItem[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [questionId, setQuestionId] = useState('')
  const [sort, setSort] = useState<SurveyResponseSort>('created_at_desc')
  const [appliedFilters, setAppliedFilters] = useState({
    from: '',
    to: '',
    search: '',
    questionId: '',
    sort: 'created_at_desc' as SurveyResponseSort,
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [viewId, setViewId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filterParams = useMemo(
    () => ({
      from: appliedFilters.from || undefined,
      to: appliedFilters.to || undefined,
      search: appliedFilters.search || undefined,
      question_id: appliedFilters.questionId || undefined,
      page,
      limit,
      sort: appliedFilters.sort,
    }),
    [appliedFilters, page, limit],
  )

  const loadSurveys = useCallback(async () => {
    try {
      setSurveys(await listSurveys())
    } catch {
      /* surveys list optional for filters */
    }
  }, [])

  const loadSummary = useCallback(async () => {
    if (!selectedSurvey) {
      setSummary(null)
      return
    }
    try {
      setSummary(await getSurveyResponseSummary(selectedSurvey))
    } catch {
      setSummary(null)
    }
  }, [selectedSurvey])

  const loadQuestions = useCallback(async () => {
    if (!selectedSurvey) {
      setQuestions([])
      return
    }
    try {
      const survey = await getSurvey(selectedSurvey)
      setQuestions(survey.questions?.filter((q) => q.type !== 'section') ?? [])
    } catch {
      setQuestions([])
    }
  }, [selectedSurvey])

  const loadResponses = useCallback(async () => {
    try {
      const result = selectedSurvey
        ? await listSurveyResponses(selectedSurvey, filterParams)
        : await listAllSurveyResponses({ ...filterParams, survey: undefined })

      setItems(result.data)
      setTotal(result.total)
      setTotalPages(Math.max(1, Math.ceil(result.total / result.limit)))
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Yuklashda xato'))
      setItems([])
      setTotal(0)
      setTotalPages(1)
    }
  }, [selectedSurvey, filterParams])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadSummary(), loadQuestions(), loadResponses()])
    setLoading(false)
  }, [loadSummary, loadQuestions, loadResponses])

  useEffect(() => {
    loadSurveys()
  }, [loadSurveys])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  function handleSurveyChange(value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('survey', value)
    else next.delete('survey')
    setSearchParams(next, { replace: true })
    setPage(1)
    setQuestionId('')
    setAppliedFilters((prev) => ({ ...prev, questionId: '' }))
  }

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault()
    setAppliedFilters({
      from,
      to,
      search: search.trim(),
      questionId,
      sort,
    })
    setPage(1)
  }

  function handleResetFilters() {
    const empty = {
      from: '',
      to: '',
      search: '',
      questionId: '',
      sort: 'created_at_desc' as SurveyResponseSort,
    }
    setFrom('')
    setTo('')
    setSearch('')
    setQuestionId('')
    setSort('created_at_desc')
    setAppliedFilters(empty)
    setPage(1)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteSurveyResponse(deleteId)
      setDeleteId(null)
      snackbar.success('Javob o\'chirildi')
      await loadAll()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'O\'chirishda xato'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Kontent"
        title="So'rovnoma javoblari"
        description="Foydalanuvchilardan kelgan javoblarni ko'rish, filtrlash va tahlil qilish"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void handleRefresh()} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Yangilash
            </Button>
            <Link to="/surveys">
              <Button variant="outline">So'rovnomalar</Button>
            </Link>
          </div>
        }
      />

      <Card className="mb-6">
        <form onSubmit={handleApplyFilters} className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <Select
            label="So'rovnoma"
            value={selectedSurvey}
            onChange={(e) => handleSurveyChange(e.target.value)}
          >
            <option value={ALL_SURVEYS}>Barcha so'rovnomalar</option>
            {surveys.map((survey) => (
              <option key={survey.id} value={survey.id}>
                {survey.title} ({survey.id})
              </option>
            ))}
          </Select>

          <Input
            label="Qidiruv"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Javoblar ichida matn qidirish..."
          />

          <Select
            label="Savol bo'yicha"
            value={questionId}
            onChange={(e) => setQuestionId(e.target.value)}
            disabled={!selectedSurvey || questions.length === 0}
          >
            <option value="">Barcha savollar</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title || q.id}
              </option>
            ))}
          </Select>

          <Input label="Dan (sana)" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Gacha (sana)" type="date" value={to} onChange={(e) => setTo(e.target.value)} />

          <Select label="Saralash" value={sort} onChange={(e) => setSort(e.target.value as SurveyResponseSort)}>
            <option value="created_at_desc">Yangi avval</option>
            <option value="created_at_asc">Eski avval</option>
          </Select>

          <div className="flex items-end gap-2 lg:col-span-2 xl:col-span-3">
            <Button type="submit">Filtrlash</Button>
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              Tozalash
            </Button>
          </div>
        </form>
      </Card>

      {selectedSurvey && summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SurveyStatCard label="Jami javoblar" value={summary.totalResponses} icon={Inbox} />
          <SurveyStatCard label="Bugun" value={summary.todayResponses} icon={Calendar} />
          <SurveyStatCard label="Oxirgi 7 kun" value={summary.weekResponses} icon={TrendingUp} />
          <Card className="!p-4">
            <p className="text-sm font-medium text-slate-600">So'rovnoma holati</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant={
                  summary.surveyStatus === 'published'
                    ? 'success'
                    : summary.surveyStatus === 'closed'
                      ? 'warning'
                      : 'neutral'
                }
              >
                {SURVEY_STATUS_LABELS[summary.surveyStatus]}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Birinchi: {formatDateTime(summary.firstResponseAt)}
            </p>
            <p className="text-xs text-slate-500">
              Oxirgi: {formatDateTime(summary.lastResponseAt)}
            </p>
          </Card>
        </div>
      )}

      {!selectedSurvey && (
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-800">
          Bitta so&apos;rovnoma tanlasangiz, statistika kartochkalari ko&apos;rinadi.
        </div>
      )}

      <Card padding={false}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Javoblar ro'yxati</h3>
            <p className="text-xs text-slate-500">
              {selectedSurvey
                ? summary?.surveyTitle ?? selectedSurvey
                : 'Barcha so\'rovnomalar'}
              {' · '}Jami {total}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID
                </th>
                {!selectedSurvey && (
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    So'rovnoma
                  </th>
                )}
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Javoblar
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sana
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={selectedSurvey ? 4 : 5} className="px-5 py-16 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={selectedSurvey ? 4 : 5} className="px-5 py-16 text-center text-slate-500">
                    <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    Javoblar topilmadi
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">#{item.id}</td>
                    {!selectedSurvey && (
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{item.surveyTitle}</p>
                        <p className="font-mono text-xs text-slate-500">{item.surveySlug}</p>
                      </td>
                    )}
                    <td className="max-w-xs px-5 py-3 text-slate-600">
                      <p className="line-clamp-2">{formatAnswersPreview(item.answers)}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Batafsil ko'rish"
                          onClick={() => setViewId(item.id)}
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="O'chirish"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-500">
              Sahifa {page} / {totalPages} · Jami {total}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {viewId && (
          <SurveyResponseDetailModal responseId={viewId} onClose={() => setViewId(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <Modal
            title="Javobni o'chirish"
            onClose={() => !deleting && setDeleteId(null)}
            size="sm"
          >
            <p className="text-sm text-slate-600">
              <span className="font-mono font-medium">#{deleteId}</span> javobini o&apos;chirmoqchimisiz?
              Bu amalni qaytarib bo&apos;lmaydi.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                Bekor qilish
              </Button>
              <Button variant="danger" onClick={() => void handleDelete()} disabled={deleting}>
                {deleting ? 'O\'chirilmoqda...' : 'O\'chirish'}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
