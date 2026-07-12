export type SurveyStatus = 'draft' | 'published' | 'closed'

export type SurveyQuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'
  | 'linear_scale'
  | 'rating'
  | 'date'
  | 'time'
  | 'datetime'
  | 'email'
  | 'number'
  | 'phone'
  | 'url'
  | 'file_image'
  | 'file_video'
  | 'file_audio'
  | 'file_pdf'
  | 'file_document'
  | 'file_spreadsheet'
  | 'file_presentation'
  | 'file_archive'
  | 'file_any'
  | 'file'
  | 'section'
  | 'grid_choice'
  | 'grid_checkbox'

export interface SurveyOption {
  id: string
  label: string
  isOther?: boolean
}

export interface GridItem {
  id: string
  label: string
}

export interface SurveyValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
}

export interface SurveyQuestionConfig {
  shuffleOptions?: boolean
  allowOther?: boolean
  minSelections?: number
  maxSelections?: number
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  maxStars?: number
  rows?: GridItem[]
  columns?: GridItem[]
  accept?: string[]
  allowedExtensions?: string[]
  maxFileSizeMb?: number
  maxFiles?: number
}

export interface SurveyQuestion {
  id: string
  type: SurveyQuestionType
  title?: string
  description?: string
  required?: boolean
  options?: SurveyOption[]
  validation?: SurveyValidation
  config?: SurveyQuestionConfig
}

export interface SurveySettings {
  collectEmail?: boolean
  shuffleQuestions?: boolean
  confirmationMessage?: string
  showProgressBar?: boolean
}

export interface Survey {
  id: string
  title: string
  description?: string // JSON-stringified Quill delta
  settings?: SurveySettings
  questions: SurveyQuestion[]
  status: SurveyStatus
  sortOrder?: number
  questionCount?: number
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  closedAt?: string
  responseUrl?: string
}

export interface SurveyListResponse {
  data: Survey[]
}

export interface CreateSurveyRequest {
  slug: string
  title: string
  /** JSON-stringified Quill delta */
  description?: string
  settings?: SurveySettings
  questions: SurveyQuestion[]
  sortOrder?: number
}

export type UpdateSurveyRequest = Omit<CreateSurveyRequest, 'slug'> & { slug?: string }

export interface SurveyFileFormat {
  questionType: string
  category: string
  labelUz: string
  mimeTypes: string[]
  extensions: string[]
  defaultMaxSizeMb: number
  defaultMaxFiles: number
}

export interface SurveyFileFormatListResponse {
  data: SurveyFileFormat[]
}

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: 'Loyiha',
  published: 'Nashr qilingan',
  closed: 'Yopilgan',
}

export const QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  short_text: 'Qisqa matn',
  long_text: 'Uzun matn',
  multiple_choice: 'Bitta tanlov',
  checkbox: "Ko'p tanlov",
  dropdown: 'Ro\'yxatdan tanlash',
  linear_scale: 'Chiziqli shkala',
  rating: 'Yulduzcha reyting',
  date: 'Sana',
  time: 'Vaqt',
  datetime: 'Sana va vaqt',
  email: 'Email',
  number: 'Raqam',
  phone: 'Telefon',
  url: 'Havola',
  file_image: 'Rasm',
  file_video: 'Video',
  file_audio: 'Audio',
  file_pdf: 'PDF hujjat',
  file_document: 'Matn hujjat',
  file_spreadsheet: 'Jadval (Excel, CSV)',
  file_presentation: 'Taqdimot',
  file_archive: 'Arxiv',
  file_any: 'Istalgan fayl',
  file: 'Fayl (eski)',
  section: "Bo'lim sarlavhasi",
  grid_choice: 'Jadval — bitta tanlov',
  grid_checkbox: 'Jadval — ko\'p tanlov',
}

export const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS) as SurveyQuestionType[]

export const CHOICE_QUESTION_TYPES: SurveyQuestionType[] = [
  'multiple_choice',
  'checkbox',
  'dropdown',
]

export const GRID_QUESTION_TYPES: SurveyQuestionType[] = ['grid_choice', 'grid_checkbox']

export const VALIDATION_QUESTION_TYPES: SurveyQuestionType[] = [
  'short_text',
  'long_text',
  'number',
  'email',
  'phone',
  'url',
]
