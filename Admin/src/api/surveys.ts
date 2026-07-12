import type {
  CreateSurveyRequest,
  Survey,
  SurveyFileFormat,
  SurveyFileFormatListResponse,
  SurveyListResponse,
  UpdateSurveyRequest,
} from '../types/survey'
import { apiRequest } from './client'

export async function listSurveys(): Promise<Survey[]> {
  const res = await apiRequest<SurveyListResponse>('/api/v1/bot/surveys')
  return res.data ?? []
}

export async function getSurvey(id: string): Promise<Survey> {
  const survey = await apiRequest<Survey>(`/api/v1/bot/surveys/${id}`)
  return {
    ...survey,
    questions: normalizeQuestions(survey.questions),
    settings: survey.settings ?? {},
  }
}

export async function createSurvey(body: CreateSurveyRequest): Promise<Survey> {
  return apiRequest<Survey>('/api/v1/bot/surveys', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateSurvey(id: string, body: UpdateSurveyRequest): Promise<Survey> {
  return apiRequest<Survey>(`/api/v1/bot/surveys/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteSurvey(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/bot/surveys/${id}`, { method: 'DELETE' })
}

export async function publishSurvey(id: string): Promise<Survey> {
  return apiRequest<Survey>(`/api/v1/bot/surveys/${id}/publish`, { method: 'POST' })
}

export async function closeSurvey(id: string): Promise<Survey> {
  return apiRequest<Survey>(`/api/v1/bot/surveys/${id}/close`, { method: 'POST' })
}

export async function listSurveyFileFormats(): Promise<SurveyFileFormat[]> {
  const res = await apiRequest<SurveyFileFormatListResponse>('/api/v1/bot/surveys/file-formats')
  return res.data ?? []
}

function normalizeQuestions(questions: Survey['questions']): Survey['questions'] {
  if (!questions) return []
  if (typeof questions === 'string') {
    try {
      return JSON.parse(questions) as Survey['questions']
    } catch {
      return []
    }
  }
  return questions
}
