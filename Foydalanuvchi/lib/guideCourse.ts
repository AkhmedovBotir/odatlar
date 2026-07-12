/** Quill-style delta — rich matn tavsifi */
export interface DeltaOp {
  insert: string;
  attributes?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    header?: 1 | 2 | 3;
    list?: 'bullet' | 'ordered';
    link?: string;
  };
}

export interface DeltaContent {
  ops: DeltaOp[];
}

export type LessonBlock =
  | { id: string; type: 'title'; text: string }
  | { id: string; type: 'description'; delta: DeltaContent }
  | { id: string; type: 'video'; src: string; poster?: string; caption?: string }
  | { id: string; type: 'image'; src: string; alt?: string; caption?: string }
  | { id: string; type: 'link'; href: string; label: string; description?: string }
  | {
      id: string;
      type: 'file';
      url: string;
      title: string;
      ext: string;
      sizeLabel: string;
      description?: string;
    };

export interface LessonNode {
  kind: 'dars';
  id: string;
  title: string;
  subtitle?: string;
  durationMin?: number;
  blocks: LessonBlock[];
}

export interface SectionNode {
  kind: 'bolim';
  id: string;
  title: string;
  children: CourseNode[];
}

export type CourseNode = LessonNode | SectionNode;

export interface Course {
  id: string;
  title: string;
  description: string;
  children: CourseNode[];
}

export interface BreadcrumbItem {
  id: string;
  title: string;
  href: string;
}

export interface LessonContext {
  lesson: LessonNode;
  breadcrumb: BreadcrumbItem[];
  course: Course;
}

export function lessonHref(lessonId: string): string {
  return `/qollanma/dars/${lessonId}`;
}

export function courseHref(courseId: string): string {
  return `/qollanma/kurs/${courseId}`;
}

export function isLesson(node: CourseNode): node is LessonNode {
  return node.kind === 'dars';
}

export function isSection(node: CourseNode): node is SectionNode {
  return node.kind === 'bolim';
}

export function countLessons(nodes: CourseNode[]): number {
  return nodes.reduce((sum, node) => {
    if (isLesson(node)) return sum + 1;
    if (isSection(node)) return sum + countLessons(node.children);
    return sum;
  }, 0);
}

export function getLessonBlockTypes(lesson: LessonNode): string[] {
  const types = new Set(lesson.blocks.map((b) => b.type));
  const labels: Record<LessonBlock['type'], string> = {
    title: 'Sarlavha',
    description: 'Matn',
    video: 'Video',
    image: 'Rasm',
    link: 'Havola',
    file: 'Fayl',
  };
  return [...types].map((t) => labels[t]);
}
