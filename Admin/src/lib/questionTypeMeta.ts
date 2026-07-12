import type { LucideIcon } from 'lucide-react'
import {
  AlignLeft,
  AlignJustify,
  Calendar,
  CalendarClock,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Clock,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Hash,
  Image,
  LayoutList,
  Link,
  Mail,
  Music,
  Phone,
  Presentation,
  SlidersHorizontal,
  Star,
  Table,
  Video,
} from 'lucide-react'
import type { SurveyQuestionType } from '../types/survey'
import { QUESTION_TYPE_GROUPS } from './surveyConstants'

export type QuestionTypeMeta = {
  icon: LucideIcon
  description: string
}

export const QUESTION_TYPE_META: Record<SurveyQuestionType, QuestionTypeMeta> = {
  short_text: { icon: AlignLeft, description: 'Bir qatorli qisqa javob' },
  long_text: { icon: AlignJustify, description: 'Ko\'p qatorli uzun matn' },
  multiple_choice: { icon: CircleDot, description: 'Variantlardan bittasini tanlash' },
  checkbox: { icon: CheckSquare, description: 'Bir nechta variant tanlash' },
  dropdown: { icon: ChevronDown, description: 'Ro\'yxatdan bitta tanlov' },
  linear_scale: { icon: SlidersHorizontal, description: 'Raqamli shkala (masalan 1–5)' },
  rating: { icon: Star, description: 'Yulduzcha bilan baholash' },
  date: { icon: Calendar, description: 'Sana (YYYY-MM-DD)' },
  time: { icon: Clock, description: 'Vaqt (HH:MM)' },
  datetime: { icon: CalendarClock, description: 'Sana va vaqt birga' },
  email: { icon: Mail, description: 'Email manzil' },
  phone: { icon: Phone, description: 'Telefon raqam' },
  url: { icon: Link, description: 'Veb-havola' },
  number: { icon: Hash, description: 'Raqamli qiymat' },
  file_image: { icon: Image, description: 'Rasm fayllari (JPG, PNG, …)' },
  file_video: { icon: Video, description: 'Video fayllari (MP4, WebM, …)' },
  file_audio: { icon: Music, description: 'Audio fayllari (MP3, WAV, …)' },
  file_pdf: { icon: FileText, description: 'PDF hujjatlar' },
  file_document: { icon: FileText, description: 'Word, TXT va boshqa hujjatlar' },
  file_spreadsheet: { icon: FileSpreadsheet, description: 'Excel, CSV jadvallar' },
  file_presentation: { icon: Presentation, description: 'PowerPoint taqdimotlar' },
  file_archive: { icon: FileArchive, description: 'ZIP, RAR arxivlar' },
  file_any: { icon: File, description: 'Istalgan fayl turi' },
  file: { icon: File, description: 'Istalgan fayl (eski nom)' },
  section: { icon: LayoutList, description: 'Bo\'lim sarlavhasi (javobsiz)' },
  grid_choice: { icon: Table, description: 'Jadval — har qator uchun bitta tanlov' },
  grid_checkbox: { icon: Table, description: 'Jadval — har qator uchun ko\'p tanlov' },
}

export const QUICK_ADD_TYPES: SurveyQuestionType[] = [
  'short_text',
  'section',
  'multiple_choice',
  'file_image',
]

export { QUESTION_TYPE_GROUPS }
