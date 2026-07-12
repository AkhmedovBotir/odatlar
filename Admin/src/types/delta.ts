export interface DeltaOp {
  insert: string
  attributes?: Record<string, unknown>
}

export interface DeltaContent {
  ops: DeltaOp[]
}
