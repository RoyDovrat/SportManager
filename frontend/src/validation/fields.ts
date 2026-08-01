/**
 * Shared form validation helpers for SportManager.
 * Prefer these over ad-hoc checks so public and admin stay consistent.
 */

/** Collapse whitespace and trim ends. */
export function cleanText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/** True when the value has non-whitespace content. */
export function hasText(value: string): boolean {
  return cleanText(value).length > 0
}

/** Digits only, for IDs and phones. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Israeli ID (תעודת זהות): 9 digits with official checksum.
 * Accepts leading zeros / fewer digits (padded to 9).
 */
export function normalizeIsraeliId(value: string): string {
  const digits = digitsOnly(value)
  if (digits.length === 0 || digits.length > 9) {
    return digits
  }
  return digits.padStart(9, '0')
}

export function isValidIsraeliId(value: string): boolean {
  const id = normalizeIsraeliId(value)
  if (!/^\d{9}$/.test(id)) {
    return false
  }
  // Reject all zeros
  if (/^0+$/.test(id)) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    let num = Number(id[i]) * ((i % 2) + 1)
    if (num > 9) {
      num -= 9
    }
    sum += num
  }
  return sum % 10 === 0
}

/**
 * Normalize Israeli phone to local digits (e.g. 05xxxxxxxx).
 * Accepts +972 / 972 prefixes and common separators.
 */
export function normalizeIsraeliPhone(value: string): string {
  let digits = digitsOnly(value)
  if (digits.startsWith('972')) {
    digits = `0${digits.slice(3)}`
  }
  return digits
}

/** Israeli mobile: 05X-XXXXXXX (10 digits). */
export function isValidIsraeliMobile(value: string): boolean {
  return /^05\d{8}$/.test(normalizeIsraeliPhone(value))
}

export type FieldIssue =
  | 'required'
  | 'israeliId'
  | 'israeliMobile'
  | 'positiveNumber'

export function requiredIssue(value: string): FieldIssue | null {
  return hasText(value) ? null : 'required'
}
