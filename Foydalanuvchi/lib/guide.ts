export type GuideTab = 'video' | 'kurslar' | 'fayllar';

export const GUIDE_VIDEO_SRC = '/video/video.mp4';

export interface ExternalVideo {
  id: string;
  title: string;
  description: string;
  src: string;
  poster?: string;
  durationMin?: number;
}

export interface GuideFile {
  id: string;
  title: string;
  description: string;
  url: string;
  ext: string;
  sizeLabel: string;
}

/** Tashqi videolar — kursdan mustaqil */
export const externalVideos: ExternalVideo[] = [
  {
    id: 'kirish-video',
    title: 'Kirish videosi',
    description:
      "Odatlar Klub ilovasidan qanday foydalanishni qisqacha ko'rsatadi.",
    src: GUIDE_VIDEO_SRC,
    poster: '/placeholder.jpg',
    durationMin: 8,
  },
  {
    id: 'odatlar-video',
    title: 'Odatlar bo\'limi tanishuv',
    description: 'Amaliyotlar va indikatorlar qanday ishlashi haqida.',
    src: GUIDE_VIDEO_SRC,
    poster: '/placeholder.jpg',
    durationMin: 5,
  },
];

export function videoHref(videoId: string): string {
  return `/qollanma/video/${videoId}`;
}

export function findExternalVideo(videoId: string): ExternalVideo | null {
  return externalVideos.find((v) => v.id === videoId) ?? null;
}

export const guideFiles: GuideFile[] = [
  {
    id: 'odatlar-qollanma',
    title: 'Odatlar boshlang\'ich qo\'llanma',
    description: 'Amaliyot va indikatorlarni sozlash bo\'yicha qisqa yo\'riqnoma',
    url: '/files/odatlar-boshlangich-qollanma.txt',
    ext: 'txt',
    sizeLabel: '2 KB',
  },
  {
    id: 'dominantalar-qollanma',
    title: 'Dominantalar qo\'llanmasi',
    description: 'Signal, mukofot va 10 daqiqalik mashq jarayoni',
    url: '/files/dominantalar-qollanma.txt',
    ext: 'txt',
    sizeLabel: '2 KB',
  },
  {
    id: 'video-transkript',
    title: 'Video transkript',
    description: 'Qo\'llanma videosi matn ko\'rinishida',
    url: '/files/video-transkript.txt',
    ext: 'txt',
    sizeLabel: '1 KB',
  },
];

export function parseGuideTab(value: string | null): GuideTab {
  if (value === 'kurslar' || value === 'matn') return 'kurslar';
  if (value === 'fayllar') return 'fayllar';
  return 'video';
}
