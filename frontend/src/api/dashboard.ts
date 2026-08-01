import { apiRequest } from './client'
import type { RegistrationResponse } from './registrations'

export type PaymentStatusSummary = {
  pendingCount: number
  paidCount: number
  cancelledCount: number
  pendingAmount: number
  paidAmount: number
  cancelledAmount: number
}

export type DashboardResponse = {
  seasonId: number | null
  seasonName: string | null
  totalRegistrations: number
  pendingRegistrations: number
  approvedRegistrations: number
  cancelledRegistrations: number
  activeStudents: number
  openChargesCount: number
  openChargesAmount: number
  monthlyIncome: number
  paymentStatusSummary: PaymentStatusSummary
  recentRegistrations: RegistrationResponse[]
}

export function getDashboard(
  seasonId?: number | null,
): Promise<DashboardResponse> {
  const search = new URLSearchParams()
  if (seasonId != null) {
    search.set('seasonId', String(seasonId))
  }
  const query = search.toString()
  return apiRequest<DashboardResponse>(
    `/api/dashboard${query ? `?${query}` : ''}`,
  )
}
