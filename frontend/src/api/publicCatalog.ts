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
