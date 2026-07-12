import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';
import { resolveMediaUrl } from '@/lib/guidesApi';
import type {
  Course,
  CourseNode,
  LessonBlock,
  LessonContext,
  LessonNode,
} from '@/lib/guideCourse';

const LOG_PREFIX = '[CoursesAPI]';

export interface CourseListItem {
  id: string;
  title: string;
  description: string;
  lessonCount?: number;
  sectionCount?: number;
  children?: CourseNode[];
}

interface GuideCourseListResponse {
  data: CourseListItem[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const initData = getTelegramInitData();
  if (!initData) {
    throw new Error('Telegram initData topilmadi');
  }

  const response = await fetch(`${runtimeConfig.botApiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed: ${response.status} ${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function normalizeLessonBlock(block: LessonBlock): LessonBlock {
  switch (block.type) {
    case 'video':
      return {
        ...block,
        src: resolveMediaUrl(block.src),
        poster: block.poster ? resolveMediaUrl(block.poster) : block.poster,
      };
    case 'image':
      return {
        ...block,
        src: resolveMediaUrl(block.src),
      };
    case 'file':
      return {
        ...block,
        url: resolveMediaUrl(block.url),
      };
    default:
      return block;
  }
}

function normalizeLessonNode(lesson: LessonNode): LessonNode {
  return {
    ...lesson,
    blocks: lesson.blocks.map(normalizeLessonBlock),
  };
}

function normalizeCourseNodes(nodes: CourseNode[]): CourseNode[] {
  return nodes.map((node) => {
    if (node.kind === 'dars') {
      return normalizeLessonNode(node);
    }
    return {
      ...node,
      children: node.children.map((child) =>
        child.kind === 'dars' ? normalizeLessonNode(child) : child
      ),
    };
  });
}

function normalizeCourse(course: Course): Course {
  return {
    ...course,
    children: normalizeCourseNodes(course.children),
  };
}

export async function fetchGuideCourses(): Promise<CourseListItem[]> {
  console.log(`${LOG_PREFIX} GET /guides/courses`);
  const result = await request<GuideCourseListResponse>('/bot-runtime/guides/courses');
  return result.data;
}

export async function fetchGuideCourse(id: string): Promise<Course> {
  console.log(`${LOG_PREFIX} GET /guides/courses/${id}`);
  const result = await request<Course>(`/bot-runtime/guides/courses/${id}`);
  return normalizeCourse({
    ...result,
    children: result.children ?? [],
  });
}

export async function fetchGuideLesson(lessonId: string): Promise<LessonContext> {
  console.log(`${LOG_PREFIX} GET /guides/lessons/${lessonId}`);
  const result = await request<LessonContext>(`/bot-runtime/guides/lessons/${lessonId}`);
  return {
    ...result,
    lesson: normalizeLessonNode(result.lesson),
    course: {
      ...result.course,
      children: [],
    },
  };
}
