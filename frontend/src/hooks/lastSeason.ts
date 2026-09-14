const LAST_SEASON_KEY = 'sportmanager.lastSeasonId'

type SeasonLike = {
  id: number
  isActive: boolean
}

export function getLastSeasonId(): string | null {
  try {
    const value = sessionStorage.getItem(LAST_SEASON_KEY)
    return value ? value : null
  } catch {
    return null
  }
}

export function rememberLastSeasonId(seasonId: string): void {
  if (seasonId === '') {
    return
  }
  try {
    sessionStorage.setItem(LAST_SEASON_KEY, seasonId)
  } catch {
    // Ignore quota / private-mode failures; selection still works in the URL.
  }
}

/**
 * Prefer the last season the admin picked, when it is still in this list.
 * Otherwise the active season, then the first row.
 */
export function pickDefaultSeasonId(
  seasons: ReadonlyArray<SeasonLike>,
  options?: { fallbackToFirst?: boolean },
): number | undefined {
  if (seasons.length === 0) {
    return undefined
  }

  const last = getLastSeasonId()
  if (last != null) {
    const match = seasons.find((season) => String(season.id) === last)
    if (match) {
      return match.id
    }
  }

  const active = seasons.find((season) => season.isActive)
  if (active) {
    return active.id
  }

  if (options?.fallbackToFirst === false) {
    return undefined
  }

  return seasons[0]?.id
}
