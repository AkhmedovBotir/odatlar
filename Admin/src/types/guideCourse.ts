import type { DeltaContent } from './delta'

export type { DeltaContent, DeltaOp } from './delta'

export type LessonBlock =
  | { id: string; type: 'title'; text: string }
  | { id: string; type: 'description'; delta: DeltaContent }
  | { id: string; type: 'video'; src: string; poster?: string; caption?: string }
  | { id: string; type: 'image'; src: string; alt?: string; caption?: string }
  | { id: string; type: 'link'; href: string; label: string; description?: string }
  | {
      id: string
      type: 'file'
      url: string
      title: string
      ext: string
      sizeLabel: string
      description?: string
    }

export interface LessonNode {
  kind: 'dars'
  id: string
  title: string
  subtitle?: string
  durationMin?: number
  blocks: LessonBlock[]
}

export interface SectionNode {
  kind: 'bolim'
  id: string
  title: string
  children: LessonNode[]
}

export type CourseNode = LessonNode | SectionNode

export interface GuideCourse {
  id: string
  title: string
  description: string
  children?: CourseNode[]
  lessonCount?: number
  sectionCount?: number
  sortOrder?: number
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface GuideCourseListResponse {
  data: GuideCourse[]
}

export interface CreateGuideCourseRequest {
  slug: string
  title: string
  description?: string
  children: CourseNode[]
  sort_order?: number
  is_published?: boolean
}

export interface UpdateGuideCourseRequest {
  slug: string
  title: string
  description?: string
  children: CourseNode[]
  sort_order?: number
  is_published: boolean
}

export type LessonBlockType = LessonBlock['type']

export const BLOCK_TYPE_LABELS: Record<LessonBlockType, string> = {
  title: 'Sarlavha',
  description: 'Matn',
  video: 'Video',
  image: 'Rasm',
  link: 'Havola',
  file: 'Fayl',
}
