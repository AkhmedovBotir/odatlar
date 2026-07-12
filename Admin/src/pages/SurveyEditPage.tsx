import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  HelpCircle,
  Lock,
  Save,
  Send,
  Settings2,
} from 'lucide-react'
import {
  createSurvey,
  getSurvey,
  updateSurvey,
  publishSurvey,
  closeSurvey,
} from '../api/surveys'
import type { SurveyQuestion, SurveySettings, SurveyStatus } from '../types/survey'
import type { DeltaContent } from '../types/delta'
import { SURVEY_STATUS_LABELS } from '../types/survey'
import { useSnackbar } from '../context/SnackbarContext'
import { getApiErrorMessage } from '../lib/apiMessage'
import {
  countAnswerableQuestions,
  createQuestion,
  defaultSettings,
  sanitizeSurveySettings,
  serializeSurveySettings,
  getSurveyResponseUrl,
} from '../lib/surveyUtils'
import { deltaToApiString, parseDescriptionDelta } from '../lib/deltaUtils'
import { syncSlugWithTitle } from '../lib/slugify'
import { SurveyQuestionEditor } from '../components/surveys/SurveyQuestionEditor'
import { SurveyResponseUrl } from '../components/surveys/SurveyResponseUrl'
import { Button, Input, Textarea, Toggle } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { SlugHint } from '../components/ui/SlugHint'
import { DeltaRichTextEditor } from '../components/ui/DeltaRichTextEditor'
import { TabNav } from '../components/ui/TabNav'
import { Modal } from '../components/ui/Modal'

type EditTab = 'info' | 'settings' | 'questions'

type SurveyForm = {
  slug: string
  title: string
  description?: DeltaContent
  sortOrder: string
  settings: SurveySettings
  questions: SurveyQuestion[]
  status: SurveyStatus
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  closedAt?: string
  responseUrl?: string
}

const emptyForm: SurveyForm = {
  slug: '',
  title: '',
  description: undefined,
  sortOrder: '0',
  settings: defaultSettings(),
  questions: [createQuestion('short_text')],
  status: 'draft',
}

const editTabs: { id: EditTab; label: string; icon: typeof FileText; description: string }[] = [
  { id: 'info', label: 'Asosiy', icon: FileText, description: 'Sarlavha va tavsif' },
  { id: 'settings', label: 'Sozlamalar', icon: Settings2, description: 'Forma parametrlari' },
  { id: 'questions', label: 'Savollar', icon: HelpCircle, description: 'Savollar ro\'yxati' },
]

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

function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('uz-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function SurveyEditPage() {
  const snackbar = useSnackbar()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isNew = location.pathname.endsWith('/new')
  const surveyRef = isNew ? '' : (id ?? '')

  const [form, setForm] = useState<SurveyForm>(emptyForm)
  const [activeTab, setActiveTab] = useState<EditTab>('info')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const isClosed = form.status === 'closed'
  const answerableCount = countAnswerableQuestions(form.questions)
  const sectionCount = form.questions.filter((q) => q.type === 'section').length

  const load = useCallback(async () => {
    if (!surveyRef) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const survey = await getSurvey(surveyRef)
      setForm({
        slug: survey.id,
        title: survey.title,
        description: parseDescriptionDelta(survey.description),
        sortOrder: String(survey.sortOrder ?? 0),
        settings: sanitizeSurveySettings(survey.settings),
        questions: survey.questions?.length ? survey.questions : [createQuestion('short_text')],
        status: survey.status,
        createdAt: survey.createdAt,
        updatedAt: survey.updatedAt,
        publishedAt: survey.publishedAt,
        closedAt: survey.closedAt,
        responseUrl: survey.responseUrl,
      })
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Yuklashda xato'))
    } finally {
      setLoading(false)
    }
  }, [surveyRef])

  useEffect(() => {
    if (!isNew) load()
  }, [isNew, load])

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: syncSlugWithTitle(title, isNew, f.slug),
    }))
  }

  function buildBody() {
    return {
      slug: form.slug.trim(),
      title: form.title.trim(),
      description: deltaToApiString(form.description),
      settings: serializeSurveySettings(form.settings),
      questions: form.questions,
      sortOrder: form.sortOrder !== '' ? Number(form.sortOrder) : 0,
    }
  }

  function validateForm(): string | null {
    if (!form.slug.trim() || !form.title.trim()) {
      return 'Slug va sarlavha majburiy'
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      return 'Slug: faqat kichik harf, raqam va tire'
    }
    if (form.questions.length === 0) {
      return 'Kamida bitta savol qo\'shing'
    }
    for (const q of form.questions) {
      if (q.type !== 'section' && !q.title?.trim()) {
        return `«${q.id}» savolida matn bo'sh`
      }
    }
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (isClosed) return

    const validationError = validateForm()
    if (validationError) {
      snackbar.error(validationError)
      return
    }

    setSaving(true)
    try {
      const body = buildBody()
      if (isNew) {
        const created = await createSurvey(body)
        snackbar.success('So\'rovnoma yaratildi')
        navigate(`/surveys/${created.id}/edit`, { replace: true })
      } else {
        await updateSurvey(surveyRef, body)
        snackbar.success('So\'rovnoma saqlandi')
        await load()
      }
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Saqlashda xato'))
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!surveyRef) return
    const validationError = validateForm()
    if (validationError) {
      snackbar.error(validationError)
      setPublishOpen(false)
      return
    }

    setActionLoading(true)
    try {
      if (!isClosed) {
        await updateSurvey(surveyRef, buildBody())
      }
      await publishSurvey(surveyRef)
      setPublishOpen(false)
      snackbar.success('So\'rovnoma nashr qilindi')
      await load()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Nashr qilishda xato'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleClose() {
    if (!surveyRef) return
    setActionLoading(true)
    try {
      await closeSurvey(surveyRef)
      setCloseOpen(false)
      snackbar.success('So\'rovnoma yopildi')
      await load()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Yopishda xato'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={isNew ? 'Yangi so\'rovnoma' : form.title || 'So\'rovnomani tahrirlash'}
        description={
          isNew
            ? 'Google Forms uslubida so\'rovnoma yarating'
            : `${answerableCount} javobli savol · ${sectionCount} bo'lim`
        }
        action={
          <Link to="/surveys">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Ro'yxatga
            </Button>
          </Link>
        }
      />

      {isClosed && (
        <div className="mb-4">
          <Alert variant="info">
            Bu so&apos;rovnoma yopilgan — tahrirlash mumkin emas. Faqat ko&apos;rish rejimida.
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <TabNav tabs={editTabs} active={activeTab} onChange={setActiveTab} />

          <form onSubmit={handleSubmit}>
            {activeTab === 'info' && (
              <Card>
                <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Asosiy ma&apos;lumotlar</h3>
                    <p className="text-xs text-slate-500">Sarlavha, identifikator va tavsif</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Input
                      label="Sarlavha"
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                      disabled={isClosed}
                      placeholder="Foydalanuvchi tajribasi so'rovnomasi"
                    />
                    <SlugHint slug={form.slug} />
                  </div>
                  <Input
                    label="Tartib raqami"
                    inputMode="numeric"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: e.target.value.replace(/[^\d-]/g, '') })
                    }
                    disabled={isClosed}
                    hint="Ro'yxatda ko'rsatish tartibi"
                    className="max-w-xs"
                  />
                  <DeltaRichTextEditor
                    label="Tavsif"
                    value={form.description}
                    onChange={(description) => setForm({ ...form, description })}
                    disabled={isClosed}
                    hint="Quill delta formatida saqlanadi"
                    placeholder="So'rovnoma haqida qisqacha ma'lumot..."
                  />
                </div>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card>
                <div className="mb-5 border-b border-slate-100 pb-4">
                  <h3 className="text-base font-semibold text-slate-900">Forma sozlamalari</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Foydalanuvchi uchun ko&apos;rinish va xatti-harakat</p>
                </div>
                <div className="space-y-3">
                  <Toggle
                    label="Email maydoni"
                    description="Javob berish formasida email maydonini ko'rsatish"
                    checked={form.settings.collectEmail ?? false}
                    onChange={(v) =>
                      setForm({ ...form, settings: { ...form.settings, collectEmail: v } })
                    }
                    disabled={isClosed}
                  />
                  <Toggle
                    label="Savollarni aralashtirish"
                    checked={form.settings.shuffleQuestions ?? false}
                    onChange={(v) =>
                      setForm({ ...form, settings: { ...form.settings, shuffleQuestions: v } })
                    }
                    disabled={isClosed}
                  />
                  <Toggle
                    label="Progress bar ko'rsatish"
                    checked={form.settings.showProgressBar ?? true}
                    onChange={(v) =>
                      setForm({ ...form, settings: { ...form.settings, showProgressBar: v } })
                    }
                    disabled={isClosed}
                  />
                  <Textarea
                    label="Tasdiqlash xabari"
                    value={form.settings.confirmationMessage ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        settings: { ...form.settings, confirmationMessage: e.target.value },
                      })
                    }
                    rows={3}
                    disabled={isClosed}
                    hint="Javob yuborilgandan keyin ko'rsatiladi"
                  />
                </div>
              </Card>
            )}

            {activeTab === 'questions' && (
              <SurveyQuestionEditor
                questions={form.questions}
                onChange={(questions) => setForm({ ...form, questions })}
                disabled={isClosed}
              />
            )}

            {!isClosed && (
              <div className="mt-6 flex justify-end gap-2">
                <Link to="/surveys">
                  <Button type="button" variant="outline" disabled={saving}>
                    Bekor qilish
                  </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            )}
          </form>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="!p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Holat
            </p>
            <Badge variant={statusVariant(form.status)} className="mb-4">
              {SURVEY_STATUS_LABELS[form.status]}
            </Badge>

            {!isNew && (
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Savollar</dt>
                  <dd className="font-medium text-slate-900">{answerableCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Bo&apos;limlar</dt>
                  <dd className="font-medium text-slate-900">{sectionCount}</dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                  <dt className="text-slate-500">Yaratilgan</dt>
                  <dd className="text-right text-xs text-slate-700">{formatDateTime(form.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Yangilangan</dt>
                  <dd className="text-right text-xs text-slate-700">{formatDateTime(form.updatedAt)}</dd>
                </div>
                {form.publishedAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Nashr</dt>
                    <dd className="text-right text-xs text-emerald-700">{formatDateTime(form.publishedAt)}</dd>
                  </div>
                )}
                {form.closedAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Yopilgan</dt>
                    <dd className="text-right text-xs text-amber-700">{formatDateTime(form.closedAt)}</dd>
                  </div>
                )}
              </dl>
            )}
          </Card>

          {!isNew && getSurveyResponseUrl({ id: form.slug, responseUrl: form.responseUrl }) && (
            <Card className="!p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Javob berish havolasi
              </p>
              <SurveyResponseUrl
                url={getSurveyResponseUrl({ id: form.slug, responseUrl: form.responseUrl })}
                status={form.status}
              />
            </Card>
          )}

          {!isNew && !isClosed && (
            <Card className="!p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Amallar
              </p>
              <div className="space-y-2">
                {form.status === 'draft' && (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => setPublishOpen(true)}
                    disabled={actionLoading}
                  >
                    <Send className="h-4 w-4" />
                    Nashr qilish
                  </Button>
                )}
                {form.status === 'published' && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setCloseOpen(true)}
                    disabled={actionLoading}
                  >
                    <Lock className="h-4 w-4" />
                    Yopish
                  </Button>
                )}
              </div>
              {form.status === 'draft' && (
                <p className="mt-3 text-xs text-slate-500">
                  Nashr uchun kamida 1 ta javobli savol kerak (bo&apos;lim hisoblanmaydi).
                </p>
              )}
            </Card>
          )}
        </aside>
      </div>

      {publishOpen && (
        <Modal title="Nashr qilish" onClose={() => !actionLoading && setPublishOpen(false)}>
          <p className="mb-4 text-sm text-slate-600">
            Avval o&apos;zgarishlar saqlanadi, keyin so&apos;rovnoma nashr qilinadi.
            Hozir {answerableCount} ta javobli savol mavjud.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPublishOpen(false)} disabled={actionLoading}>
              Bekor qilish
            </Button>
            <Button onClick={handlePublish} disabled={actionLoading}>
              {actionLoading ? 'Nashr qilinmoqda...' : 'Nashr qilish'}
            </Button>
          </div>
        </Modal>
      )}

      {closeOpen && (
        <Modal title="So'rovnomani yopish" onClose={() => !actionLoading && setCloseOpen(false)}>
          <p className="mb-4 text-sm text-slate-600">
            Yopilgan so&apos;rovnomani tahrirlab bo&apos;lmaydi. Davom etasizmi?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCloseOpen(false)} disabled={actionLoading}>
              Bekor qilish
            </Button>
            <Button variant="danger" onClick={handleClose} disabled={actionLoading}>
              {actionLoading ? 'Yopilmoqda...' : 'Yopish'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
