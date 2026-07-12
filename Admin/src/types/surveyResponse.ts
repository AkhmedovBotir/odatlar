import type { SurveyQuestion, SurveyStatus } from './survey'

export type SurveyResponseSort = 'created_at_desc' | 'created_at_asc'

export type SurveyAnswers = Record<string, unknown>

export interface SurveyResponseItem {
  id: string
  surveyId: string
  surveySlug: string
  surveyTitle: string
  answers: SurveyAnswers
  createdAt: string
}

export interface SurveyResponseListResult {
  data: SurveyResponseItem[]
  total: number
  page: number
  limit: number
}

export interface SurveyResponseDetail {
  id: string
  surveyId: string
  surveySlug: string
  surveyTitle: string
  surveyStatus: SurveyStatus
  questions: SurveyQuestion[]
  answers: SurveyAnswers
  createdAt: string
}

export interface SurveyResponseSummary {
  surveyId: string
  surveySlug: string
  surveyTitle: string
  surveyStatus: SurveyStatus
  totalResponses: number
  todayResponses: number
  weekResponses: number
  firstResponseAt?: string
  lastResponseAt?: string
}

export interface SurveyResponseListParams {
  survey?: string
  from?: string
  to?: string
  search?: string
  question_id?: string
  page?: number
  limit?: number
  sort?: SurveyResponseSort
}
