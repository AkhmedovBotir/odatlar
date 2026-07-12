import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type {
  GridItem,
  SurveyFileFormat,
  SurveyOption,
  SurveyQuestion,
  SurveyQuestionType,
} from '../../types/survey'
import { QUESTION_TYPE_LABELS } from '../../types/survey'
import { QUESTION_TYPE_GROUPS } from '../../lib/surveyConstants'
import {
  getExtensionOptionsForType,
  getMimeOptionsForType,
  normalizeAcceptList,
  normalizeStringList,
} from '../../lib/surveyFileFormats'
import { listSurveyFileFormats } from '../../api/surveys'
import {
  countAnswerableQuestions,
  createQuestion,
  isChoiceType,
  isFileType,
  isGridType,
  newId,
} from '../../lib/surveyUtils'
import { AddQuestionPicker, AddQuestionTrigger } from './AddQuestionPicker'
import { QuestionOutline } from './QuestionOutline'
import { EditorSection, QuestionEditorShell } from './QuestionEditorParts'
import { ExtensionPicker, MimeTypePicker } from './MimeTypePicker'
import { Button, Input, Select, Textarea, Toggle } from '../ui/Form'

function OptionsEditor({
  options,
  onChange,
  onAllowOtherChange,
  disabled,
}: {
  options: SurveyOption[]
  onChange: (options: SurveyOption[]) => void
  allowOther?: boolean
  onAllowOtherChange?: (v: boolean) => void
  disabled?: boolean
}) {
  function updateOption(index: number, patch: Partial<SurveyOption>) {
    const next = [...options]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  function removeOption(index: number) {
    if (options.length <= 1) return
    onChange(options.filter((_, i) => i !== index))
  }

  function addOption() {
    onChange([...options, { id: newId('opt'), label: `Variant ${options.length + 1}` }])
  }

  function addOther() {
    if (options.some((o) => o.isOther)) return
    onChange([...options, { id: newId('opt'), label: 'Boshqa', isOther: true }])
    onAllowOtherChange?.(true)
  }

  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {i + 1}
          </span>
          <Input
            value={opt.label}
            onChange={(e) => updateOption(i, { label: e.target.value })}
            className="flex-1"
            disabled={disabled || opt.isOther}
            placeholder="Variant matni"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeOption(i)}
            disabled={disabled || options.length <= 1}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      {!disabled && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-3.5 w-3.5" />
            Variant
          </Button>
          {onAllowOtherChange && !options.some((o) => o.isOther) && (
            <Button type="button" variant="outline" size="sm" onClick={addOther}>
              &quot;Boshqa&quot;
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function GridEditor({
  rows,
  columns,
  onRowsChange,
  onColumnsChange,
  disabled,
}: {
  rows: GridItem[]
  columns: GridItem[]
  onRowsChange: (rows: GridItem[]) => void
  onColumnsChange: (columns: GridItem[]) => void
  disabled?: boolean
}) {
  function updateItem(
    list: GridItem[],
    index: number,
    patch: Partial<GridItem>,
    setter: (v: GridItem[]) => void,
  ) {
    const next = [...list]
    next[index] = { ...next[index], ...patch }
    setter(next)
  }

  function removeItem(list: GridItem[], index: number, setter: (v: GridItem[]) => void) {
    if (list.length <= 1) return
    setter(list.filter((_, i) => i !== index))
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qatorlar</p>
        {rows.map((row, i) => (
          <div key={row.id} className="flex gap-2">
            <Input
              value={row.label}
              onChange={(e) => updateItem(rows, i, { label: e.target.value }, onRowsChange)}
              className="flex-1"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(rows, i, onRowsChange)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRowsChange([...rows, { id: newId('row'), label: `Qator ${rows.length + 1}` }])}
          >
            <Plus className="h-3.5 w-3.5" />
            Qator
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ustunlar</p>
        {columns.map((col, i) => (
          <div key={col.id} className="flex gap-2">
            <Input
              value={col.label}
              onChange={(e) => updateItem(columns, i, { label: e.target.value }, onColumnsChange)}
              className="flex-1"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(columns, i, onColumnsChange)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onColumnsChange([...columns, { id: newId('col'), label: `Ustun ${columns.length + 1}` }])
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Ustun
          </Button>
        )}
      </div>
    </div>
  )
}

function QuestionEditorPanel({
  question,
  index,
  total,
  disabled,
  fileFormats,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  question: SurveyQuestion
  index: number
  total: number
  disabled?: boolean
  fileFormats: SurveyFileFormat[]
  onChange: (q: SurveyQuestion) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const isSection = question.type === 'section'
  const cfg = question.config ?? {}
  const val = question.validation ?? {}

  function setConfig(patch: Partial<NonNullable<SurveyQuestion['config']>>) {
    onChange({ ...question, config: { ...cfg, ...patch } })
  }

  function setValidation(patch: Partial<NonNullable<SurveyQuestion['validation']>>) {
    onChange({ ...question, validation: { ...val, ...patch } })
  }

  function handleTypeChange(type: SurveyQuestionType) {
    if (type === question.type) return
    const fresh = createQuestion(type)
    onChange({ ...fresh, id: question.id, title: question.title || fresh.title })
  }

  const hasChoice = isChoiceType(question.type) && question.options
  const hasFile = isFileType(question.type)
  const hasGrid = isGridType(question.type) && cfg.rows && cfg.columns
  const hasValidation =
    question.type === 'short_text' ||
    question.type === 'long_text' ||
    question.type === 'number'

  return (
    <QuestionEditorShell
      index={index}
      total={total}
      isSection={isSection}
      typeLabel={QUESTION_TYPE_LABELS[question.type]}
      required={question.required}
      disabled={disabled}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
      header={
        <div className="space-y-4">
          <Select
            label="Savol turi"
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value as SurveyQuestionType)}
            disabled={disabled}
          >
            {QUESTION_TYPE_GROUPS.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.types.map((t) => (
                  <option key={t} value={t}>
                    {QUESTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <Input
            label={isSection ? "Bo'lim sarlavhasi" : 'Savol matni'}
            value={question.title ?? ''}
            onChange={(e) => onChange({ ...question, title: e.target.value })}
            disabled={disabled}
            className="text-base"
          />
          {!isSection && (
            <div className="flex flex-wrap items-center gap-4">
              <Toggle
                label="Majburiy javob"
                checked={question.required ?? false}
                onChange={(v) => onChange({ ...question, required: v })}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      }
    >
      {!isSection && (
        <EditorSection title="Yordamchi matn" description="Savol ostida ko'rinadigan izoh" defaultOpen={!!question.description}>
          <Textarea
            value={question.description ?? ''}
            onChange={(e) => onChange({ ...question, description: e.target.value })}
            rows={2}
            disabled={disabled}
            placeholder="Ixtiyoriy qo'shimcha tushuntirish..."
          />
        </EditorSection>
      )}

      {hasChoice && (
        <EditorSection title="Javob variantlari" description="Foydalanuvchi tanlaydigan variantlar">
          <OptionsEditor
            options={question.options!}
            onChange={(options) => onChange({ ...question, options })}
            allowOther={cfg.allowOther}
            onAllowOtherChange={
              question.type !== 'dropdown' ? (v) => setConfig({ allowOther: v }) : undefined
            }
            disabled={disabled}
          />
          {question.type === 'checkbox' && (
            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <Input
                label="Minimal tanlovlar"
                inputMode="numeric"
                value={cfg.minSelections != null ? String(cfg.minSelections) : ''}
                onChange={(e) =>
                  setConfig({
                    minSelections: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined,
                  })
                }
                disabled={disabled}
              />
              <Input
                label="Maksimal tanlovlar"
                inputMode="numeric"
                value={cfg.maxSelections != null ? String(cfg.maxSelections) : ''}
                onChange={(e) =>
                  setConfig({
                    maxSelections: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined,
                  })
                }
                disabled={disabled}
              />
            </div>
          )}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Toggle
              label="Variantlarni aralashtirish"
              checked={cfg.shuffleOptions ?? false}
              onChange={(v) => setConfig({ shuffleOptions: v })}
              disabled={disabled}
            />
          </div>
        </EditorSection>
      )}

      {question.type === 'linear_scale' && (
        <EditorSection title="Shkala sozlamalari">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Min"
              inputMode="numeric"
              value={cfg.scaleMin != null ? String(cfg.scaleMin) : '1'}
              onChange={(e) => setConfig({ scaleMin: Number(e.target.value) || 1 })}
              disabled={disabled}
            />
            <Input
              label="Max"
              inputMode="numeric"
              value={cfg.scaleMax != null ? String(cfg.scaleMax) : '5'}
              onChange={(e) => setConfig({ scaleMax: Number(e.target.value) || 5 })}
              disabled={disabled}
            />
            <Input
              label="Pastki yorliq"
              value={cfg.scaleMinLabel ?? ''}
              onChange={(e) => setConfig({ scaleMinLabel: e.target.value })}
              disabled={disabled}
            />
            <Input
              label="Yuqori yorliq"
              value={cfg.scaleMaxLabel ?? ''}
              onChange={(e) => setConfig({ scaleMaxLabel: e.target.value })}
              disabled={disabled}
            />
          </div>
        </EditorSection>
      )}

      {question.type === 'rating' && (
        <EditorSection title="Reyting sozlamalari">
          <Input
            label="Yulduzlar soni (1–10)"
            inputMode="numeric"
            value={cfg.maxStars != null ? String(cfg.maxStars) : '5'}
            onChange={(e) => {
              const n = Math.min(10, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 5))
              setConfig({ maxStars: n })
            }}
            disabled={disabled}
            className="max-w-xs"
          />
        </EditorSection>
      )}

      {hasGrid && (
        <EditorSection title="Jadval tuzilmasi" description="Qatorlar va ustunlar">
          <GridEditor
            rows={cfg.rows!}
            columns={cfg.columns!}
            onRowsChange={(rows) => setConfig({ rows })}
            onColumnsChange={(columns) => setConfig({ columns })}
            disabled={disabled}
          />
        </EditorSection>
      )}

      {hasFile && (
        <EditorSection title="Fayl yuklash sozlamalari">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Maks. hajm (MB)"
                inputMode="numeric"
                value={cfg.maxFileSizeMb != null ? String(cfg.maxFileSizeMb) : ''}
                onChange={(e) =>
                  setConfig({
                    maxFileSizeMb: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined,
                  })
                }
                disabled={disabled}
              />
              <Input
                label="Maks. fayllar (1–20)"
                inputMode="numeric"
                value={cfg.maxFiles != null ? String(cfg.maxFiles) : ''}
                onChange={(e) =>
                  setConfig({
                    maxFiles: e.target.value
                      ? Math.min(20, Math.max(1, Number(e.target.value.replace(/\D/g, ''))))
                      : undefined,
                  })
                }
                disabled={disabled}
              />
            </div>
            <MimeTypePicker
              options={getMimeOptionsForType(question.type, fileFormats)}
              value={normalizeAcceptList(cfg.accept)}
              onChange={(accept) => setConfig({ accept })}
              disabled={disabled}
            />
            <ExtensionPicker
              options={getExtensionOptionsForType(question.type, fileFormats)}
              value={normalizeStringList(cfg.allowedExtensions)}
              onChange={(allowedExtensions) => setConfig({ allowedExtensions })}
              disabled={disabled}
            />
          </div>
        </EditorSection>
      )}

      {hasValidation && (
        <EditorSection title="Validatsiya" defaultOpen={false}>
          <div className="grid gap-3 sm:grid-cols-2">
            {(question.type === 'short_text' || question.type === 'long_text') && (
              <>
                <Input
                  label="Min uzunlik"
                  inputMode="numeric"
                  value={val.minLength != null ? String(val.minLength) : ''}
                  onChange={(e) =>
                    setValidation({
                      minLength: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined,
                    })
                  }
                  disabled={disabled}
                />
                <Input
                  label="Max uzunlik"
                  inputMode="numeric"
                  value={val.maxLength != null ? String(val.maxLength) : ''}
                  onChange={(e) =>
                    setValidation({
                      maxLength: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : undefined,
                    })
                  }
                  disabled={disabled}
                />
              </>
            )}
            {question.type === 'number' && (
              <>
                <Input
                  label="Min qiymat"
                  inputMode="numeric"
                  value={val.min != null ? String(val.min) : ''}
                  onChange={(e) =>
                    setValidation({
                      min: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  disabled={disabled}
                />
                <Input
                  label="Max qiymat"
                  inputMode="numeric"
                  value={val.max != null ? String(val.max) : ''}
                  onChange={(e) =>
                    setValidation({
                      max: e.target.value !== '' ? Number(e.target.value) : undefined,
                    })
                  }
                  disabled={disabled}
                />
              </>
            )}
          </div>
        </EditorSection>
      )}

      <EditorSection title="Qo'shimcha" description="Texnik identifikator" defaultOpen={false}>
        <Input
          label="Savol ID"
          value={question.id}
          onChange={(e) => onChange({ ...question, id: e.target.value })}
          disabled={disabled}
          className="font-mono text-xs"
          hint="API uchun noyob identifikator"
        />
      </EditorSection>
    </QuestionEditorShell>
  )
}

export function SurveyQuestionEditor({
  questions,
  onChange,
  disabled,
}: {
  questions: SurveyQuestion[]
  onChange: (questions: SurveyQuestion[]) => void
  disabled?: boolean
}) {
  const [fileFormats, setFileFormats] = useState<SurveyFileFormat[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    listSurveyFileFormats()
      .then(setFileFormats)
      .catch(() => setFileFormats([]))
  }, [])

  useEffect(() => {
    if (activeIndex >= questions.length) {
      setActiveIndex(Math.max(0, questions.length - 1))
    }
  }, [questions.length, activeIndex])

  function updateQuestion(index: number, q: SurveyQuestion) {
    const next = [...questions]
    next[index] = q
    onChange(next)
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return
    const next = questions.filter((_, i) => i !== index)
    onChange(next)
    if (activeIndex >= next.length) setActiveIndex(next.length - 1)
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
    if (activeIndex === index) setActiveIndex(target)
    else if (activeIndex === target) setActiveIndex(index)
  }

  function addQuestion(type: SurveyQuestionType) {
    onChange([...questions, createQuestion(type)])
    setActiveIndex(questions.length)
  }

  const activeQuestion = questions[activeIndex]
  const answerable = countAnswerableQuestions(questions)
  const sections = questions.filter((q) => q.type === 'section').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Forma tuzilmasi</p>
          <p className="text-xs text-slate-500">
            {questions.length} element · {answerable} javobli · {sections} bo&apos;lim
          </p>
        </div>
        <AddQuestionTrigger compact onClick={() => setAddOpen(true)} disabled={disabled} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <QuestionOutline
            questions={questions}
            activeIndex={activeIndex}
            disabled={disabled}
            onSelect={setActiveIndex}
            onMove={moveQuestion}
            onDelete={removeQuestion}
          />
        </aside>

        <main className="min-w-0 space-y-4">
          {activeQuestion ? (
            <QuestionEditorPanel
              key={`${activeQuestion.id}-${activeIndex}`}
              question={activeQuestion}
              index={activeIndex}
              total={questions.length}
              disabled={disabled}
              fileFormats={fileFormats}
              onChange={(q) => updateQuestion(activeIndex, q)}
              onDelete={() => removeQuestion(activeIndex)}
              onMoveUp={() => moveQuestion(activeIndex, -1)}
              onMoveDown={() => moveQuestion(activeIndex, 1)}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <p className="text-sm text-slate-500">Savol tanlang yoki yangisini qo&apos;shing</p>
            </div>
          )}
          <AddQuestionTrigger onClick={() => setAddOpen(true)} disabled={disabled} />
        </main>
      </div>

      <AddQuestionPicker
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addQuestion}
      />
    </div>
  )
}
