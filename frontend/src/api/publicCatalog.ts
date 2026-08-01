import { apiRequest } from './client'
import type { ActivityResponse } from './activities'
import type { SeasonResponse } from './seasons'

export function getActiveSeason(): Promise<SeasonResponse> {
  return apiRequest<SeasonResponse>('/api/seasons/active')
}

export function listActiveActivities(): Promise<ActivityResponse[]> {
  return apiRequest<ActivityResponse[]>('/api/activities/active')
}
