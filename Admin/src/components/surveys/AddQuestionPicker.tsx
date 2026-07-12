import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import type { SurveyQuestionType } from '../../types/survey'
import { QUESTION_TYPE_LABELS } from '../../types/survey'
import {
  QUESTION_TYPE_GROUPS,
  QUESTION_TYPE_META,
  QUICK_ADD_TYPES,
} from '../../lib/questionTypeMeta'
import { Modal } from '../ui/Modal'
import { Button, Input } from '../ui/Form'

type CategoryFilter = 'all' | string

export function AddQuestionPicker({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (type: SurveyQuestionType) => void
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return QUESTION_TYPE_GROUPS.map((group) => ({
      ...group,
      types: group.types.filter((type) => {
        if (category !== 'all' && group.id !== category) return false
        if (!q) return true
        const label = QUESTION_TYPE_LABELS[type].toLowerCase()
        const desc = QUESTION_TYPE_META[type].description.toLowerCase()
        return label.includes(q) || desc.includes(q) || type.includes(q)
      }),
    })).filter((g) => g.types.length > 0)
  }, [search, category])

  function handleAdd(type: SurveyQuestionType) {
    onAdd(type)
    onClose()
    setSearch('')
    setCategory('all')
  }

  return (
    <AnimatePresence>
      {open && (
        <Modal title="Savol qo'shish" onClose={onClose} size="xl">
          <div className="space-y-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Savol turini qidiring..."
                className="pl-9"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tez qo&apos;shish
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ADD_TYPES.map((type) => {
                  const Icon = QUESTION_TYPE_META[type].icon
                  return (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdd(type)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {QUESTION_TYPE_LABELS[type]}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <CategoryPill
                active={category === 'all'}
                onClick={() => setCategory('all')}
                label="Hammasi"
              />
              {QUESTION_TYPE_GROUPS.map((g) => (
                <CategoryPill
                  key={g.id}
                  active={category === g.id}
                  onClick={() => setCategory(g.id)}
                  label={g.label}
                />
              ))}
            </div>

            <div className="space-y-6">
              {filteredGroups.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Natija topilmadi</p>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.id}>
                    {category === 'all' && (
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {group.label}
                      </p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.types.map((type) => {
                        const meta = QUESTION_TYPE_META[type]
                        const Icon = meta.icon
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleAdd(type)}
                            className="group flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-600 group-hover:text-white">
                              <Icon className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {QUESTION_TYPE_LABELS[type]}
                              </p>
                              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                {meta.description}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  )
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

export function AddQuestionTrigger({
  onClick,
  disabled,
  compact,
}: {
  onClick: () => void
  disabled?: boolean
  compact?: boolean
}) {
  if (disabled) return null

  if (compact) {
    return (
      <Button type="button" size="sm" onClick={onClick}>
        <Plus className="h-4 w-4" />
        Qo&apos;shish
      </Button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 px-4 py-4 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50/60"
    >
      <Plus className="h-5 w-5" />
      Yangi savol yoki bo&apos;lim qo&apos;shish
    </button>
  )
}
