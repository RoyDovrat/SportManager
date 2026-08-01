import { apiRequest } from './client'
import type { RegistrationResponse } from './registrations'
import type {
  ActivityType,
  AgeGroup,
  SwimmingLessonType,
  WaterAdaptationLevel,
} from '../types/enums'

export type ActivityGroupResponse = {
  id: number
  name: string
  seasonId: number
  seasonName: string
  activityId: number
  activityType: ActivityType
  ageGroups: AgeGroup[]
  swimmingLessonType: SwimmingLessonType | null
  waterAdaptationLevel: WaterAdaptationLevel | null
  weeklySessions: number | null
  isActive: boolean
  memberCount: number
}

export type ActivityGroupRequest = {
  name: string
  seasonId: number
  activityType: ActivityType
  ageGroups?: AgeGroup[] | null
  swimmingLessonType?: SwimmingLessonType | null
  waterAdaptationLevel?: WaterAdaptationLevel | null
  weeklySessions?: number | null
  isActive: boolean
}

export type ActivityGroupUpdateRequest = {
  name: string
  ageGroups?: AgeGroup[] | null
  swimmingLessonType?: SwimmingLessonType | null
  waterAdaptationLevel?: WaterAdaptationLevel | null
  weeklySessions?: number | null
  isActive: boolean
}

export type ListActivityGroupsParams = {
  seasonId: number
  activityId?: number | null
  activeOnly?: boolean | null
}

function buildGroupsQuery(params: ListActivityGroupsParams): string {
  const search = new URLSearchParams()
  search.set('seasonId', String(params.seasonId))

  if (params.activityId != null) {
    search.set('activityId', String(params.activityId))
  }
  if (params.activeOnly != null) {
    search.set('activeOnly', String(params.activeOnly))
  }

  return `?${search.toString()}`
}

export function listActivityGroups(
  params: ListActivityGroupsParams,
): Promise<ActivityGroupResponse[]> {
  return apiRequest<ActivityGroupResponse[]>(
    `/api/activity-groups${buildGroupsQuery(params)}`,
  )
}

export function getActivityGroup(
  groupId: number,
): Promise<ActivityGroupResponse> {
  return apiRequest<ActivityGroupResponse>(`/api/activity-groups/${groupId}`)
}

export function createActivityGroup(
  request: ActivityGroupRequest,
): Promise<ActivityGroupResponse> {
  return apiRequest<ActivityGroupResponse>('/api/activity-groups', {
    method: 'POST',
    body: request,
  })
}

export function updateActivityGroup(
  groupId: number,
  request: ActivityGroupUpdateRequest,
): Promise<ActivityGroupResponse> {
  return apiRequest<ActivityGroupResponse>(`/api/activity-groups/${groupId}`, {
    method: 'PUT',
    body: request,
  })
}

export function activateActivityGroup(
  groupId: number,
): Promise<ActivityGroupResponse> {
  return apiRequest<ActivityGroupResponse>(
    `/api/activity-groups/${groupId}/activate`,
    { method: 'PATCH' },
  )
}

export function deactivateActivityGroup(
  groupId: number,
): Promise<ActivityGroupResponse> {
  return apiRequest<ActivityGroupResponse>(
    `/api/activity-groups/${groupId}/deactivate`,
    { method: 'PATCH' },
  )
}

export function listGroupRegistrations(
  groupId: number,
): Promise<RegistrationResponse[]> {
  return apiRequest<RegistrationResponse[]>(
    `/api/activity-groups/${groupId}/registrations`,
  )
}

export function listEligibleRegistrations(
  groupId: number,
): Promise<RegistrationResponse[]> {
  return apiRequest<RegistrationResponse[]>(
    `/api/activity-groups/${groupId}/eligible-registrations`,
  )
}

export function assignRegistrationToGroup(
  groupId: number,
  registrationId: number,
): Promise<RegistrationResponse> {
  return apiRequest<RegistrationResponse>(
    `/api/activity-groups/${groupId}/registrations/${registrationId}`,
    { method: 'POST' },
  )
}

export function unassignRegistrationFromGroup(
  registrationId: number,
): Promise<void> {
  return apiRequest<void>(
    `/api/activity-groups/registrations/${registrationId}`,
    { method: 'DELETE' },
  )
}
