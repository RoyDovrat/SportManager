import { apiRequest } from './client'
import type {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '../types/enums'

export type PaymentResponse = {
  id: number
  registrationId: number
  studentId: number
  studentFirstName: string
  studentLastName: string
  parentId: number
  parentFirstName: string
  parentLastName: string
  isKibbutzMember: boolean
  amount: number
  chargeMonth: string | null
  status: PaymentStatus
  paymentDate: string | null
  paymentMethod: PaymentMethod | null
  paymentType: PaymentType
  clothingOrderId: number | null
}

export type ListPaymentsParams = {
  registrationId?: number | null
  status?: PaymentStatus | null
  paymentType?: PaymentType | null
  /** First day of month, e.g. `2026-08-01` */
  chargeMonth?: string | null
}

export type ConfirmPaymentRequest = {
  paymentMethod?: PaymentMethod | null
}

export type GenerateMonthlyPaymentsRequest = {
  chargeMonth: string
  seasonId?: number | null
}

export type GenerateMonthlyPaymentsResponse = {
  createdCount: number
  skippedCount: number
  createdPayments: PaymentResponse[]
}

export type ClothingPaymentRequest = {
  clothingOrderId: number
}

function buildPaymentsQuery(params: ListPaymentsParams = {}): string {
  const search = new URLSearchParams()

  if (params.registrationId != null) {
    search.set('registrationId', String(params.registrationId))
  }
  if (params.status != null) {
    search.set('status', params.status)
  }
  if (params.paymentType != null) {
    search.set('paymentType', params.paymentType)
  }
  if (params.chargeMonth != null && params.chargeMonth !== '') {
    search.set('chargeMonth', params.chargeMonth)
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

export function listPayments(
  params: ListPaymentsParams = {},
): Promise<PaymentResponse[]> {
  return apiRequest<PaymentResponse[]>(
    `/api/payments${buildPaymentsQuery(params)}`,
  )
}

export function getPayment(paymentId: number): Promise<PaymentResponse> {
  return apiRequest<PaymentResponse>(`/api/payments/${paymentId}`)
}

export function confirmPayment(
  paymentId: number,
  request: ConfirmPaymentRequest = {},
): Promise<PaymentResponse> {
  return apiRequest<PaymentResponse>(`/api/payments/${paymentId}/confirm`, {
    method: 'PATCH',
    body: request,
  })
}

export function cancelPayment(paymentId: number): Promise<PaymentResponse> {
  return apiRequest<PaymentResponse>(`/api/payments/${paymentId}/cancel`, {
    method: 'PATCH',
  })
}

export function generateMonthlyPayments(
  request: GenerateMonthlyPaymentsRequest,
): Promise<GenerateMonthlyPaymentsResponse> {
  return apiRequest<GenerateMonthlyPaymentsResponse>(
    '/api/payments/monthly/generate',
    {
      method: 'POST',
      body: {
        chargeMonth: request.chargeMonth,
        ...(request.seasonId != null ? { seasonId: request.seasonId } : {}),
      },
    },
  )
}

export function createClothingPayment(
  request: ClothingPaymentRequest,
): Promise<PaymentResponse> {
  return apiRequest<PaymentResponse>('/api/payments/clothing', {
    method: 'POST',
    body: request,
  })
}
