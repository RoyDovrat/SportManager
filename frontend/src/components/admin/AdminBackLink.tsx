import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type AdminBackLinkProps = {
  fallbackTo: string
  children: ReactNode
  className?: string
  'aria-label'?: string
}

/**
 * Prefer browser back so list URL filters are restored; fall back to a
 * static list path when there is no history entry.
 */
export function AdminBackLink({
  fallbackTo,
  children,
  className = 'admin-back',
  'aria-label': ariaLabel,
}: AdminBackLinkProps) {
  const navigate = useNavigate()

  return (
    <Link
      to={fallbackTo}
      className={className}
      aria-label={ariaLabel}
      onClick={(event) => {
        if (window.history.length > 1) {
          event.preventDefault()
          navigate(-1)
        }
      }}
    >
      {children}
    </Link>
  )
}
