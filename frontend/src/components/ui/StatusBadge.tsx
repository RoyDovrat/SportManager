import type { ReactNode } from 'react'
import type { PaymentStatus, RegistrationStatus } from '../../types/enums'

export type StatusTone = 'pending' | 'success' | 'danger' | 'neutral' | 'info'

type StatusBadgeProps = {
  tone: StatusTone
  children: ReactNode
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}

export function registrationStatusTone(
  status: RegistrationStatus,
): StatusTone {
  switch (status) {
    case 'APPROVED':
      return 'success'
    case 'PENDING':
      return 'pending'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function paymentStatusTone(status: PaymentStatus): StatusTone {
  switch (status) {
    case 'PAID':
      return 'success'
    case 'PENDING':
      return 'pending'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'neutral'
  }
}
