import type { SurveyAnswers } from '../types/surveyResponse'

export function parseAnswers(raw: unknown): SurveyAnswers {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as SurveyAnswers
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as SurveyAnswers
  }
  return {}
}

export function parseQuestions(raw: unknown): import('../types/survey').SurveyQuestion[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as import('../types/survey').SurveyQuestion[]
    } catch {
      return []
    }
  }
  if (Array.isArray(raw)) return raw
  return []
}

export function formatAnswerValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map((item) => formatAnswerValue(item)).join(', ')
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => {
        if (Array.isArray(val)) return `${key}: [${val.length}]`
        return `${key}: ${formatAnswerValue(val)}`
      })
      .join('; ')
  }
  return String(value)
}

export function formatAnswersPreview(answers: SurveyAnswers, max = 2): string {
  const entries = Object.entries(answers).filter(([, v]) => v != null && v !== '')
  if (entries.length === 0) return '—'
  const parts = entries
    .slice(0, max)
    .map(([, value]) => formatAnswerValue(value))
    .filter((text) => text !== '—')
  if (parts.length === 0) return '—'
  const preview = parts.join(' · ')
  return entries.length > max ? `${preview} …` : preview
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('uz-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

import type { SurveyResponseListParams } from '../types/surveyResponse'

export function buildResponseQuery(
  params: SurveyResponseListParams | Omit<SurveyResponseListParams, 'survey'>,
): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') query.set(key, String(value))
  }
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}
