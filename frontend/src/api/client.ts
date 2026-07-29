import { clearSession, getAccessToken } from '../auth/tokenStorage'
import { notifyUnauthorized } from '../auth/authEvents'
import { apiBaseUrl } from '../config'
import { ApiError, isErrorResponse, type ErrorResponse } from './types'

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

async function parseErrorBody(response: Response): Promise<ErrorResponse | null> {
  try {
    const data: unknown = await response.json()
    return isErrorResponse(data) ? data : null
  } catch {
    return null
  }
}

function isAuthLoginPath(path: string): boolean {
  return path === '/api/auth/login' || path.endsWith('/api/auth/login')
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const url = `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(options.headers)

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const accessToken = getAccessToken()
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    if (response.status === 401 && !isAuthLoginPath(path)) {
      clearSession()
      notifyUnauthorized()
    }

    const errorBody = await parseErrorBody(response)
    throw new ApiError(
      errorBody?.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorBody,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('application/json')) {
    return undefined as T
  }

  return (await response.json()) as T
}
