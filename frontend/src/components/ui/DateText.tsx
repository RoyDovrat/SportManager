import { formatIsoDate, formatIsoDateTime } from '../../utils/formatDate'

type DateTextProps = {
  value: string | null | undefined
  createdAt?: string | null
  fallback?: string
}

export function DateText({
  value,
  createdAt,
  fallback = '—',
}: DateTextProps) {
  const text =
    createdAt != null
      ? formatIsoDateTime(value ?? '', createdAt)
      : formatIsoDate(value)

  if (!text) {
    return fallback
  }

  return (
    <span className="date-text" dir="ltr">
      {text}
    </span>
  )
}
