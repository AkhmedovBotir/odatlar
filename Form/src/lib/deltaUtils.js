export function deltaToText(delta) {
  if (!delta?.ops?.length) return ''
  return delta.ops.map((op) => (typeof op.insert === 'string' ? op.insert : '')).join('')
}

export function parseDescriptionDelta(raw) {
  if (!raw) return ''
  if (typeof raw === 'object' && Array.isArray(raw.ops)) {
    return deltaToText(raw)
  }
  const trimmed = String(raw).trim()
  if (!trimmed) return ''
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed?.ops) return deltaToText(parsed)
  } catch {
    // plain text
  }
  return trimmed
}
