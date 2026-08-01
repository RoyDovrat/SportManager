function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL

  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error(
      'VITE_API_BASE_URL לא מוגדר. העתיקו את .env.example ל־.env והפעילו מחדש את שרת הפיתוח.',
    )
  }

  return raw.replace(/\/+$/, '')
}

export const apiBaseUrl = resolveApiBaseUrl()
