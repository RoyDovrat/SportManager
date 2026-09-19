function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL

  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.replace(/\/+$/, '')
  }

  // Production default: same origin (Nginx serves the UI and proxies /api).
  if (import.meta.env.PROD) {
    return ''
  }

  throw new Error(
    'VITE_API_BASE_URL לא מוגדר. העתיקו את .env.example ל־.env והפעילו מחדש את שרת הפיתוח.',
  )
}

export const apiBaseUrl = resolveApiBaseUrl()
