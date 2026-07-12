import { apiRequest } from './client'
import { normalizeQuestions, normalizeSettings } from '../lib/surveyUtils'

export async function listSurveys() {
  const res = await apiRequest('/surveys')
  return res?.data ?? []
}

export async function getSurvey(id) {
  const survey = await apiRequest(`/surveys/${encodeURIComponent(id)}`)
  return {
    ...survey,
    settings: normalizeSettings(survey.settings),
    questions: normalizeQuestions(survey.questions),
  }
}

export async function submitSurveyResponse(id, answers) {
  return apiRequest(`/surveys/${encodeURIComponent(id)}/responses`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

export async function uploadSurveyFile(id, questionId, file) {
  const form = new FormData()
  form.append('questionId', questionId)
  form.append('file', file)
  return apiRequest(`/surveys/${encodeURIComponent(id)}/upload`, {
    method: 'POST',
    body: form,
  })
}
