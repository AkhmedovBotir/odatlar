import type {
  CourseNode,
  LessonBlock,
  LessonBlockType,
  LessonNode,
  SectionNode,
} from '../types/guideCourse'
import { textToDelta } from './deltaUtils'

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export { slugify } from './slugify'
export { deltaToText, textToDelta } from './deltaUtils'

export function createLesson(): LessonNode {
  return {
    kind: 'dars',
    id: newId('dars'),
    title: 'Yangi dars',
    blocks: [{ id: newId('b'), type: 'title', text: 'Dars sarlavhasi' }],
  }
}

export function createSection(): SectionNode {
  return {
    kind: 'bolim',
    id: newId('bolim'),
    title: "Yangi bo'lim",
    children: [createLesson()],
  }
}

export function createBlock(type: LessonBlockType): LessonBlock {
  switch (type) {
    case 'title':
      return { id: newId('b'), type: 'title', text: '' }
    case 'description':
      return { id: newId('b'), type: 'description', delta: textToDelta('') }
    case 'video':
      return { id: newId('b'), type: 'video', src: '', caption: '' }
    case 'image':
      return { id: newId('b'), type: 'image', src: '', alt: '', caption: '' }
    case 'link':
      return { id: newId('b'), type: 'link', href: '', label: '', description: '' }
    case 'file':
      return {
        id: newId('b'),
        type: 'file',
        url: '',
        title: '',
        ext: 'pdf',
        sizeLabel: '',
        description: '',
      }
  }
}

export function isLesson(node: CourseNode): node is LessonNode {
  return node.kind === 'dars'
}

export function isSection(node: CourseNode): node is SectionNode {
  return node.kind === 'bolim'
}

export function countNodes(children: CourseNode[]): { lessons: number; sections: number } {
  let lessons = 0
  let sections = 0
  for (const node of children) {
    if (isLesson(node)) lessons++
    else if (isSection(node)) {
      sections++
      lessons += node.children.length
    }
  }
  return { lessons, sections }
}
