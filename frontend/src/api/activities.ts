import { apiRequest } from './client'
import type { ActivityType } from '../types/enums'

export type ActivityResponse = {
  id: number
  activityType: ActivityType
  isActive: boolean
}

export function listActivities(): Promise<ActivityResponse[]> {
  return apiRequest<ActivityResponse[]>('/api/activities')
}
