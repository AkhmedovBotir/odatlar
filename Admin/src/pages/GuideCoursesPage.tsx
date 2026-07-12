import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, GraduationCap, BookOpen } from 'lucide-react'
import { listGuideCourses, deleteGuideCourse } from '../api/courses'
import type { GuideCourse } from '../types/guideCourse'
import { useSnackbar } from '../context/SnackbarContext'
import { getApiErrorMessage } from '../lib/apiMessage'
import { Button } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

export function GuideCoursesPage() {
  const snackbar = useSnackbar()
  const [courses, setCourses] = useState<GuideCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      setCourses(await listGuideCourses())
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Kurslarni yuklashda xato'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteGuideCourse(deleteId)
      setDeleteId(null)
      snackbar.success('Kurs o\'chirildi')
      await fetchCourses()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'O\'chirishda xato'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Qo'llanmalar"
        title="Kurslar"
        description="Bo'limlar va darslardan iborat qo'llanma kurslari"
        action={
          <Link to="/guides/courses/new">
            <Button>
              <Plus className="h-4 w-4" />
              Kurs qo'shish
            </Button>
          </Link>
        }
      />

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Kurs
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Slug
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Dars / Bo'lim
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tartib
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Holat
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Yuklanmoqda...
                    </div>
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <GraduationCap className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    Hali kurslar yo'q
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{course.title}</p>
                          {course.description && (
                            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{course.id}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {course.lessonCount ?? 0} / {course.sectionCount ?? 0}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {course.sortOrder ?? 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={course.isPublished ? 'success' : 'neutral'}>
                        {course.isPublished ? 'Nashr' : 'Qoralama'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <Link to={`/guides/courses/${course.id}/edit`}>
                          <Button type="button" variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(course.id)}
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
      </Card>

      <AnimatePresence>
        {deleteId && (
          <Modal title="Kursni o'chirish" onClose={() => setDeleteId(null)} size="sm">
            <p className="text-sm text-slate-600">
              Bu kursni o'chirmoqchimisiz? Barcha darslar va kontent ham o'chiriladi.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                Bekor qilish
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'O\'chirilmoqda...' : 'O\'chirish'}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
