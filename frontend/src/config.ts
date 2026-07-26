function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL

  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error(
      'VITE_API_BASE_URL is not set. Copy .env.example to .env and restart the dev server.',
    )
  }

  return raw.replace(/\/+$/, '')
}

export const apiBaseUrl = resolveApiBaseUrl()
