export type GuideTab = 'video' | 'kurslar' | 'fayllar';

export interface ExternalVideo {
  id: string;
  title: string;
  description: string;
  src: string;
  poster?: string;
  durationMin?: number;
  likesCount?: number;
  commentsCount?: number;
  likedByMe?: boolean;
}

export interface GuideVideoComment {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt: string;
  isMine?: boolean;
}

export interface GuideFile {
  id: string;
  title: string;
  description: string;
  url: string;
  ext: string;
  sizeLabel: string;
}

export function videoHref(videoId: string): string {
  return `/qollanma/video/${videoId}`;
}

export function parseGuideTab(value: string | null): GuideTab {
  if (value === 'kurslar' || value === 'matn') return 'kurslar';
  if (value === 'fayllar') return 'fayllar';
  return 'video';
}
