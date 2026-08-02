import { apiRequest } from './client'
import type { ActivityResponse } from './activities'
import type { SeasonResponse } from './seasons'

export function getActiveSeason(): Promise<SeasonResponse> {
  return apiRequest<SeasonResponse>('/api/seasons/active')
}

export function listActiveActivities(): Promise<ActivityResponse[]> {
  return apiRequest<ActivityResponse[]>('/api/activities/active')
}

export type FootballCatalogResponse = {
  seasonId: number
  seasonName: string
  activityId: number
  groups: Array<{
    id: number
    name: string
    ageGroups: string[]
    weeklySessions: number | null
    trainingSessions: Array<{
      id: number
      dayOfWeek: string
      startTime: string
      endTime: string | null
      isActive: boolean
    }>
    monthlyPrice: number | null
    activityPricingId: number | null
  }>
  prices: Array<{ weeklySessions: number; monthlyPrice: number; activityPricingId: number }>
}

export function getFootballCatalog(): Promise<FootballCatalogResponse> {
  return apiRequest<FootballCatalogResponse>('/api/public/football-catalog')
}

export type SwimmingCatalogResponse = {
  seasonId: number
  seasonName: string
  activityId: number
  introMarkdown: string
  groupWeeklySessions: number
  prices: Array<{
    swimmingLessonType: string
    unitMonthlyPrice: number
    activityPricingId: number
  }>
}

export function getSwimmingCatalog(): Promise<SwimmingCatalogResponse> {
  return apiRequest<SwimmingCatalogResponse>('/api/public/swimming-catalog')
}

export type ClothingCatalogResponse = {
  seasonId: number
  seasonName: string
  pricingConfigured: boolean
  shortKitPrice: number | null
  longKitPrice: number | null
  hoodiePrice: number | null
  allowAlreadyHasClothingSkip: boolean
}

export type ClothingEligibilityResponse = {
  eligible: boolean
  seasonId: number
  registrationId: number
  studentId: number
  studentIdentityNumber: string
  studentFirstName: string
  studentLastName: string
}

export function getClothingCatalog(): Promise<ClothingCatalogResponse> {
  return apiRequest<ClothingCatalogResponse>('/api/public/clothing-catalog')
}

export function checkClothingEligibility(
  seasonId: number,
  studentIdentityNumber: string,
): Promise<ClothingEligibilityResponse> {
  const params = new URLSearchParams({
    seasonId: String(seasonId),
    studentIdentityNumber,
  })
  return apiRequest<ClothingEligibilityResponse>(
    `/api/public/clothing-eligibility?${params.toString()}`,
  )
}
