import { apiRequest } from './client'
import type { ActivityType, AgeGroup, SwimmingLessonType } from '../types/enums'

export type ActivityPricingResponse = {
  id: number
  seasonId: number
  seasonName: string
  activityId: number
  activityType: ActivityType
  ageGroup: AgeGroup | null
  swimmingLessonType: SwimmingLessonType | null
  weeklySessions: number | null
  monthlyPrice: number
}

export type ActivityPricingRequest = {
  seasonId: number
  activityType: ActivityType
  ageGroup?: AgeGroup | null
  swimmingLessonType?: SwimmingLessonType | null
  weeklySessions?: number | null
  monthlyPrice: number
}

export type ActivityPricingUpdateRequest = {
  weeklySessions?: number | null
  monthlyPrice: number
}

export function listActivityPricingBySeason(
  seasonId: number,
): Promise<ActivityPricingResponse[]> {
  return apiRequest<ActivityPricingResponse[]>(
    `/api/activity-pricing?seasonId=${seasonId}`,
  )
}

export function createActivityPricing(
  request: ActivityPricingRequest,
): Promise<ActivityPricingResponse> {
  return apiRequest<ActivityPricingResponse>('/api/activity-pricing', {
    method: 'POST',
    body: request,
  })
}

export function updateActivityPricing(
  pricingId: number,
  request: ActivityPricingUpdateRequest,
): Promise<ActivityPricingResponse> {
  return apiRequest<ActivityPricingResponse>(`/api/activity-pricing/${pricingId}`, {
    method: 'PUT',
    body: request,
  })
}
