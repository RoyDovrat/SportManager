import { apiRequest } from './client'

export type SeasonResponse = {
  id: number
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export type SeasonRequest = {
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export function listSeasons(): Promise<SeasonResponse[]> {
  return apiRequest<SeasonResponse[]>('/api/seasons')
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
