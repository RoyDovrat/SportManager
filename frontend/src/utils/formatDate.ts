/** Display dates left-to-right as day-month-year. */

const LTR = '\u200E'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** DD-MM-YYYY, or MM-YYYY when only a month is given. */
export function formatIsoDate(value: string | null | undefined): string {
  if (value == null || value === '') {
    return ''
  }

  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(value.trim())
  if (!match) {
    return value
  }

  const [, year, month, day] = match
  const formatted = day ? `${day}-${month}-${year}` : `${month}-${year}`
  return `${LTR}${formatted}`
}

/** Date plus optional time as DD-MM-YYYY HH:mm. */
export function formatIsoDateTime(
  date: string,
  createdAt?: string | null,
): string {
  if (createdAt) {
    const parsed = new Date(createdAt)
    if (!Number.isNaN(parsed.getTime())) {
      const datePart = `${pad(parsed.getDate())}-${pad(parsed.getMonth() + 1)}-${parsed.getFullYear()}`
      const timePart = `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
      return `${LTR}${datePart} ${timePart}`
    }
  }

  return formatIsoDate(date)
}
