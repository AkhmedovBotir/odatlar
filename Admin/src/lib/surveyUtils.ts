import type {
  SurveyQuestion,
  SurveyQuestionType,
  SurveySettings,
} from '../types/survey'
import { appConfig } from '../config'
import { slugify } from './slugify'

export { slugify }

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function defaultSettings(): SurveySettings {
  return {
    collectEmail: false,
    shuffleQuestions: false,
    showProgressBar: true,
    confirmationMessage: 'Javobingiz uchun rahmat!',
  }
}

/** UI uchun — default qiymatlar bilan birlashtiradi */
export function sanitizeSurveySettings(settings?: SurveySettings): SurveySettings {
  return { ...defaultSettings(), ...settings }
}

/** API ga yuborish — faqat ruxsat etilgan maydonlar */
export function serializeSurveySettings(settings: SurveySettings): SurveySettings {
  const out: SurveySettings = {}
  if (settings.collectEmail != null) out.collectEmail = settings.collectEmail
  if (settings.shuffleQuestions != null) out.shuffleQuestions = settings.shuffleQuestions
  if (settings.showProgressBar != null) out.showProgressBar = settings.showProgressBar
  const message = settings.confirmationMessage?.trim()
  if (message) out.confirmationMessage = message
  return out
}

export function getSurveyResponseUrl(survey: { id: string; responseUrl?: string }): string {
  if (survey.responseUrl?.trim()) return survey.responseUrl.trim()
  const base = appConfig.surveyFrontendUrl.replace(/\/$/, '')
  if (!base || !survey.id) return ''
  return `${base}/surveys/${survey.id}`
}

export function createQuestion(type: SurveyQuestionType): SurveyQuestion {
  const id = newId(type === 'section' ? 'section' : 'q')
  const base: SurveyQuestion = { id, type, title: '' }

  switch (type) {
    case 'section':
      return { ...base, title: "Yangi bo'lim" }
    case 'multiple_choice':
    case 'checkbox':
    case 'dropdown':
      return {
        ...base,
        title: 'Savol matni',
        options: [
          { id: newId('opt'), label: 'Variant 1' },
          { id: newId('opt'), label: 'Variant 2' },
        ],
        config: type === 'checkbox' ? { minSelections: 1 } : undefined,
      }
    case 'linear_scale':
      return {
        ...base,
        title: 'Savol matni',
        config: {
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: 'Past',
          scaleMaxLabel: 'Yuqori',
        },
      }
    case 'rating':
      return {
        ...base,
        title: 'Savol matni',
        config: { maxStars: 5 },
      }
    case 'grid_choice':
    case 'grid_checkbox':
      return {
        ...base,
        title: 'Savol matni',
        config: {
          rows: [
            { id: newId('row'), label: 'Qator 1' },
            { id: newId('row'), label: 'Qator 2' },
          ],
          columns: [
            { id: newId('col'), label: 'Yomon' },
            { id: newId('col'), label: "O'rtacha" },
            { id: newId('col'), label: 'Yaxshi' },
          ],
        },
      }
    case 'file':
    case 'file_image':
    case 'file_video':
    case 'file_audio':
    case 'file_pdf':
    case 'file_document':
    case 'file_spreadsheet':
    case 'file_presentation':
    case 'file_archive':
    case 'file_any':
      return {
        ...base,
        type,
        title: 'Fayl yuklang',
        config: { maxFileSizeMb: 10, maxFiles: 1 },
      }
    default:
      return { ...base, title: 'Savol matni' }
  }
}

export function countAnswerableQuestions(questions: SurveyQuestion[]): number {
  return questions.filter((q) => q.type !== 'section').length
}

export function isChoiceType(type: SurveyQuestionType): boolean {
  return type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown'
}

export function isGridType(type: SurveyQuestionType): boolean {
  return type === 'grid_choice' || type === 'grid_checkbox'
}

export { isFileType } from './surveyConstants'
