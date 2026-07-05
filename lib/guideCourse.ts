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

export const GUIDE_VIDEO_SRC = '/video/video.mp4';

export const intizomCourse: Course = {
  id: 'intizom-darsi',
  title: 'Intizom darsi',
  description:
    "Odatlar, intizom va o'z ustingizda ishlash bo'yicha bosqichma-bosqich qo'llanma.",
  children: [
    {
      kind: 'dars',
      id: 'kirish-darsi',
      title: 'Kirish darsi',
      subtitle: 'Kurs haqida umumiy maʼlumot',
      durationMin: 8,
      blocks: [
        { id: 'b1', type: 'title', text: 'Intizom nima va nega muhim?' },
        {
          id: 'b2',
          type: 'description',
          delta: {
            ops: [
              { insert: 'Intizom', attributes: { bold: true } },
              {
                insert:
                  " — maqsadga erishish uchun o'z ustingizda ishlash qobiliyati. Bu darsda siz odatlar tsikli va kundalik amaliyotlar muhimligini o'rganasiz.\n\n",
              },
              { insert: 'Asosiy gʻoya: ', attributes: { bold: true } },
              {
                insert:
                  "kichik, takrorlanuvchi harakatlar vaqt o'tishi bilan katta natijalarga olib keladi.\n",
              },
            ],
          },
        },
        {
          id: 'b3',
          type: 'video',
          src: GUIDE_VIDEO_SRC,
          poster: '/placeholder.jpg',
          caption: 'Kirish videosi — Odatlar Klub ilovasidan qanday foydalanish',
        },
        {
          id: 'b4',
          type: 'image',
          src: '/placeholder.jpg',
          alt: 'Odatlar tsikli diagrammasi',
          caption: 'Signal → Amal → Mukofot tsikli',
        },
        {
          id: 'b5',
          type: 'link',
          href: 'https://example.com/intizom',
          label: "Qo'shimcha maqola: Intizom haqida",
          description: "Tashqi manbadan chuqurroq o'qish uchun",
        },
        {
          id: 'b6',
          type: 'file',
          url: '/files/odatlar-boshlangich-qollanma.txt',
          title: 'Kirish darsi konspekti',
          ext: 'txt',
          sizeLabel: '2 KB',
          description: 'Dars bo‘yicha qisqa yozuvlar',
        },
      ],
    },
    {
      kind: 'bolim',
      id: 'bolim-1',
      title: "1-bo'lim",
      children: [
        {
          kind: 'dars',
          id: 'dars-1-1',
          title: '1-dars',
          subtitle: 'Odatlar tsiklini tushunish',
          durationMin: 12,
          blocks: [
            { id: 'b1', type: 'title', text: 'Odatlar tsikli: signal, amal, mukofot' },
            {
              id: 'b2',
              type: 'description',
              delta: {
                ops: [
                  { insert: 'Har bir odat uch qismdan iborat:\n', attributes: { header: 2 } },
                  { insert: 'Signal', attributes: { bold: true } },
                  { insert: ' — odatni boshlovchi ishora\n' },
                  { insert: 'Amal', attributes: { bold: true } },
                  { insert: ' — odatning o‘zi\n' },
                  { insert: 'Mukofot', attributes: { bold: true } },
                  { insert: ' — miyaga beriladigan foyda\n\n' },
                  { insert: 'Misol: ', attributes: { italic: true } },
                  {
                    insert:
                      'charchoq (signal) → telefon (amal) → tezkor zerikishdan qochish (mukofot).\n',
                  },
                ],
              },
            },
            {
              id: 'b3',
              type: 'video',
              src: GUIDE_VIDEO_SRC,
              caption: 'Odatlar tsikli tushuntirilishi',
            },
            {
              id: 'b4',
              type: 'file',
              url: '/files/dominantalar-qollanma.txt',
              title: '1-dars vazifalari',
              ext: 'txt',
              sizeLabel: '2 KB',
            },
          ],
        },
        {
          kind: 'dars',
          id: 'dars-1-2',
          title: '2-dars',
          subtitle: 'Kundalik amaliyotlar',
          durationMin: 10,
          blocks: [
            { id: 'b1', type: 'title', text: 'Amaliyot qanday mustahkamlanadi?' },
            {
              id: 'b2',
              type: 'description',
              delta: {
                ops: [
                  { insert: 'Quyidagi qadamlarni bajaring:\n' },
                  { insert: 'Har kuni bir xil vaqtni tanlang\n', attributes: { list: 'ordered' } },
                  { insert: 'Odatni juda kichik qilib boshlang\n', attributes: { list: 'ordered' } },
                  { insert: 'Bajarilganda belgilang va kuzating\n', attributes: { list: 'ordered' } },
                  { insert: '\n' },
                  { insert: 'Muhim: ', attributes: { bold: true } },
                  { insert: "mukammallik emas, doimiylik muhim.\n" },
                ],
              },
            },
            {
              id: 'b3',
              type: 'image',
              src: '/placeholder.svg',
              alt: 'Haftalik amaliyot jadvali',
              caption: 'Namuna: haftalik amaliyot rejasi',
            },
            {
              id: 'b4',
              type: 'link',
              href: '/odatlar',
              label: 'Odatlar bo‘limiga o‘tish',
              description: 'Amaliyotlaringizni hoziroq boshlang',
            },
          ],
        },
        {
          kind: 'dars',
          id: 'dars-1-3',
          title: '3-dars',
          subtitle: 'Dominantalar bilan ishlash',
          durationMin: 15,
          blocks: [
            { id: 'b1', type: 'title', text: 'Zararli odatni dominant deb ataymiz' },
            {
              id: 'b2',
              type: 'description',
              delta: {
                ops: [
                  {
                    insert:
                      "Dominant — sizni boshqaradigan odat. Uni nazorat qilish uchun signal va mukofotni aniqlang, keyin 10 daqiqalik mashq qiling.\n\n",
                  },
                  { insert: 'Ikki usul:\n', attributes: { header: 3 } },
                  { insert: 'Fikrlash orqali — foyda va zararlarni yozish\n', attributes: { list: 'bullet' } },
                  { insert: "Ma'lumot orqali — mavzu bo'yicha o'qish\n", attributes: { list: 'bullet' } },
                ],
              },
            },
            {
              id: 'b3',
              type: 'video',
              src: GUIDE_VIDEO_SRC,
              caption: 'Dominant mashqi namunasi',
            },
            {
              id: 'b4',
              type: 'link',
              href: '/dominantalar',
              label: 'Dominantalar bo‘limi',
              description: 'Birinchi dominantangizni yarating',
            },
            {
              id: 'b5',
              type: 'file',
              url: '/files/video-transkript.txt',
              title: '3-dars transkripti',
              ext: 'txt',
              sizeLabel: '1 KB',
            },
          ],
        },
      ],
    },
    {
      kind: 'bolim',
      id: 'bolim-2',
      title: "2-bo'lim",
      children: [
        {
          kind: 'dars',
          id: 'dars-2-1',
          title: '1-dars',
          subtitle: 'Statistika va rivojlanish',
          durationMin: 7,
          blocks: [
            { id: 'b1', type: 'title', text: 'Natijalaringizni kuzatish' },
            {
              id: 'b2',
              type: 'description',
              delta: {
                ops: [
                  {
                    insert:
                      "Statistika bo'limida reyting, amaliyotlar, indikatorlar va dominantalar bo'yicha umumiy ko'rinish mavjud.\n\n",
                  },
                  { insert: 'Davr filtri', attributes: { bold: true } },
                  { insert: " orqali haftalik yoki oylik natijalarni tahlil qiling.\n" },
                ],
              },
            },
            {
              id: 'b3',
              type: 'link',
              href: '/statistika',
              label: 'Statistikaga o‘tish',
            },
          ],
        },
      ],
    },
  ],
};

export const guideCourses: Course[] = [intizomCourse];

export function lessonHref(lessonId: string): string {
  return `/qollanma/dars/${lessonId}`;
}

export function courseHref(courseId: string): string {
  return `/qollanma/kurs/${courseId}`;
}

export function findCourse(courseId: string): Course | null {
  return guideCourses.find((c) => c.id === courseId) ?? null;
}

function isLesson(node: CourseNode): node is LessonNode {
  return node.kind === 'dars';
}

function isSection(node: CourseNode): node is SectionNode {
  return node.kind === 'bolim';
}

export function findLesson(lessonId: string): LessonContext | null {
  for (const course of guideCourses) {
    const walk = (
      nodes: CourseNode[],
      trail: BreadcrumbItem[]
    ): { lesson: LessonNode; breadcrumb: BreadcrumbItem[] } | null => {
      for (const node of nodes) {
        if (isLesson(node)) {
          if (node.id === lessonId) {
            return {
              lesson: node,
              breadcrumb: [
                ...trail,
                { id: node.id, title: node.title, href: lessonHref(node.id) },
              ],
            };
          }
        } else if (isSection(node)) {
          const found = walk(node.children, [
            ...trail,
            { id: node.id, title: node.title, href: courseHref(course.id) },
          ]);
          if (found) return found;
        }
      }
      return null;
    };

    const result = walk(course.children, [
      { id: course.id, title: course.title, href: courseHref(course.id) },
    ]);
    if (result) {
      return { ...result, course };
    }
  }
  return null;
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

export { isLesson, isSection };
