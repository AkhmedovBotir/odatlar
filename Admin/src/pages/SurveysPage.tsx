import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus,
  ClipboardList,
  Search,
  FileEdit,
  Globe,
  Lock,
  RefreshCw,
  Inbox,
} from 'lucide-react'
import {
  listSurveys,
  deleteSurvey,
  publishSurvey,
  closeSurvey,
} from '../api/surveys'
import type { Survey, SurveyStatus } from '../types/survey'
import { useSnackbar } from '../context/SnackbarContext'
import { getApiErrorMessage } from '../lib/apiMessage'
import { deltaToText, parseDescriptionDelta } from '../lib/deltaUtils'
import { SurveyCard, SurveyStatCard } from '../components/surveys/SurveyCard'
import { Button, Input } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { TabNav } from '../components/ui/TabNav'
import { Modal } from '../components/ui/Modal'

type StatusFilter = 'all' | SurveyStatus

const filterTabs: {
  id: StatusFilter
  label: string
  icon: typeof ClipboardList
  description: string
}[] = [
  { id: 'all', label: 'Barchasi', icon: ClipboardList, description: 'Barcha so\'rovnomalar' },
  { id: 'draft', label: 'Loyihalar', icon: FileEdit, description: 'Tahrirlash mumkin' },
  { id: 'published', label: 'Nashr', icon: Globe, description: 'Faol so\'rovnomalar' },
  { id: 'closed', label: 'Yopilgan', icon: Lock, description: 'Arxivlangan' },
]

export function SurveysPage() {
  const snackbar = useSnackbar()
  const [items, setItems] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [publishId, setPublishId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [closeId, setCloseId] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      setItems(await listSurveys())
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Yuklashda xato'))
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchItems().finally(() => setLoading(false))
  }, [fetchItems])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchItems()
    setRefreshing(false)
  }

  const counts = useMemo(
    () => ({
      all: items.length,
      draft: items.filter((s) => s.status === 'draft').length,
      published: items.filter((s) => s.status === 'published').length,
      closed: items.filter((s) => s.status === 'closed').length,
    }),
    [items],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items
      .filter((s) => statusFilter === 'all' || s.status === statusFilter)
      .filter((s) => {
        if (!q) return true
        const desc = s.description ? deltaToText(parseDescriptionDelta(s.description)) : ''
        return (
          s.title.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          desc.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [items, statusFilter, search])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteSurvey(deleteId)
      setDeleteId(null)
      snackbar.success('So\'rovnoma o\'chirildi')
      await fetchItems()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'O\'chirishda xato'))
    } finally {
      setDeleting(false)
    }
  }

  async function handlePublish() {
    if (!publishId) return
    setPublishing(true)
    try {
      await publishSurvey(publishId)
      setPublishId(null)
      snackbar.success('So\'rovnoma nashr qilindi')
      await fetchItems()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Nashr qilishda xato'))
    } finally {
      setPublishing(false)
    }
  }

  async function handleClose() {
    if (!closeId) return
    setClosing(true)
    try {
      await closeSurvey(closeId)
      setCloseId(null)
      snackbar.success('So\'rovnoma yopildi')
      await fetchItems()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Yopishda xato'))
    } finally {
      setClosing(false)
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
        title="So'rovnomalar"
        description="Google Forms uslubida so'rovnomalar yaratish, nashr qilish va boshqarish"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Yangilash
            </Button>
            <Link to="/surveys/responses">
              <Button variant="outline">
                <Inbox className="h-4 w-4" />
                Javoblar
              </Button>
            </Link>
            <Link to="/surveys/new">
              <Button>
                <Plus className="h-4 w-4" />
                Yangi so'rovnoma
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SurveyStatCard
          label="Jami"
          value={counts.all}
          icon={ClipboardList}
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        <SurveyStatCard
          label="Loyihalar"
          value={counts.draft}
          icon={FileEdit}
          active={statusFilter === 'draft'}
          onClick={() => setStatusFilter('draft')}
        />
        <SurveyStatCard
          label="Nashr qilingan"
          value={counts.published}
          icon={Globe}
          active={statusFilter === 'published'}
          onClick={() => setStatusFilter('published')}
        />
        <SurveyStatCard
          label="Yopilgan"
          value={counts.closed}
          icon={Lock}
          active={statusFilter === 'closed'}
          onClick={() => setStatusFilter('closed')}
        />
      </div>

      <TabNav tabs={filterTabs} active={statusFilter} onChange={setStatusFilter} />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sarlavha yoki identifikator bo'yicha qidirish..."
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-base font-medium text-slate-700">
            {items.length === 0 ? 'Hali so\'rovnomalar yo\'q' : 'Natija topilmadi'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {items.length === 0
              ? 'Birinchi so\'rovnomani yaratish uchun tugmani bosing'
              : 'Boshqa filtr yoki qidiruv so\'zini sinab ko\'ring'}
          </p>
          {items.length === 0 && (
            <Link to="/surveys/new" className="mt-4 inline-block">
              <Button>
                <Plus className="h-4 w-4" />
                So'rovnoma yaratish
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((survey) => (
              <motion.div
                key={survey.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <SurveyCard
                  survey={survey}
                  onPublish={() => setPublishId(survey.id)}
                  onClose={() => setCloseId(survey.id)}
                  onDelete={() => setDeleteId(survey.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {deleteId && (
          <Modal title="So'rovnomani o'chirish" onClose={() => !deleting && setDeleteId(null)}>
            <p className="mb-6 text-sm text-slate-600">
              <span className="font-mono text-slate-800">{deleteId}</span> so'rovnomasini o'chirishni
              tasdiqlaysizmi?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                Bekor qilish
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'O\'chirilmoqda...' : 'O\'chirish'}
              </Button>
            </div>
          </Modal>
        )}
        {publishId && (
          <Modal title="Nashr qilish" onClose={() => !publishing && setPublishId(null)}>
            <p className="mb-6 text-sm text-slate-600">
              So'rovnoma nashr qilingach foydalanuvchilar javob bera oladi. Davom etasizmi?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPublishId(null)} disabled={publishing}>
                Bekor qilish
              </Button>
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? 'Nashr qilinmoqda...' : 'Nashr qilish'}
              </Button>
            </div>
          </Modal>
        )}
        {closeId && (
          <Modal title="So'rovnomani yopish" onClose={() => !closing && setCloseId(null)}>
            <p className="mb-6 text-sm text-slate-600">
              Yopilgan so'rovnomani tahrirlab bo'lmaydi. Davom etasizmi?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCloseId(null)} disabled={closing}>
                Bekor qilish
              </Button>
              <Button variant="danger" onClick={handleClose} disabled={closing}>
                {closing ? 'Yopilmoqda...' : 'Yopish'}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
