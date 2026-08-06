import { apiRequest } from './client'
import type { ActivityType } from '../types/enums'

export type SeasonResponse = {
  id: number
  name: string
  startDate: string
  endDate: string
  activityType: ActivityType
  isActive: boolean
}

export type SeasonRequest = {
  name: string
  startDate: string
  endDate: string
  activityType: ActivityType
  isActive: boolean
}

export function listSeasons(): Promise<SeasonResponse[]> {
  return apiRequest<SeasonResponse[]>('/api/seasons')
}

export function listActiveSeasons(): Promise<SeasonResponse[]> {
  return apiRequest<SeasonResponse[]>('/api/seasons/active')
}

export function getActiveSeasonByType(
  activityType: ActivityType,
): Promise<SeasonResponse> {
  return apiRequest<SeasonResponse>(`/api/seasons/active/${activityType}`)
}

export function createSeason(request: SeasonRequest): Promise<SeasonResponse> {
  return apiRequest<SeasonResponse>('/api/seasons', {
    method: 'POST',
    body: request,
  })
}

export function updateSeason(
  seasonId: number,
  request: SeasonRequest,
): Promise<SeasonResponse> {
  return apiRequest<SeasonResponse>(`/api/seasons/${seasonId}`, {
    method: 'PUT',
    body: request,
  })
}

export function activateSeason(seasonId: number): Promise<SeasonResponse> {
  return apiRequest<SeasonResponse>(`/api/seasons/${seasonId}/activate`, {
    method: 'PATCH',
  })
}

export function deactivateSeason(seasonId: number): Promise<SeasonResponse> {
  return apiRequest<SeasonResponse>(`/api/seasons/${seasonId}/deactivate`, {
    method: 'PATCH',
  })
}
