import type { DayOfWeek } from '../types/enums'

/** Israeli week order: Sunday (1st) → Saturday (7th). */
export const WEEK_DAY_ORDER: readonly DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const

export function compareDayOfWeek(a: DayOfWeek | string, b: DayOfWeek | string): number {
  const indexA = WEEK_DAY_ORDER.indexOf(a as DayOfWeek)
  const indexB = WEEK_DAY_ORDER.indexOf(b as DayOfWeek)
  const safeA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA
  const safeB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB
  return safeA - safeB
}

export function sortByDayOfWeek<T extends { dayOfWeek: DayOfWeek | string }>(
  sessions: T[],
): T[] {
  return [...sessions].sort((left, right) =>
    compareDayOfWeek(left.dayOfWeek, right.dayOfWeek),
  )
}
