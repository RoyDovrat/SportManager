import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { readAdminFilters, writeAdminFilters } from './adminFilterStorage'
import { rememberLastSeasonId } from './lastSeason'

type FilterMap = Record<string, string>

type UrlFilterOptions = {
  /** Page-specific localStorage key so each admin screen remembers its own filters. */
  storageKey?: string
}

function storedHasKey(stored: FilterMap | null, key: string): boolean {
  return stored != null && Object.prototype.hasOwnProperty.call(stored, key)
}

/**
 * Syncs filter values with the URL query string so selections survive
 * View/Edit navigation and browser back. Optional `storageKey` also remembers
 * the latest selections in localStorage when navigating between admin pages.
 *
 * - Keys present in the URL win over stored values and defaults.
 * - Stored values win over defaults when the URL does not have the key.
 * - Empty string = "all" and is distinct from "use default".
 * - Updates use replace: true so filter tweaks don't spam history.
 * - A seasonId already in the URL is remembered for other admin screens.
 */
export function useUrlFilters<T extends FilterMap>(
  defaults: T,
  options?: UrlFilterOptions,
): {
  filters: T
  setFilter: (key: keyof T & string, value: string) => void
  setFilters: (patch: Partial<T>) => void
  setSeasonId: (value: string) => void
  hasParam: (key: keyof T & string) => boolean
} {
  const storageKey = options?.storageKey
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultsRef = useRef(defaults)
  defaultsRef.current = defaults
  const initialSearchRef = useRef(searchParams)
  const storedRef = useRef<FilterMap | null>(
    storageKey ? readAdminFilters(storageKey) : null,
  )

  const defaultKeys = Object.keys(defaults).join('|')

  const filters = useMemo(() => {
    const base = defaultsRef.current
    const stored = storedRef.current
    const next = { ...base }
    for (const key of Object.keys(base) as Array<keyof T & string>) {
      if (searchParams.has(key)) {
        next[key] = (searchParams.get(key) ?? '') as T[typeof key]
      } else if (storedHasKey(stored, key)) {
        next[key] = stored![key] as T[typeof key]
      }
    }
    return next
    // defaultKeys tracks which filter fields exist; values come from defaultsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, defaultKeys])

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const persist = useCallback(
    (next: T) => {
      if (!storageKey) {
        return
      }
      const snapshot = { ...defaultsRef.current }
      for (const key of Object.keys(snapshot) as Array<keyof T & string>) {
        snapshot[key] = next[key] ?? ''
      }
      storedRef.current = snapshot
      writeAdminFilters(storageKey, snapshot)
    },
    [storageKey],
  )

  const applyPatch = useCallback(
    (patch: Partial<T>) => {
      const next = { ...filtersRef.current }
      for (const [key, value] of Object.entries(patch)) {
        if (value == null) {
          next[key] = defaultsRef.current[key] ?? ''
        } else {
          next[key] = String(value)
        }
      }
      persist(next)

      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch)) {
            if (value == null) {
              params.delete(key)
            } else {
              // Keep empty string in the URL so "all" is distinct from "use default".
              params.set(key, String(value))
            }
          }
          return params
        },
        { replace: true },
      )
    },
    [persist, setSearchParams],
  )

  const setFilter = useCallback(
    (key: keyof T & string, value: string) => {
      applyPatch({ [key]: value } as Partial<T>)
    },
    [applyPatch],
  )

  const setSeasonId = useCallback(
    (value: string) => {
      rememberLastSeasonId(value)
      applyPatch({ seasonId: value } as unknown as Partial<T>)
    },
    [applyPatch],
  )

  const hasParam = useCallback(
    (key: keyof T & string) =>
      searchParams.has(key) || storedHasKey(storedRef.current, key),
    [searchParams],
  )

  useEffect(() => {
    const initialSeasonId =
      initialSearchRef.current.get('seasonId') ||
      (storedHasKey(storedRef.current, 'seasonId')
        ? storedRef.current!.seasonId
        : '')
    if (initialSeasonId) {
      rememberLastSeasonId(initialSeasonId)
    }
  }, [])

  return {
    filters,
    setFilter,
    setFilters: applyPatch,
    setSeasonId,
    hasParam,
  }
}
