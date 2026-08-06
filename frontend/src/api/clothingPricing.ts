import { apiRequest } from './client'

export type ClothingPricingResponse = {
  id: number
  seasonId: number
  seasonName: string
  shortKitPrice: number
  longKitPrice: number
  hoodiePrice: number
  allowAlreadyHasClothingSkip: boolean
  longKitPublicEnabled: boolean
  hoodiePublicEnabled: boolean
}

export type ClothingPricingRequest = {
  seasonId: number
  shortKitPrice: number
  longKitPrice: number
  hoodiePrice: number
  allowAlreadyHasClothingSkip: boolean
  longKitPublicEnabled: boolean
  hoodiePublicEnabled: boolean
}

export type ClothingPricingUpdateRequest = {
  shortKitPrice: number
  longKitPrice: number
  hoodiePrice: number
  allowAlreadyHasClothingSkip: boolean
  longKitPublicEnabled: boolean
  hoodiePublicEnabled: boolean
}

export function listClothingPricing(): Promise<ClothingPricingResponse[]> {
  return apiRequest<ClothingPricingResponse[]>('/api/clothing-pricing')
}

export function getClothingPricingBySeason(
  seasonId: number,
): Promise<ClothingPricingResponse> {
  return apiRequest<ClothingPricingResponse>(`/api/clothing-pricing/season/${seasonId}`)
}

export function createClothingPricing(
  request: ClothingPricingRequest,
): Promise<ClothingPricingResponse> {
  return apiRequest<ClothingPricingResponse>('/api/clothing-pricing', {
    method: 'POST',
    body: request,
  })
}

export function updateClothingPricing(
  pricingId: number,
  request: ClothingPricingUpdateRequest,
): Promise<ClothingPricingResponse> {
  return apiRequest<ClothingPricingResponse>(`/api/clothing-pricing/${pricingId}`, {
    method: 'PUT',
    body: request,
  })
}
