import type { SurveyFileFormat, SurveyQuestionType } from '../types/survey'

export function getFileFormatKey(type: SurveyQuestionType): string {
  return type === 'file' ? 'file_any' : type
}

export function normalizeAcceptList(accept?: string | string[]): string[] {
  if (!accept) return []
  return Array.isArray(accept) ? accept : [accept]
}

export function getMimeOptionsForType(
  type: SurveyQuestionType,
  formats: SurveyFileFormat[],
): string[] {
  const key = getFileFormatKey(type)
  const format = formats.find((f) => f.questionType === key)
  if (!format?.mimeTypes.length) return []

  const mimes = format.mimeTypes
  if (mimes.length === 1 && mimes[0] === '*/*') {
    const all = new Set<string>()
    for (const f of formats) {
      for (const m of f.mimeTypes) {
        if (m !== '*/*') all.add(m)
      }
    }
    return [...all].sort()
  }

  return [...mimes].sort()
}

export function normalizeStringList(value?: string | string[]): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export function getExtensionOptionsForType(
  type: SurveyQuestionType,
  formats: SurveyFileFormat[],
): string[] {
  const key = getFileFormatKey(type)
  const format = formats.find((f) => f.questionType === key)
  if (!format) return []

  if (format.extensions.length > 0) {
    return [...format.extensions].sort()
  }

  const all = new Set<string>()
  for (const f of formats) {
    for (const ext of f.extensions) all.add(ext)
  }
  return [...all].sort()
}
