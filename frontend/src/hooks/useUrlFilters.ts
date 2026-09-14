import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { rememberLastSeasonId } from './lastSeason'

type FilterMap = Record<string, string>

/**
 * Syncs filter values with the URL query string so selections survive
 * View/Edit navigation and browser back.
 *
 * - Keys present in the URL win over defaults (including empty string = "all").
 * - Missing keys use defaults (e.g. first visit → PENDING).
 * - Updates use replace: true so filter tweaks don't spam history.
 * - A seasonId already in the URL is remembered for other admin screens.
 */
export function useUrlFilters<T extends FilterMap>(defaults: T): {
  filters: T
  setFilter: (key: keyof T & string, value: string) => void
  setFilters: (patch: Partial<T>) => void
  setSeasonId: (value: string) => void
  hasParam: (key: keyof T & string) => boolean
} {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultsRef = useRef(defaults)
  defaultsRef.current = defaults
  const initialSearchRef = useRef(searchParams)

  const defaultKeys = Object.keys(defaults).join('|')

  const filters = useMemo(() => {
    const base = defaultsRef.current
    const next = { ...base }
    for (const key of Object.keys(base) as Array<keyof T & string>) {
      if (searchParams.has(key)) {
        next[key] = (searchParams.get(key) ?? '') as T[typeof key]
      }
    }
    return next
    // defaultKeys tracks which filter fields exist; values come from defaultsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, defaultKeys])

  const applyPatch = useCallback(
    (patch: Partial<T>) => {
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
    [setSearchParams],
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
    (key: keyof T & string) => searchParams.has(key),
    [searchParams],
  )

  useEffect(() => {
    const initialSeasonId = initialSearchRef.current.get('seasonId')
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
