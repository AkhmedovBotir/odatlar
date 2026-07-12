import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  Heart,
  MessageSquare,
  ExternalLink,
  Clock,
  Upload,
  ImageIcon,
  Link2,
  Loader2,
} from 'lucide-react'
import {
  listGuideVideos,
  createGuideVideo,
  updateGuideVideo,
  deleteGuideVideo,
  uploadGuidePoster,
  uploadGuideVideo,
  resolveMediaUrl,
} from '../api/guides'
import type { CreateGuideVideoRequest, GuideVideo, UpdateGuideVideoRequest } from '../api/types'
import { useSnackbar } from '../context/SnackbarContext'
import { getApiErrorMessage } from '../lib/apiMessage'
import { Button, Input, Textarea, Toggle } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

type FormMode = 'create' | 'edit' | null
type VideoSrcMode = 'url' | 'upload'

type VideoForm = {
  title: string
  description: string
  src: string
  poster: string
  duration_min: string
  sort_order: string
  is_published: boolean
}

const emptyForm: VideoForm = {
  title: '',
  description: '',
  src: '',
  poster: '',
  duration_min: '',
  sort_order: '0',
  is_published: true,
}

const POSTER_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif'
const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v'

function isUploadedPath(value: string): boolean {
  return value.startsWith('/api/v1/uploads/')
}

function detectVideoSrcMode(src: string): VideoSrcMode {
  return isUploadedPath(src) ? 'upload' : 'url'
}

function toForm(video: GuideVideo): VideoForm {
  return {
    title: video.title,
    description: video.description ?? '',
    src: video.src,
    poster: video.poster ?? '',
    duration_min: video.durationMin != null ? String(video.durationMin) : '',
    sort_order: video.sortOrder != null ? String(video.sortOrder) : '0',
    is_published: video.isPublished ?? true,
  }
}

function toRequest(form: VideoForm, isUpdate: boolean): CreateGuideVideoRequest | UpdateGuideVideoRequest {
  const base = {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    src: form.src.trim(),
    poster: form.poster.trim() || undefined,
    duration_min: form.duration_min !== '' ? Number(form.duration_min) : undefined,
    sort_order: form.sort_order !== '' ? Number(form.sort_order) : 0,
  }
  if (isUpdate) {
    return { ...base, is_published: form.is_published }
  }
  return { ...base, is_published: form.is_published }
}

export function GuideVideosPage() {
  const snackbar = useSnackbar()
  const [videos, setVideos] = useState<GuideVideo[]>([])
  const [loading, setLoading] = useState(true)

  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<VideoForm>(emptyForm)
  const [videoSrcMode, setVideoSrcMode] = useState<VideoSrcMode>('url')
  const [saving, setSaving] = useState(false)
  const [posterUploading, setPosterUploading] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const posterInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listGuideVideos()
      setVideos(data)
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Videolarni yuklashda xato'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  function resetFileInputs() {
    if (posterInputRef.current) posterInputRef.current.value = ''
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  function openCreate() {
    setForm(emptyForm)
    setVideoSrcMode('url')
    setEditingId(null)
    setFormMode('create')
    resetFileInputs()
  }

  function openEdit(video: GuideVideo) {
    setForm(toForm(video))
    setVideoSrcMode(detectVideoSrcMode(video.src))
    setEditingId(video.id)
    setFormMode('edit')
    resetFileInputs()
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setForm(emptyForm)
    setVideoSrcMode('url')
    resetFileInputs()
  }

  function switchVideoSrcMode(mode: VideoSrcMode) {
    setVideoSrcMode(mode)
    setForm((f) => ({
      ...f,
      src: mode === 'url' && isUploadedPath(f.src) ? '' : mode === 'upload' && !isUploadedPath(f.src) ? '' : f.src,
    }))
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  async function handlePosterUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPosterUploading(true)
    try {
      const res = await uploadGuidePoster(file)
      setForm((f) => ({ ...f, poster: res.path }))
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Poster yuklashda xato'))
    } finally {
      setPosterUploading(false)
      if (posterInputRef.current) posterInputRef.current.value = ''
    }
  }

  async function handleVideoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setVideoUploading(true)
    try {
      const res = await uploadGuideVideo(file)
      setForm((f) => ({ ...f, src: res.path }))
      setVideoSrcMode('upload')
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Video yuklashda xato'))
    } finally {
      setVideoUploading(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.src.trim()) {
      snackbar.error('Sarlavha va video manbasi majburiy')
      return
    }
    if (posterUploading || videoUploading) {
      snackbar.error('Fayl yuklanishi tugashini kuting')
      return
    }

    setSaving(true)
    try {
      if (formMode === 'create') {
        await createGuideVideo(toRequest(form, false) as CreateGuideVideoRequest)
        snackbar.success('Video muvaffaqiyatli qo\'shildi')
      } else if (formMode === 'edit' && editingId) {
        await updateGuideVideo(editingId, toRequest(form, true) as UpdateGuideVideoRequest)
        snackbar.success('Video yangilandi')
      }
      closeForm()
      await fetchVideos()
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Saqlashda xato'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteGuideVideo(deleteId)
      setDeleteId(null)
      snackbar.success('Video o\'chirildi')
      await fetchVideos()
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
        title="Videolar"
        description="Qo'llanmalar bo'limidagi videolarni boshqaring"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Video qo'shish
          </Button>
        }
      />

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Video
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Davomiylik
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tartib
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Holat
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Like / Izoh
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
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Video className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    Hali videolar yo'q
                  </td>
                </tr>
              ) : (
                videos.map((video) => (
                  <tr key={video.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {video.poster ? (
                          <img
                            src={resolveMediaUrl(video.poster)}
                            alt={video.title}
                            className="h-12 w-20 shrink-0 rounded-md object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                            <Video className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{video.title}</p>
                          {video.description && (
                            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                              {video.description}
                            </p>
                          )}
                          <a
                            href={resolveMediaUrl(video.src)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {isUploadedPath(video.src) ? 'Yuklangan video' : 'Video manbasi'}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {video.durationMin != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {video.durationMin} daq
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {video.sortOrder ?? 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={video.isPublished ? 'success' : 'neutral'}>
                        {video.isPublished ? 'Nashr qilingan' : 'Qoralama'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {video.likesCount ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {video.commentsCount ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(video)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(video.id)}
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
        {formMode && (
          <Modal
            title={formMode === 'create' ? 'Yangi video' : 'Videoni tahrirlash'}
            onClose={closeForm}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Sarlavha"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Kirish videosi"
                required
              />

              <Textarea
                label="Tavsif"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Video haqida qisqacha ma'lumot"
                rows={3}
              />

              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Poster rasm</span>
                <p className="text-xs text-slate-500">
                  Faqat fayl yuklash (jpg, png, webp, gif — max 5 MB)
                </p>
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
                  {form.poster ? (
                    <div className="mb-3 flex items-start gap-3">
                      <img
                        src={resolveMediaUrl(form.poster)}
                        alt="Poster"
                        className="h-20 w-32 rounded-md object-cover ring-1 ring-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs text-slate-500">{form.poster}</p>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, poster: '' }))}
                          className="mt-1 text-xs text-red-600 hover:text-red-700"
                        >
                          Olib tashlash
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50/50">
                    {posterUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                    {posterUploading ? 'Yuklanmoqda...' : 'Poster tanlash'}
                    <input
                      ref={posterInputRef}
                      type="file"
                      accept={POSTER_ACCEPT}
                      className="hidden"
                      disabled={posterUploading}
                      onChange={handlePosterUpload}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Video manbasi</span>
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => switchVideoSrcMode('url')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                      videoSrcMode === 'url'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Tashqi URL
                  </button>
                  <button
                    type="button"
                    onClick={() => switchVideoSrcMode('upload')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                      videoSrcMode === 'upload'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Fayl yuklash
                  </button>
                </div>

                {videoSrcMode === 'url' ? (
                  <Input
                    value={form.src}
                    onChange={(e) => setForm({ ...form, src: e.target.value })}
                    placeholder="https://cdn.example.com/videos/kirish.mp4"
                    hint="Tashqi https:// video URL"
                    required
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
                    {form.src && isUploadedPath(form.src) ? (
                      <div className="mb-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                        <p className="truncate font-mono text-xs text-slate-600">{form.src}</p>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, src: '' }))}
                          className="mt-1 text-xs text-red-600 hover:text-red-700"
                        >
                          Olib tashlash
                        </button>
                      </div>
                    ) : null}
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50/50">
                      {videoUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : (
                        <Video className="h-4 w-4" />
                      )}
                      {videoUploading ? 'Yuklanmoqda...' : 'Video fayl tanlash'}
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept={VIDEO_ACCEPT}
                        className="hidden"
                        disabled={videoUploading}
                        onChange={handleVideoUpload}
                      />
                    </label>
                    <p className="mt-2 text-center text-xs text-slate-400">
                      mp4, webm, mov, m4v — max 200 MB
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Davomiyligi (daqiqa)"
                  inputMode="numeric"
                  value={form.duration_min}
                  onChange={(e) =>
                    setForm({ ...form, duration_min: e.target.value.replace(/[^\d]/g, '') })
                  }
                  placeholder="8"
                />
                <Input
                  label="Tartib (sort_order)"
                  inputMode="numeric"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: e.target.value.replace(/[^\d-]/g, '') })
                  }
                  hint="Kichik raqam = yuqorida"
                />
              </div>

              <Toggle
                label="Nashr qilingan"
                description="Foydalanuvchilar Mini App'da ko'radi"
                checked={form.is_published}
                onChange={(v) => setForm({ ...form, is_published: v })}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={saving || posterUploading || videoUploading}
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  disabled={saving || posterUploading || videoUploading}
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <Modal title="Videoni o'chirish" onClose={() => setDeleteId(null)} size="sm">
            <p className="text-sm text-slate-600">
              Bu videoni o'chirmoqchimisiz? Barcha like va izohlar ham o'chiriladi.
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
