import { apiRequest } from './client'

export type SwimmingRegistrationSettingsResponse = {
  id: number
  seasonId: number
  seasonName: string
  introMarkdown: string
  groupWeeklySessions: number
}

export type SwimmingRegistrationSettingsRequest = {
  seasonId: number
  introMarkdown: string
  groupWeeklySessions: number
}

export type SwimmingRegistrationSettingsUpdateRequest = {
  introMarkdown: string
  groupWeeklySessions: number
}

export function listSwimmingRegistrationSettings(): Promise<
  SwimmingRegistrationSettingsResponse[]
> {
  return apiRequest<SwimmingRegistrationSettingsResponse[]>(
    '/api/swimming-registration-settings',
  )
}

export function getSwimmingRegistrationSettingsBySeason(
  seasonId: number,
): Promise<SwimmingRegistrationSettingsResponse> {
  return apiRequest<SwimmingRegistrationSettingsResponse>(
    `/api/swimming-registration-settings/season/${seasonId}`,
  )
}

export function createSwimmingRegistrationSettings(
  request: SwimmingRegistrationSettingsRequest,
): Promise<SwimmingRegistrationSettingsResponse> {
  return apiRequest<SwimmingRegistrationSettingsResponse>(
    '/api/swimming-registration-settings',
    {
      method: 'POST',
      body: request,
    },
  )
}

export function updateSwimmingRegistrationSettings(
  settingsId: number,
  request: SwimmingRegistrationSettingsUpdateRequest,
): Promise<SwimmingRegistrationSettingsResponse> {
  return apiRequest<SwimmingRegistrationSettingsResponse>(
    `/api/swimming-registration-settings/${settingsId}`,
    {
      method: 'PUT',
      body: request,
    },
  )
}
