import type { ClothingOrderResponse } from './clothingOrders'
import { apiRequest } from './client'
import type { PaymentResponse } from './payments'
import type { RegistrationResponse } from './registrations'

export type RegistrationReportSection = {
  total: number
  pending: number
  approved: number
  cancelled: number
  activeStudents: number
  items: RegistrationResponse[]
}

export type PaymentReportSection = {
  pendingCount: number
  paidCount: number
  cancelledCount: number
  pendingAmount: number
  paidAmount: number
  cancelledAmount: number
  items: PaymentResponse[]
}

export type ClothingReportSection = {
  totalOrders: number
  ordersRequiringPayment: number
  alreadyHasClothingCount: number
  items: ClothingOrderResponse[]
}

export type SeasonReportResponse = {
  seasonId: number
  seasonName: string
  registrations: RegistrationReportSection
  payments: PaymentReportSection
  clothing: ClothingReportSection
}

export function getSeasonReport(
  seasonId: number,
): Promise<SeasonReportResponse> {
  const search = new URLSearchParams({
    seasonId: String(seasonId),
  })
  return apiRequest<SeasonReportResponse>(
    `/api/reports/summary?${search.toString()}`,
  )
}
