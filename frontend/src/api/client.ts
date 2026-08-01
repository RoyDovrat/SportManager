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

async function fetchApiResponse(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
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
    const errorBody = await parseErrorBody(response)

    // Only clear the session for real auth failures. Spring's /error page used to
    // return 401 when unhandled exceptions occurred, which logged admins out on create.
    const isAuthFailure =
      response.status === 401 &&
      !isAuthLoginPath(path) &&
      errorBody?.path !== '/error'

    if (isAuthFailure) {
      clearSession()
      notifyUnauthorized()
    }

    throw new ApiError(
      errorBody?.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorBody,
    )
  }

  return response
}

/** Parse filename from Content-Disposition (RFC 5987 / quoted form). */
export function parseContentDispositionFileName(
  header: string | null,
): string | null {
  if (!header) {
    return null
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim())
    } catch {
      return utf8Match[1].trim()
    }
  }

  const quotedMatch = /filename="([^"]+)"/i.exec(header)
  if (quotedMatch?.[1]) {
    return quotedMatch[1]
  }

  const bareMatch = /filename=([^;]+)/i.exec(header)
  if (bareMatch?.[1]) {
    return bareMatch[1].trim().replace(/^["']|["']$/g, '')
  }

  return null
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetchApiResponse(path, options)

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('application/json')) {
    return undefined as T
  }

  return (await response.json()) as T
}

export type ApiDownloadResult = {
  blob: Blob
  fileName: string | null
}

/** Authenticated binary download (e.g. Excel). Errors still use JSON ErrorResponse. */
export async function apiDownload(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiDownloadResult> {
  const response = await fetchApiResponse(path, options)
  const blob = await response.blob()
  const fileName = parseContentDispositionFileName(
    response.headers.get('Content-Disposition'),
  )
  return { blob, fileName }
}
