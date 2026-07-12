import { ChevronDown, ChevronUp, FolderOpen, Plus, Trash2 } from 'lucide-react'
import type { CourseNode, LessonBlockType, LessonNode, SectionNode } from '../../types/guideCourse'
import { BLOCK_TYPE_LABELS } from '../../types/guideCourse'
import { createBlock, createLesson, createSection, isLesson, isSection } from '../../lib/guideCourseUtils'
import { Button, Input } from '../ui/Form'
import { LessonBlockEditor } from './LessonBlockEditor'

function LessonEditor({
  lesson,
  onChange,
  onDelete,
}: {
  lesson: LessonNode
  onChange: (lesson: LessonNode) => void
  onDelete: () => void
}) {
  function updateBlock(index: number, block: LessonNode['blocks'][number]) {
    const blocks = [...lesson.blocks]
    blocks[index] = block
    onChange({ ...lesson, blocks })
  }

  function removeBlock(index: number) {
    if (lesson.blocks.length <= 1) return
    onChange({ ...lesson, blocks: lesson.blocks.filter((_, i) => i !== index) })
  }

  function addBlock(type: LessonBlockType) {
    onChange({ ...lesson, blocks: [...lesson.blocks, createBlock(type)] })
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Dars ID"
              value={lesson.id}
              onChange={(e) => onChange({ ...lesson, id: e.target.value })}
              hint="URL identifikator"
            />
            <Input
              label="Sarlavha"
              value={lesson.title}
              onChange={(e) => onChange({ ...lesson, title: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Qisqa tavsif"
              value={lesson.subtitle ?? ''}
              onChange={(e) => onChange({ ...lesson, subtitle: e.target.value })}
            />
            <Input
              label="Davomiylik (daqiqa)"
              inputMode="numeric"
              value={lesson.durationMin != null ? String(lesson.durationMin) : ''}
              onChange={(e) =>
                onChange({
                  ...lesson,
                  durationMin: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined,
                })
              }
            />
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Kontent bloklari
      </p>
      <div className="space-y-3">
        {lesson.blocks.map((block, i) => (
          <LessonBlockEditor
            key={block.id}
            block={block}
            onChange={(b) => updateBlock(i, b)}
            onDelete={() => removeBlock(i)}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {(Object.keys(BLOCK_TYPE_LABELS) as LessonBlockType[]).map((type) => (
          <Button key={type} type="button" variant="outline" size="sm" onClick={() => addBlock(type)}>
            <Plus className="h-3 w-3" />
            {BLOCK_TYPE_LABELS[type]}
          </Button>
        ))}
      </div>
    </div>
  )
}

function SectionEditor({
  section,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  section: SectionNode
  onChange: (section: SectionNode) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}) {
  function updateLesson(index: number, lesson: LessonNode) {
    const children = [...section.children]
    children[index] = lesson
    onChange({ ...section, children })
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-4">
      <div className="mb-4 flex items-start gap-2">
        <FolderOpen className="mt-1 h-5 w-5 shrink-0 text-violet-500" />
        <div className="flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Bo'lim ID"
              value={section.id}
              onChange={(e) => onChange({ ...section, id: e.target.value })}
            />
            <Input
              label="Sarlavha"
              value={section.title}
              onChange={(e) => onChange({ ...section, title: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-1">
          {onMoveUp && (
            <Button type="button" variant="ghost" size="sm" disabled={!canMoveUp} onClick={onMoveUp}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
          {onMoveDown && (
            <Button type="button" variant="ghost" size="sm" disabled={!canMoveDown} onClick={onMoveDown}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="space-y-4 pl-2">
        {section.children.map((lesson, i) => (
          <LessonEditor
            key={lesson.id}
            lesson={lesson}
            onChange={(l) => updateLesson(i, l)}
            onDelete={() => {
              if (section.children.length <= 1) return
              onChange({ ...section, children: section.children.filter((_, j) => j !== i) })
            }}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => onChange({ ...section, children: [...section.children, createLesson()] })}
      >
        <Plus className="h-4 w-4" />
        Dars qo'shish
      </Button>
    </div>
  )
}

export function CourseTreeEditor({
  children,
  onChange,
}: {
  children: CourseNode[]
  onChange: (children: CourseNode[]) => void
}) {
  function updateNode(index: number, node: CourseNode) {
    const next = [...children]
    next[index] = node
    onChange(next)
  }

  function removeNode(index: number) {
    onChange(children.filter((_, i) => i !== index))
  }

  function moveNode(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= children.length) return
    const next = [...children]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {children.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-sm text-slate-400">
          Hali dars yoki bo'lim yo'q
        </p>
      )}

      {children.map((node, i) =>
        isLesson(node) ? (
          <div key={node.id} className="relative">
            <LessonEditor
              lesson={node}
              onChange={(l) => updateNode(i, l)}
              onDelete={() => removeNode(i)}
            />
          </div>
        ) : isSection(node) ? (
          <SectionEditor
            key={node.id}
            section={node}
            onChange={(s) => updateNode(i, s)}
            onDelete={() => removeNode(i)}
            onMoveUp={() => moveNode(i, -1)}
            onMoveDown={() => moveNode(i, 1)}
            canMoveUp={i > 0}
            canMoveDown={i < children.length - 1}
          />
        ) : null,
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => onChange([...children, createLesson()])}>
          <Plus className="h-4 w-4" />
          Dars qo'shish
        </Button>
        <Button type="button" variant="outline" onClick={() => onChange([...children, createSection()])}>
          <Plus className="h-4 w-4" />
          Bo'lim qo'shish
        </Button>
      </div>
    </div>
  )
}
