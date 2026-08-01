import { he } from './he'

type Primitive = string | number | boolean

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/** Resolve a Hebrew message by dot-path, e.g. t('nav.seasons'). */
export function t(path: string, vars?: Record<string, Primitive>): string {
  const value = getByPath(he, path)

  if (typeof value !== 'string') {
    return path
  }

  if (!vars) {
    return value
  }

  return Object.entries(vars).reduce(
    (text, [key, replacement]) => text.split(`{${key}}`).join(String(replacement)),
    value,
  )
}
