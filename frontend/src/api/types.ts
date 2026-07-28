export type ErrorResponse = {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors: Record<string, string> | null
}

export class ApiError extends Error {
  readonly status: number
  readonly body: ErrorResponse | null

  constructor(message: string, status: number, body: ErrorResponse | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.status === 'number' &&
    typeof candidate.error === 'string' &&
    typeof candidate.message === 'string' &&
    typeof candidate.path === 'string'
  )
}
