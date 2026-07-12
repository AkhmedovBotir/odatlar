import type { DeltaContent } from '../types/delta'

export function isEmptyDelta(delta?: DeltaContent): boolean {
  if (!delta?.ops?.length) return true
  const text = delta.ops
    .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
    .join('')
    .trim()
  return !text
}

export function textToDelta(text: string): DeltaContent {
  return { ops: [{ insert: text }] }
}

export function deltaToText(delta?: DeltaContent): string {
  if (!delta?.ops?.length) return ''
  return delta.ops.map((op) => (typeof op.insert === 'string' ? op.insert : '')).join('')
}

export function emptyDelta(): DeltaContent {
  return { ops: [{ insert: '\n' }] }
}

export function parseDescriptionDelta(raw?: string | DeltaContent | null): DeltaContent | undefined {
  if (!raw) return undefined
  if (typeof raw === 'object' && Array.isArray(raw.ops)) return raw
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  try {
    const parsed = JSON.parse(trimmed) as DeltaContent
    if (parsed?.ops) return parsed
  } catch {
    // oddiy matn — delta ga aylantiramiz
  }
  return textToDelta(trimmed)
}

export function deltaToApiString(delta?: DeltaContent): string | undefined {
  if (!delta || isEmptyDelta(delta)) return undefined
  return JSON.stringify(delta)
}
