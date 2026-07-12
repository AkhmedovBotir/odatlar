import type {
  SurveyResponseDetail,
  SurveyResponseItem,
  SurveyResponseListParams,
  SurveyResponseListResult,
  SurveyResponseSummary,
} from '../types/surveyResponse'
import { parseAnswers, parseQuestions, buildResponseQuery } from '../lib/surveyResponseUtils'
import { apiRequest } from './client'

type RawListResponse = {
  data: Array<Omit<SurveyResponseItem, 'answers'> & { answers: unknown }>
  total: number
  page: number
  limit: number
}

type RawDetailResponse = Omit<SurveyResponseDetail, 'answers' | 'questions'> & {
  answers: unknown
  questions: unknown
}

function normalizeItem(
  item: Omit<SurveyResponseItem, 'answers'> & { answers: unknown },
): SurveyResponseItem {
  return {
    ...item,
    answers: parseAnswers(item.answers),
  }
}

function normalizeDetail(raw: RawDetailResponse): SurveyResponseDetail {
  return {
    ...raw,
    answers: parseAnswers(raw.answers),
    questions: parseQuestions(raw.questions),
  }
}

export async function listAllSurveyResponses(
  params: SurveyResponseListParams = {},
): Promise<SurveyResponseListResult> {
  const res = await apiRequest<RawListResponse>(
    `/api/v1/bot/surveys/responses${buildResponseQuery(params)}`,
  )
  return {
    data: (res.data ?? []).map(normalizeItem),
    total: res.total ?? 0,
    page: res.page ?? 1,
    limit: res.limit ?? 20,
  }
}

export async function listSurveyResponses(
  surveyId: string,
  params: Omit<SurveyResponseListParams, 'survey'> = {},
): Promise<SurveyResponseListResult> {
  const res = await apiRequest<RawListResponse>(
    `/api/v1/bot/surveys/${encodeURIComponent(surveyId)}/responses${buildResponseQuery(params)}`,
  )
  return {
    data: (res.data ?? []).map(normalizeItem),
    total: res.total ?? 0,
    page: res.page ?? 1,
    limit: res.limit ?? 20,
  }
}

export async function getSurveyResponse(responseId: string): Promise<SurveyResponseDetail> {
  const res = await apiRequest<RawDetailResponse>(
    `/api/v1/bot/surveys/responses/${encodeURIComponent(responseId)}`,
  )
  return normalizeDetail(res)
}

export async function getSurveyResponseSummary(surveyId: string): Promise<SurveyResponseSummary> {
  return apiRequest<SurveyResponseSummary>(
    `/api/v1/bot/surveys/${encodeURIComponent(surveyId)}/responses/summary`,
  )
}

export async function deleteSurveyResponse(responseId: string): Promise<void> {
  await apiRequest<void>(`/api/v1/bot/surveys/responses/${encodeURIComponent(responseId)}`, {
    method: 'DELETE',
  })
}
