import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  ExternalLink,
  Upload,
  Link2,
  Loader2,
  HardDrive,
} from 'lucide-react'
import {
  listGuideFiles,
  createGuideFile,
  updateGuideFile,
  deleteGuideFile,
  uploadGuideFile,
} from '../api/files'
import { resolveMediaUrl } from '../api/guides'
import type { CreateGuideFileRequest, GuideFile, UpdateGuideFileRequest } from '../api/types'
import { useSnackbar } from '../context/SnackbarContext'
import { getApiErrorMessage } from '../lib/apiMessage'
import { syncSlugWithTitle } from '../lib/slugify'
import { Button, Input, Textarea, Toggle } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { SlugHint } from '../components/ui/SlugHint'

type FormMode = 'create' | 'edit' | null
type UrlMode = 'upload' | 'url'

type FileForm = {
  slug: string
  title: string
  description: string
  url: string
  ext: string
  size_bytes: string
  size_label: string
  sort_order: string
  is_published: boolean
}

const emptyForm: FileForm = {
  slug: '',
  title: '',
  description: '',
  url: '',
  ext: '',
  size_bytes: '',
  size_label: '',
  sort_order: '0',
  is_published: true,
}

const FILE_ACCEPT =
  '.txt,.pdf,.doc,.docx,.zip,.xls,.xlsx,.ppt,.pptx,.csv,.md,application/pdf,text/plain'

function isUploadedPath(value: string): boolean {
  return value.startsWith('/api/v1/uploads/guides/files/')
}

function detectUrlMode(url: string): UrlMode {
  if (!url) return 'upload'
  return isUploadedPath(url) ? 'upload' : 'url'
}

function toForm(file: GuideFile, slug?: string): FileForm {
  return {
    slug: slug ?? file.id,
    title: file.title,
    description: file.description ?? '',
    url: file.url,
    ext: file.ext,
    size_bytes: file.sizeBytes != null ? String(file.sizeBytes) : '',
    size_label: file.sizeLabel ?? '',
    sort_order: file.sortOrder != null ? String(file.sortOrder) : '0',
    is_published: file.isPublished ?? true,
  }
}

function toRequest(form: FileForm, isUpdate: boolean): CreateGuideFileRequest | UpdateGuideFileRequest {
  const base = {
    slug: form.slug.trim(),
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    url: form.url.trim(),
    ext: form.ext.trim().replace(/^\./, ''),
    size_bytes: form.size_bytes !== '' ? Number(form.size_bytes) : undefined,
    sort_order: form.sort_order !== '' ? Number(form.sort_order) : 0,
  }
  if (isUpdate) {
    return { ...base, is_published: form.is_published }
  }
  return { ...base, is_published: form.is_published }
}

export function GuideFilesPage() {
  const snackbar = useSnackbar()
  const [files, setFiles] = useState<GuideFile[]>([])
  const [loading, setLoading] = useState(true)

  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FileForm>(emptyForm)
  const [urlMode, setUrlMode] = useState<UrlMode>('upload')
  const [saving, setSaving] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      setFiles(await listGuideFiles())
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Fayllarni yuklashda xato'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  function openCreate() {
    setForm(emptyForm)
    setUrlMode('upload')
    setEditingId(null)
    setFormMode('create')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openEdit(file: GuideFile) {
    setForm(toForm(file))
    setUrlMode(detectUrlMode(file.url))
    setEditingId(file.id)
    setFormMode('edit')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setForm(emptyForm)
    setUrlMode('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function switchUrlMode(mode: UrlMode) {
    setUrlMode(mode)
    if (mode === 'url' && isUploadedPath(form.url)) {
      setForm((f) => ({ ...f, url: '', ext: '', size_bytes: '', size_label: '' }))
    }
    if (mode === 'upload' && form.url && !isUploadedPath(form.url)) {
      setForm((f) => ({ ...f, url: '', ext: '', size_bytes: '', size_label: '' }))
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileUploading(true)
    try {
      const res = await uploadGuideFile(file)
      setForm((f) => ({
        ...f,
        url: res.path,
        ext: res.ext,
        size_bytes: String(res.sizeBytes),
        size_label: res.sizeLabel,
      }))
      setUrlMode('upload')
    } catch (err) {
      snackbar.error(getApiErrorMessage(err, 'Fayl yuklashda xato'))
    } finally {
      setFileUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: syncSlugWithTitle(title, formMode === 'create', f.slug),
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.slug.trim() || !form.title.trim() || !form.url.trim() || !form.ext.trim()) {
      snackbar.error('Sarlavha, URL va kengaytma majburiy')
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      snackbar.error('Slug: faqat kichik harf, raqam va tire')
      return
    }
    if (fileUploading) {
      snackbar.error('Fayl yuklanishi tugashini kuting')
      return
    }

    setSaving(true)
    try {
      if (formMode === 'create') {
        await createGuideFile(toRequest(form, false) as CreateGuideFileRequest)
        snackbar.success('Fayl muvaffaqiyatli qo\'shildi')
      } else if (formMode === 'edit' && editingId) {
        await updateGuideFile(editingId, toRequest(form, true) as UpdateGuideFileRequest)
        snackbar.success('Fayl yangilandi')
      }
      closeForm()
      await fetchFiles()
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
      await deleteGuideFile(deleteId)
      setDeleteId(null)
      snackbar.success('Fayl o\'chirildi')
      await fetchFiles()
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
        title="Fayllar"
        description="Yuklab olinadigan materiallar (PDF, TXT, DOC va boshqalar)"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Fayl qo'shish
          </Button>
        }
      />

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Fayl
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Slug
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tur / Hajm
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
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    Hali fayllar yo'q
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{file.title}</p>
                          {file.description && (
                            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                              {file.description}
                            </p>
                          )}
                          <a
                            href={resolveMediaUrl(file.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Yuklab olish
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{file.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{file.ext.toUpperCase()}</Badge>
                        {file.sizeLabel && (
                          <span className="text-xs text-slate-500">{file.sizeLabel}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {file.sortOrder ?? 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={file.isPublished ? 'success' : 'neutral'}>
                        {file.isPublished ? 'Nashr' : 'Qoralama'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(file)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(file.id)}
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
            title={formMode === 'create' ? 'Yangi fayl' : 'Faylni tahrirlash'}
            onClose={closeForm}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  label="Sarlavha"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
                <SlugHint slug={form.slug} />
              </div>

              <Textarea
                label="Tavsif"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />

              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Fayl manbasi</span>
                <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => switchUrlMode('upload')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                      urlMode === 'upload'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Fayl yuklash
                  </button>
                  <button
                    type="button"
                    onClick={() => switchUrlMode('url')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                      urlMode === 'url'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Tashqi URL
                  </button>
                </div>

                {urlMode === 'upload' ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
                    {form.url && isUploadedPath(form.url) ? (
                      <div className="mb-3 flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3">
                        <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-xs text-slate-600">{form.url}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {form.ext.toUpperCase()}
                            {form.size_label ? ` · ${form.size_label}` : ''}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                url: '',
                                ext: '',
                                size_bytes: '',
                                size_label: '',
                              }))
                            }
                            className="mt-1 text-xs text-red-600 hover:text-red-700"
                          >
                            Olib tashlash
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50/50">
                      {fileUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {fileUploading ? 'Yuklanmoqda...' : 'Fayl tanlash'}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={FILE_ACCEPT}
                        className="hidden"
                        disabled={fileUploading}
                        onChange={handleFileUpload}
                      />
                    </label>
                    <p className="mt-2 text-center text-xs text-slate-400">
                      txt, pdf, doc, docx, zip, xls, xlsx, ppt, pptx, csv, md — max 20 MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      label="Tashqi URL"
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      placeholder="https://example.com/qollanma.pdf"
                      required
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Kengaytma"
                        value={form.ext}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            ext: e.target.value.replace(/^\./, '').toLowerCase(),
                          })
                        }
                        placeholder="pdf"
                        required
                      />
                      <Input
                        label="Hajm (bayt)"
                        inputMode="numeric"
                        value={form.size_bytes}
                        onChange={(e) =>
                          setForm({ ...form, size_bytes: e.target.value.replace(/\D/g, '') })
                        }
                        placeholder="1258291"
                      />
                    </div>
                  </div>
                )}
              </div>

              {urlMode === 'upload' && form.ext && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Kengaytma" value={form.ext} disabled />
                  <Input
                    label="Hajm"
                    value={form.size_label || (form.size_bytes ? `${form.size_bytes} B` : '')}
                    disabled
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Tartib"
                  inputMode="numeric"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: e.target.value.replace(/[^\d-]/g, '') })
                  }
                />
                <div className="flex items-end">
                  <Toggle
                    label="Nashr qilingan"
                    description="Mini App'da ko'rinadi"
                    checked={form.is_published}
                    onChange={(v) => setForm({ ...form, is_published: v })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={saving || fileUploading}
                >
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={saving || fileUploading}>
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <Modal title="Faylni o'chirish" onClose={() => setDeleteId(null)} size="sm">
            <p className="text-sm text-slate-600">
              Bu faylni o'chirmoqchimisiz? Diskdagi nusxa ham o'chiriladi.
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
