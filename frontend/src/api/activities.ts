import { apiRequest } from './client'
import type { ActivityType } from '../types/enums'

export type ActivityResponse = {
  id: number
  activityType: ActivityType
  isActive: boolean
}

export type ActivityRequest = {
  activityType: ActivityType
  isActive: boolean
}

export function listActivities(): Promise<ActivityResponse[]> {
  return apiRequest<ActivityResponse[]>('/api/activities')
}

export function createActivity(request: ActivityRequest): Promise<ActivityResponse> {
  return apiRequest<ActivityResponse>('/api/activities', {
    method: 'POST',
    body: request,
  })
}

export function updateActivity(
  activityId: number,
  request: ActivityRequest,
): Promise<ActivityResponse> {
  return apiRequest<ActivityResponse>(`/api/activities/${activityId}`, {
    method: 'PUT',
    body: request,
  })
}

export function activateActivity(activityId: number): Promise<ActivityResponse> {
  return apiRequest<ActivityResponse>(`/api/activities/${activityId}/activate`, {
    method: 'PATCH',
  })
}

export function deactivateActivity(activityId: number): Promise<ActivityResponse> {
  return apiRequest<ActivityResponse>(`/api/activities/${activityId}/deactivate`, {
    method: 'PATCH',
  })
}
