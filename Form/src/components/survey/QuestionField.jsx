import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { uploadSurveyFile } from '../../api/surveys'
import { isChoiceType, isFileType, isGridType } from '../../lib/surveyConstants'
import { getAcceptAttribute, getAllowedExtensions, validateFileExtension } from '../../lib/surveyUtils'

const inputClass =
  'w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-500'

function RequiredMark({ required }) {
  if (!required) return null
  return <span className="ml-1 text-red-500">*</span>
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-2 text-sm text-red-600">{message}</p>
}

function QuestionShell({ question, index, error, children, disabled }) {
  if (question.type === 'section') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="pt-2"
      >
        <h2 className="border-b border-slate-200 pb-2 text-xl font-medium text-slate-800">
          {question.title}
        </h2>
        {question.description && (
          <p className="mt-2 text-sm text-slate-600">{question.description}</p>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-lg border bg-white p-6 shadow-sm transition ${
        error ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <label className="mb-1 block text-base font-medium text-slate-800">
        {question.title}
        <RequiredMark required={question.required} />
      </label>
      {question.description && (
        <p className="mb-4 text-sm text-slate-500">{question.description}</p>
      )}
      <div className={question.description ? '' : 'mt-3'}>{children}</div>
      <FieldError message={error} />
      {disabled && (
        <p className="mt-3 text-xs text-amber-600">Bu so'rovnoma yopilgan — javob qabul qilinmaydi</p>
      )}
    </motion.div>
  )
}

function ChoiceInput({ question, value, onChange, disabled }) {
  const { type, options = [] } = question

  if (type === 'dropdown') {
    return (
      <select
        className={inputClass}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled}
      >
        <option value="">Tanlang</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  if (type === 'checkbox') {
    const selected = Array.isArray(value) ? value : []
    return (
      <div className="space-y-2">
        {options.map((opt) => {
          const checked = selected.includes(opt.id)
          return (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition ${
                checked
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-slate-200 hover:border-violet-200 hover:bg-slate-50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                checked={checked}
                disabled={disabled}
                onChange={() => {
                  const next = checked
                    ? selected.filter((id) => id !== opt.id)
                    : [...selected, opt.id]
                  onChange(next.length ? next : undefined)
                }}
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const checked = value === opt.id
        return (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition ${
              checked
                ? 'border-violet-400 bg-violet-50'
                : 'border-slate-200 hover:border-violet-200 hover:bg-slate-50'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <input
              type="radio"
              name={question.id}
              className="h-4 w-4 border-slate-300 text-violet-600 focus:ring-violet-500"
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(opt.id)}
            />
            <span className="text-sm text-slate-700">{opt.label}</span>
          </label>
        )
      })}
    </div>
  )
}

function LinearScaleInput({ question, value, onChange, disabled }) {
  const min = question.config?.scaleMin ?? 1
  const max = question.config?.scaleMax ?? 5
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {points.map((point) => (
          <label key={point} className="flex flex-col items-center gap-1">
            <input
              type="radio"
              name={question.id}
              className="h-4 w-4 text-violet-600"
              checked={value === point}
              disabled={disabled}
              onChange={() => onChange(point)}
            />
            <span className="text-sm text-slate-600">{point}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>{question.config?.scaleMinLabel ?? min}</span>
        <span>{question.config?.scaleMaxLabel ?? max}</span>
      </div>
    </div>
  )
}

function RatingInput({ question, value, onChange, disabled }) {
  const maxStars = question.config?.maxStars ?? 5
  return (
    <div className="flex gap-1">
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`text-3xl transition ${
            (value ?? 0) >= star ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
          } disabled:cursor-not-allowed`}
          aria-label={`${star} yulduz`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function GridInput({ question, value, onChange, disabled }) {
  const rows = question.config?.rows ?? []
  const columns = question.config?.columns ?? []
  const answers = value ?? {}
  const isCheckbox = question.type === 'grid_checkbox'

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2" />
            {columns.map((col) => (
              <th key={col.id} className="p-2 text-center font-medium text-slate-600">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="p-2 font-medium text-slate-700">{row.label}</td>
              {columns.map((col) => {
                const rowVal = answers[row.id]
                const checked = isCheckbox
                  ? Array.isArray(rowVal) && rowVal.includes(col.id)
                  : rowVal === col.id

                return (
                  <td key={col.id} className="p-2 text-center">
                    <input
                      type={isCheckbox ? 'checkbox' : 'radio'}
                      name={isCheckbox ? undefined : `${question.id}-${row.id}`}
                      className="h-4 w-4 text-violet-600"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => {
                        if (isCheckbox) {
                          const current = Array.isArray(rowVal) ? rowVal : []
                          const next = checked
                            ? current.filter((id) => id !== col.id)
                            : [...current, col.id]
                          onChange({ ...answers, [row.id]: next.length ? next : undefined })
                        } else {
                          onChange({ ...answers, [row.id]: col.id })
                        }
                      }}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FileUploadInput({ question, surveyId, value, onChange, disabled, error, onUploadError }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const maxFiles = question.config?.maxFiles ?? 1
  const multiple = maxFiles > 1
  const paths = multiple ? (Array.isArray(value) ? value : value ? [value] : []) : value ? [value] : []

  async function handleFiles(fileList) {
    if (!fileList?.length || disabled) return
    const files = Array.from(fileList).slice(0, maxFiles - paths.length)
    if (!files.length) return

    for (const file of files) {
      const validationError = validateFileExtension(file, question)
      if (validationError) {
        onUploadError?.(validationError)
        if (inputRef.current) inputRef.current.value = ''
        return
      }
    }

    setUploading(true)
    try {
      const uploaded = []
      for (const file of files) {
        const result = await uploadSurveyFile(surveyId, question.id, file)
        uploaded.push(result.path || result.url)
      }
      const next = multiple ? [...paths, ...uploaded].slice(0, maxFiles) : uploaded[0]
      onChange(next)
      onUploadError?.('')
    } catch (err) {
      const message = err.message || 'Fayl yuklanmadi'
      onUploadError?.(
        message === 'invalid file type'
          ? `Fayl turi qabul qilinmaydi. Ruxsat etilgan: ${getAllowedExtensions(question).join(', ')}`
          : message,
      )
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removePath(index) {
    if (multiple) {
      const next = paths.filter((_, i) => i !== index)
      onChange(next.length ? next : undefined)
    } else {
      onChange(undefined)
    }
  }

  const maxSize = question.config?.maxFileSizeMb
  const allowedExt = getAllowedExtensions(question)

  return (
    <div className="space-y-3">
      {paths.map((path, index) => (
        <div
          key={`${path}-${index}`}
          className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        >
          <span className="truncate text-slate-700">{path.split('/').pop()}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => removePath(index)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              O'chirish
            </button>
          )}
        </div>
      ))}

      {!disabled && paths.length < maxFiles && (
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition ${
            uploading
              ? 'border-violet-300 bg-violet-50'
              : 'border-slate-300 hover:border-violet-400 hover:bg-violet-50/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={getAcceptAttribute(question)}
            multiple={multiple}
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <span className="text-sm font-medium text-violet-700">
            {uploading ? 'Yuklanmoqda...' : 'Fayl tanlash'}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            {multiple ? `Maks. ${maxFiles} ta fayl` : 'Bitta fayl'}
            {maxSize ? ` · ${maxSize} MB gacha` : ''}
            {allowedExt.length ? ` · ${allowedExt.join(', ')}` : ''}
          </span>
        </label>
      )}
      <FieldError message={error} />
    </div>
  )
}

export default function QuestionField({
  question,
  index,
  value,
  onChange,
  error,
  disabled,
  surveyId,
  onUploadError,
}) {
  if (question.type === 'section') {
    return <QuestionShell question={question} index={index}>{null}</QuestionShell>
  }

  let field = null

  if (isChoiceType(question.type)) {
    field = (
      <ChoiceInput question={question} value={value} onChange={onChange} disabled={disabled} />
    )
  } else if (question.type === 'linear_scale') {
    field = (
      <LinearScaleInput question={question} value={value} onChange={onChange} disabled={disabled} />
    )
  } else if (question.type === 'rating') {
    field = (
      <RatingInput question={question} value={value} onChange={onChange} disabled={disabled} />
    )
  } else if (isGridType(question.type)) {
    field = <GridInput question={question} value={value} onChange={onChange} disabled={disabled} />
  } else if (isFileType(question.type)) {
    field = (
      <FileUploadInput
        question={question}
        surveyId={surveyId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        error={error}
        onUploadError={onUploadError}
      />
    )
  } else if (question.type === 'long_text') {
    field = (
      <textarea
        className={`${inputClass} min-h-[120px] resize-y`}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || undefined)}
        maxLength={question.validation?.maxLength}
      />
    )
  } else if (question.type === 'number') {
    field = (
      <input
        type="number"
        className={inputClass}
        value={value ?? ''}
        disabled={disabled}
        min={question.validation?.min}
        max={question.validation?.max}
        onChange={(e) => {
          const raw = e.target.value
          onChange(raw === '' ? undefined : Number(raw))
        }}
      />
    )
  } else if (question.type === 'date') {
    field = (
      <input
        type="date"
        className={inputClass}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    )
  } else if (question.type === 'time') {
    field = (
      <input
        type="time"
        className={inputClass}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    )
  } else if (question.type === 'datetime') {
    field = (
      <input
        type="datetime-local"
        className={inputClass}
        value={value ? value.slice(0, 16) : ''}
        disabled={disabled}
        onChange={(e) => {
          if (!e.target.value) {
            onChange(undefined)
            return
          }
          onChange(new Date(e.target.value).toISOString())
        }}
      />
    )
  } else {
    const inputType =
      question.type === 'email'
        ? 'email'
        : question.type === 'phone'
          ? 'tel'
          : question.type === 'url'
            ? 'url'
            : 'text'

    field = (
      <input
        type={inputType}
        className={inputClass}
        value={value ?? ''}
        disabled={disabled}
        maxLength={question.validation?.maxLength}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={
          question.type === 'phone'
            ? '+998901234567'
            : question.type === 'url'
              ? 'https://example.com'
              : undefined
        }
      />
    )
  }

  return (
    <QuestionShell question={question} index={index} error={error} disabled={disabled}>
      {field}
    </QuestionShell>
  )
}
