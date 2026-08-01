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
  healthDeclarationApproved: boolean
  hasMedicalLimitation: boolean
  medicalNotes: string | null
  specialRequests: string | null
}

export function createRegistration(
  request: RegistrationRequest,
): Promise<RegistrationResponse> {
  return apiRequest<RegistrationResponse>('/api/registrations', {
    method: 'POST',
    body: request,
  })
}
