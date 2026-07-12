export function SlugHint({ slug }: { slug: string }) {
  if (!slug) return null

  return (
    <p className="mt-1 text-xs text-slate-500">
      Identifikator: <span className="font-mono text-slate-600">{slug}</span>
    </p>
  )
}
