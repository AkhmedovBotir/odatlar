export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Yangi yozuvda sarlavhadan slug; tahrirlashda mavjud slug o'zgarmaydi */
export function syncSlugWithTitle(title: string, isNew: boolean, currentSlug: string): string {
  return isNew ? slugify(title) : currentSlug
}
