const STORAGE_PREFIX = 'sportmanager.adminFilters.'

type FilterMap = Record<string, string>

function storageKey(pageKey: string): string {
  return `${STORAGE_PREFIX}${pageKey}`
}

export function readAdminFilters(pageKey: string): FilterMap | null {
  try {
    const raw = localStorage.getItem(storageKey(pageKey))
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    const entries = Object.entries(parsed as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    )
    return entries.length > 0 ? Object.fromEntries(entries) : null
  } catch {
    return null
  }
}

export function writeAdminFilters(pageKey: string, values: FilterMap): void {
  try {
    localStorage.setItem(storageKey(pageKey), JSON.stringify(values))
  } catch {
    // Ignore quota / private-mode failures; filters still work in the URL.
  }
}
