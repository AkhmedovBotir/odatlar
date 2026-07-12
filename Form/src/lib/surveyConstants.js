export const FILE_QUESTION_TYPES = [
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

export const DEFAULT_FILE_ACCEPT = {
  file_image: 'image/*',
  file_video: 'video/*',
  file_audio: 'audio/*',
  file_pdf: '.pdf',
  file_document: '.doc,.docx,.odt,.rtf,.txt,.md',
  file_spreadsheet: '.xls,.xlsx,.ods,.csv,.tsv',
  file_presentation: '.ppt,.pptx,.odp',
  file_archive: '.zip,.rar,.7z,.gz,.tar,.tgz',
  file_any: '*/*',
  file: '*/*',
}

export function isFileType(type) {
  return FILE_QUESTION_TYPES.includes(type)
}

export function isChoiceType(type) {
  return type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown'
}

export function isGridType(type) {
  return type === 'grid_choice' || type === 'grid_checkbox'
}
