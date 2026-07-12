import { useRef, useState, type ChangeEvent } from 'react'
import { ImageIcon, Loader2, Trash2, Upload, Video } from 'lucide-react'
import type { LessonBlock } from '../../types/guideCourse'
import { BLOCK_TYPE_LABELS } from '../../types/guideCourse'
import { uploadGuidePoster, uploadGuideVideo, resolveMediaUrl } from '../../api/guides'
import { deltaToText, textToDelta } from '../../lib/guideCourseUtils'
import { ApiClientError } from '../../api/client'
import { Button, Input, Textarea } from '../ui/Form'

const POSTER_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v'

function isUploadedPath(value: string): boolean {
  return value.startsWith('/api/v1/uploads/')
}

export function LessonBlockEditor({
  block,
  onChange,
  onDelete,
}: {
  block: LessonBlock
  onChange: (block: LessonBlock) => void
  onDelete: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const posterRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  async function uploadPoster(file: File, onPath: (path: string) => void) {
    setUploading(true)
    setUploadError('')
    try {
      const res = await uploadGuidePoster(file)
      onPath(res.path)
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : 'Yuklashda xato')
    } finally {
      setUploading(false)
    }
  }

  async function uploadVideo(file: File, onPath: (path: string) => void) {
    setUploading(true)
    setUploadError('')
    try {
      const res = await uploadGuideVideo(file)
      onPath(res.path)
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : 'Yuklashda xato')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {BLOCK_TYPE_LABELS[block.type]}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      {uploadError && <p className="mb-2 text-xs text-red-600">{uploadError}</p>}

      {block.type === 'title' && (
        <Input
          label="Matn"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      )}

      {block.type === 'description' && (
        <Textarea
          label="Matn"
          value={deltaToText(block.delta)}
          onChange={(e) => onChange({ ...block, delta: textToDelta(e.target.value) })}
          rows={4}
          hint="Oddiy matn (Quill delta formatida saqlanadi)"
        />
      )}

      {block.type === 'video' && (
        <div className="space-y-3">
          <Input
            label="Video URL yoki path"
            value={block.src}
            onChange={(e) => onChange({ ...block, src: e.target.value })}
            placeholder="https://... yoki /api/v1/uploads/guides/videos/..."
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Video className="h-4 w-4" />
            )}
            Video fayl yuklash
            <input
              ref={videoRef}
              type="file"
              accept={VIDEO_ACCEPT}
              className="hidden"
              disabled={uploading}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0]
                if (file) uploadVideo(file, (path) => onChange({ ...block, src: path }))
                if (videoRef.current) videoRef.current.value = ''
              }}
            />
          </label>
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Poster</p>
            {block.poster && (
              <img
                src={resolveMediaUrl(block.poster)}
                alt=""
                className="mb-2 h-16 w-28 rounded object-cover ring-1 ring-slate-200"
              />
            )}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <ImageIcon className="h-4 w-4" />
              Poster yuklash
              <input
                ref={posterRef}
                type="file"
                accept={POSTER_ACCEPT}
                className="hidden"
                disabled={uploading}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0]
                  if (file) uploadPoster(file, (path) => onChange({ ...block, poster: path }))
                  if (posterRef.current) posterRef.current.value = ''
                }}
              />
            </label>
          </div>
          <Input
            label="Izoh"
            value={block.caption ?? ''}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
          />
        </div>
      )}

      {block.type === 'image' && (
        <div className="space-y-3">
          <Input
            label="Rasm URL yoki path"
            value={block.src}
            onChange={(e) => onChange({ ...block, src: e.target.value })}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <Upload className="h-4 w-4" />
            Rasm yuklash
            <input
              ref={imageRef}
              type="file"
              accept={POSTER_ACCEPT}
              className="hidden"
              disabled={uploading}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0]
                if (file) uploadPoster(file, (path) => onChange({ ...block, src: path }))
                if (imageRef.current) imageRef.current.value = ''
              }}
            />
          </label>
          {block.src && (
            <img
              src={resolveMediaUrl(block.src)}
              alt=""
              className="h-16 w-28 rounded object-cover ring-1 ring-slate-200"
            />
          )}
          <Input
            label="Alt matn"
            value={block.alt ?? ''}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
          />
          <Input
            label="Izoh"
            value={block.caption ?? ''}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
          />
        </div>
      )}

      {block.type === 'link' && (
        <div className="space-y-3">
          <Input
            label="Havola"
            value={block.href}
            onChange={(e) => onChange({ ...block, href: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="Yozuv"
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
          />
          <Input
            label="Tavsif"
            value={block.description ?? ''}
            onChange={(e) => onChange({ ...block, description: e.target.value })}
          />
        </div>
      )}

      {block.type === 'file' && (
        <div className="space-y-3">
          <Input
            label="Fayl URL"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
          />
          <Input
            label="Sarlavha"
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Kengaytma"
              value={block.ext}
              onChange={(e) => onChange({ ...block, ext: e.target.value })}
              placeholder="pdf"
            />
            <Input
              label="Hajm"
              value={block.sizeLabel}
              onChange={(e) => onChange({ ...block, sizeLabel: e.target.value })}
              placeholder="2 MB"
            />
          </div>
          <Input
            label="Tavsif"
            value={block.description ?? ''}
            onChange={(e) => onChange({ ...block, description: e.target.value })}
          />
        </div>
      )}

      {block.type === 'video' && block.src && isUploadedPath(block.src) && (
        <p className="mt-2 truncate font-mono text-xs text-slate-400">{block.src}</p>
      )}
    </div>
  )
}
