import { DEFAULT_FILE_ACCEPT, isFileType as checkFileType } from './surveyConstants'

export { isFileType } from './surveyConstants'
export { isChoiceType, isGridType } from './surveyConstants'

export function normalizeQuestions(questions) {
  if (!questions) return []
  if (typeof questions === 'string') {
    try {
      return JSON.parse(questions)
    } catch {
      return []
    }
  }
  return Array.isArray(questions) ? questions : []
}

export function normalizeSettings(settings) {
  if (!settings) return {}
  if (typeof settings === 'string') {
    try {
      return JSON.parse(settings)
    } catch {
      return {}
    }
  }
  return settings
}

export function countAnswerableQuestions(questions) {
  return questions.filter((q) => q.type !== 'section').length
}

export function shuffleArray(items) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function prepareQuestions(questions, settings) {
  let prepared = [...questions]
  if (settings?.shuffleQuestions) {
    const sections = []
    let buffer = []
    for (const q of prepared) {
      if (q.type === 'section') {
        if (buffer.length) sections.push(shuffleArray(buffer))
        sections.push([q])
        buffer = []
      } else {
        buffer.push(q)
      }
    }
    if (buffer.length) sections.push(shuffleArray(buffer))
    prepared = sections.flat()
  }

  return prepared.map((q) => {
    if (!q.config?.shuffleOptions || !q.options?.length) return q
    return { ...q, options: shuffleArray(q.options) }
  })
}

export function getAcceptAttribute(question) {
  const { type, config } = question
  const key = type === 'file' ? 'file_any' : type
  if (config?.allowedExtensions?.length) {
    return config.allowedExtensions.map((e) => `.${e.replace(/^\./, '')}`).join(',')
  }
  if (config?.accept?.length) return config.accept.join(',')
  return DEFAULT_FILE_ACCEPT[key] || '*/*'
}

export function getAllowedExtensions(question) {
  const { config } = question
  if (config?.allowedExtensions?.length) {
    return config.allowedExtensions.map((e) => e.replace(/^\./, '').toLowerCase())
  }
  const accept = getAcceptAttribute(question)
  if (accept.includes('/*')) {
    return accept.split(',').map((part) => part.trim().replace(/^\./, ''))
  }
  return accept
    .split(',')
    .map((part) => part.trim().replace(/^\./, ''))
    .filter(Boolean)
}

export function validateFileExtension(file, question) {
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : ''
  const allowed = getAllowedExtensions(question)
  if (!allowed.length) return null
  if (!ext || !allowed.includes(ext)) {
    return `Ruxsat etilgan formatlar: ${allowed.join(', ')}`
  }
  const maxMb = question.config?.maxFileSizeMb
  if (maxMb && file.size > maxMb * 1024 * 1024) {
    return `Fayl hajmi ${maxMb} MB dan oshmasligi kerak`
  }
  return null
}

export function isEmptyAnswer(value) {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function validateAnswers(questions, answers) {
  const errors = {}

  for (const q of questions) {
    if (q.type === 'section') continue
    const value = answers[q.id]
    if (q.required && isEmptyAnswer(value)) {
      errors[q.id] = 'Bu savol majburiy'
      continue
    }
    if (isEmptyAnswer(value)) continue

    if (q.type === 'checkbox' && Array.isArray(value)) {
      const min = q.config?.minSelections ?? (q.required ? 1 : 0)
      const max = q.config?.maxSelections
      if (value.length < min) {
        errors[q.id] = `Kamida ${min} ta variant tanlang`
      }
      if (max && value.length > max) {
        errors[q.id] = `Ko'pi bilan ${max} ta variant tanlang`
      }
    }

    if (q.type === 'email' && typeof value === 'string') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[q.id] = 'Email noto\'g\'ri'
      }
    }

    if (q.type === 'url' && typeof value === 'string') {
      try {
        new URL(value)
      } catch {
        errors[q.id] = 'Havola noto\'g\'ri'
      }
    }

    if (q.type === 'number' && typeof value === 'number') {
      if (q.validation?.min != null && value < q.validation.min) {
        errors[q.id] = `Minimal qiymat: ${q.validation.min}`
      }
      if (q.validation?.max != null && value > q.validation.max) {
        errors[q.id] = `Maksimal qiymat: ${q.validation.max}`
      }
    }

    if ((q.type === 'grid_choice' || q.type === 'grid_checkbox') && typeof value === 'object') {
      const rows = q.config?.rows ?? []
      if (q.required) {
        for (const row of rows) {
          if (!value[row.id] || (Array.isArray(value[row.id]) && value[row.id].length === 0)) {
            errors[q.id] = 'Barcha qatorlarga javob bering'
            break
          }
        }
      }
    }

    if (checkFileType(q.type) && q.config?.maxFiles > 1 && Array.isArray(value)) {
      if (value.length > q.config.maxFiles) {
        errors[q.id] = `Ko'pi bilan ${q.config.maxFiles} ta fayl`
      }
    }
  }

  return errors
}
