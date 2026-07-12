import type { SurveyQuestionType } from '../types/survey'

export const FILE_QUESTION_TYPES: SurveyQuestionType[] = [
  'file_image',
  'file_video',
  'file_audio',
  'file_pdf',
  'file_document',
  'file_spreadsheet',
  'file_presentation',
  'file_archive',
  'file_any',
  'file',
]

export const QUESTION_TYPE_GROUPS: {
  id: string
  label: string
  types: SurveyQuestionType[]
}[] = [
  { id: 'text', label: 'Matn', types: ['short_text', 'long_text'] },
  { id: 'choice', label: 'Tanlov', types: ['multiple_choice', 'checkbox', 'dropdown'] },
  { id: 'scale', label: 'Shkala', types: ['linear_scale', 'rating'] },
  { id: 'datetime', label: 'Sana va vaqt', types: ['date', 'time', 'datetime'] },
  { id: 'contact', label: 'Aloqa', types: ['email', 'phone', 'url', 'number'] },
  {
    id: 'file',
    label: 'Fayl yuklash',
    types: [
      'file_image',
      'file_video',
      'file_audio',
      'file_pdf',
      'file_document',
      'file_spreadsheet',
      'file_presentation',
      'file_archive',
      'file_any',
    ],
  },
  { id: 'structure', label: 'Tuzilma', types: ['section', 'grid_choice', 'grid_checkbox'] },
]

export function isFileType(type: SurveyQuestionType): boolean {
  return FILE_QUESTION_TYPES.includes(type)
}

export function parseListInput(value: string): string[] | undefined {
  const items = value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
  return items.length ? items : undefined
}

export function formatListInput(value?: string[]): string {
  return value?.join(', ') ?? ''
}
