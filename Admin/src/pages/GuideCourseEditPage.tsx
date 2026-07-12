import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { createGuideCourse, getGuideCourse, updateGuideCourse } from '../api/courses'
import type { CourseNode } from '../types/guideCourse'
import { useSnackbar } from '../context/SnackbarContext'
import { getApiErrorMessage } from '../lib/apiMessage'
import { countNodes, createLesson } from '../lib/guideCourseUtils'
import { syncSlugWithTitle } from '../lib/slugify'
import { CourseTreeEditor } from '../components/guides/CourseTreeEditor'
import { Button, Input, Textarea, Toggle } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { SlugHint } from '../components/ui/SlugHint'

type CourseForm = {
  slug: string
  title: string
  description: string
  sort_order: string
  is_published: boolean
  children: CourseNode[]
}

const emptyForm: CourseForm = {
  slug: '',
  title: '',
  description: '',
  sort_order: '0',
  is_published: true,
  children: [createLesson()],
}

export function GuideCourseEditPage() {
  const snackbar = useSnackbar()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isNew = location.pathname.endsWith('/new')
  const courseRef = isNew ? '' : (id ?? '')

  const [form, setForm] = useState<CourseForm>(emptyForm)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!courseRef) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const course = await getGuideCourse(courseRef)
      setForm({
        slug: course.id,
        title: course.title,
        description: course.description ?? '',
        sort_order: String(course.sortOrder ?? 0),
        is_published: course.isPublished ?? true,
        children: course.children?.length ? course.children : [createLesson()],
      })
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Kursni yuklashda xato'))
    } finally {
      setLoading(false)
    }
  }, [courseRef])

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.slug.trim() || !form.title.trim()) {
      snackbar.error('Slug va sarlavha majburiy')
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      snackbar.error('Slug: faqat kichik harf, raqam va tire (masalan: intizom-darsi)')
      return
    }
    if (form.children.length === 0) {
      snackbar.error('Kamida bitta dars yoki bo\'lim qo\'shing')
      return
    }

    const body = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      children: form.children,
      sort_order: form.sort_order !== '' ? Number(form.sort_order) : 0,
      is_published: form.is_published,
    }

    setSaving(true)
    try {
      if (isNew) {
        const created = await createGuideCourse(body)
        snackbar.success('Kurs yaratildi')
        navigate(`/guides/courses/${created.id}/edit`, { replace: true })
      } else {
        await updateGuideCourse(courseRef, body)
        snackbar.success('Kurs saqlandi')
      }
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Saqlashda xato'))
    } finally {
      setSaving(false)
    }
  }

  const counts = countNodes(form.children)

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
        breadcrumb="Qo'llanmalar"
        title={isNew ? 'Yangi kurs' : 'Kursni tahrirlash'}
        description={
          isNew
            ? 'Slug, darslar va kontent bloklarini sozlang'
            : `${counts.lessons} dars, ${counts.sections} bo'lim`
        }
        action={
          <Link to="/guides/courses">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Orqaga
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-slate-900">Asosiy ma'lumotlar</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Input
                label="Sarlavha"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
              <SlugHint slug={form.slug} />
            </div>
            <Input
              label="Tartib"
              inputMode="numeric"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: e.target.value.replace(/[^\d-]/g, '') })
              }
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Tavsif"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="mt-4">
            <Toggle
              label="Nashr qilingan"
              description="Mini App'da ko'rinadi"
              checked={form.is_published}
              onChange={(v) => setForm({ ...form, is_published: v })}
            />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Darslar va bo'limlar
          </h3>
          <CourseTreeEditor
            children={form.children}
            onChange={(children) => setForm({ ...form, children })}
          />
        </Card>

        <div className="flex justify-end gap-2">
          <Link to="/guides/courses">
            <Button type="button" variant="outline" disabled={saving}>
              Bekor qilish
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </form>
    </div>
  )
}
