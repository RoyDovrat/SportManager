import { apiRequest } from './client'
import type {
  ActivityType,
  AgeGroup,
  Gender,
  RegistrationStatus,
  SwimmingLessonType,
  WaterAdaptationLevel,
} from '../types/enums'

export type RegistrationRequest = {
  parentFirstName: string
  parentLastName: string
  phoneNumber: string
  studentFirstName: string
  studentLastName: string
  studentIdentityNumber: string
  age: number
  ageGroup: AgeGroup
  gender: Gender
  isKibbutzMember: boolean
  budgetNumber?: string | null
  activityId: number
  seasonId: number
  swimmingLessonType?: SwimmingLessonType | null
  waterAdaptationLevel?: WaterAdaptationLevel | null
  weeklySessions?: number | null
  hasMedicalLimitation: boolean
  healthDeclarationApproved: boolean
  medicalNotes?: string | null
  specialRequests?: string | null
}

export type RegistrationResponse = {
  id: number
  registrationDate: string
  status: RegistrationStatus
  studentId: number
  studentFirstName: string
  studentLastName: string
  studentIdentityNumber: string
  studentAge: number
  studentAgeGroup: AgeGroup
  studentGender: Gender
  parentId: number
  parentFirstName: string
  parentLastName: string
  phoneNumber: string
  isKibbutzMember: boolean
  budgetNumber: string | null
  activityId: number
  activityType: ActivityType
  seasonId: number
  seasonName: string
  activityPricingId: number | null
  activityGroupId: number | null
  activityGroupName: string | null
  swimmingLessonType: SwimmingLessonType | null
  waterAdaptationLevel: WaterAdaptationLevel | null
  weeklySessions: number | null
  healthDeclarationApproved: boolean
  hasMedicalLimitation: boolean
  medicalNotes: string | null
  specialRequests: string | null
}

export type ListRegistrationsParams = {
  seasonId?: number | null
  status?: RegistrationStatus | null
}

export function createRegistration(
  request: RegistrationRequest,
): Promise<RegistrationResponse> {
  return apiRequest<RegistrationResponse>('/api/registrations', {
    method: 'POST',
    body: request,
  })
}

function buildRegistrationsQuery(params: ListRegistrationsParams = {}): string {
  const search = new URLSearchParams()

  if (params.seasonId != null) {
    search.set('seasonId', String(params.seasonId))
  }
  if (params.status != null) {
    search.set('status', params.status)
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

export function listRegistrations(
  params: ListRegistrationsParams = {},
): Promise<RegistrationResponse[]> {
  return apiRequest<RegistrationResponse[]>(
    `/api/registrations${buildRegistrationsQuery(params)}`,
  )
}

export function getRegistration(
  registrationId: number,
): Promise<RegistrationResponse> {
  return apiRequest<RegistrationResponse>(
    `/api/registrations/${registrationId}`,
  )
}

export function approveRegistration(
  registrationId: number,
): Promise<RegistrationResponse> {
  return apiRequest<RegistrationResponse>(
    `/api/registrations/${registrationId}/approve`,
    { method: 'PATCH' },
  )
}

export function cancelRegistration(
  registrationId: number,
): Promise<RegistrationResponse> {
  return apiRequest<RegistrationResponse>(
    `/api/registrations/${registrationId}/cancel`,
    { method: 'PATCH' },
  )
}
