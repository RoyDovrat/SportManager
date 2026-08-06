import { apiRequest } from './client'
import type { ClothingSize } from '../types/enums'

export type ClothingOrderRequest = {
  studentIdentityNumber: string
  seasonId: number
  alreadyHasClothing: boolean
  shortKitQuantity?: number | null
  shortKitSize?: ClothingSize | null
  longKitQuantity?: number | null
  longKitSize?: ClothingSize | null
  hoodieQuantity?: number | null
  hoodieSize?: ClothingSize | null
  shirtNumber?: number | null
}

export type ClothingOrderUpdateRequest = {
  alreadyHasClothing: boolean
  shortKitQuantity?: number | null
  shortKitSize?: ClothingSize | null
  longKitQuantity?: number | null
  longKitSize?: ClothingSize | null
  hoodieQuantity?: number | null
  hoodieSize?: ClothingSize | null
  shirtNumber?: number | null
}

export type ClothingOrderResponse = {
  id: number
  registrationId: number
  studentId: number
  studentIdentityNumber: string
  studentFirstName: string
  studentLastName: string
  seasonId: number
  seasonName: string
  alreadyHasClothing: boolean
  shortKitQuantity: number | null
  shortKitSize: ClothingSize | null
  longKitQuantity: number | null
  longKitSize: ClothingSize | null
  hoodieQuantity: number | null
  hoodieSize: ClothingSize | null
  shirtNumber: number | null
  clothingPaymentRequired: boolean
}

export type ListClothingOrdersParams = {
  seasonId?: number | null
  studentIdentityNumber?: string | null
}

function buildClothingOrdersQuery(params: ListClothingOrdersParams = {}): string {
  const search = new URLSearchParams()

  if (params.seasonId != null) {
    search.set('seasonId', String(params.seasonId))
  }

  const identity = params.studentIdentityNumber?.trim()
  if (identity) {
    search.set('studentIdentityNumber', identity)
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

export function listClothingOrders(
  params: ListClothingOrdersParams = {},
): Promise<ClothingOrderResponse[]> {
  return apiRequest<ClothingOrderResponse[]>(
    `/api/clothing-orders${buildClothingOrdersQuery(params)}`,
  )
}

export function getClothingOrder(
  orderId: number,
): Promise<ClothingOrderResponse> {
  return apiRequest<ClothingOrderResponse>(`/api/clothing-orders/${orderId}`)
}

export function createClothingOrder(
  request: ClothingOrderRequest,
): Promise<ClothingOrderResponse> {
  return apiRequest<ClothingOrderResponse>('/api/clothing-orders', {
    method: 'POST',
    body: request,
  })
}

export function updateClothingOrder(
  orderId: number,
  request: ClothingOrderUpdateRequest,
): Promise<ClothingOrderResponse> {
  return apiRequest<ClothingOrderResponse>(`/api/clothing-orders/${orderId}`, {
    method: 'PUT',
    body: request,
  })
}
