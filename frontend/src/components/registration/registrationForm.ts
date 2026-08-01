import type { RegistrationRequest } from '../../api/registrations'
import type {
  AgeGroup,
  Gender,
  SwimmingLessonType,
  WaterAdaptationLevel,
} from '../../types/enums'
import {
  cleanText,
  normalizeIsraeliId,
  normalizeIsraeliPhone,
} from '../../validation/fields'

export type RegistrationCommonForm = {
  parentFirstName: string
  parentLastName: string
  phoneNumber: string
  studentFirstName: string
  studentLastName: string
  studentIdentityNumber: string
  age: string
  ageGroup: AgeGroup
  gender: Gender
  isKibbutzMember: boolean
  budgetNumber: string
  hasMedicalLimitation: boolean
  healthDeclarationApproved: boolean
  medicalNotes: string
  specialRequests: string
}

export const emptyRegistrationCommonForm: RegistrationCommonForm = {
  parentFirstName: '',
  parentLastName: '',
  phoneNumber: '',
  studentFirstName: '',
  studentLastName: '',
  studentIdentityNumber: '',
  age: '',
  ageGroup: 'GRADE_1',
  gender: 'MALE',
  isKibbutzMember: false,
  budgetNumber: '',
  hasMedicalLimitation: false,
  healthDeclarationApproved: false,
  medicalNotes: '',
  specialRequests: '',
}

export type SwimmingFormExtras = {
  swimmingLessonType: SwimmingLessonType
  waterAdaptationLevel: WaterAdaptationLevel
  weeklySessions: string
}

export const emptySwimmingFormExtras: SwimmingFormExtras = {
  swimmingLessonType: 'GROUP',
  waterAdaptationLevel: 'NOT_INDEPENDENT',
  weeklySessions: '1',
}

export function toRegistrationRequest(
  form: RegistrationCommonForm,
  seasonId: number,
  activityId: number,
  swimming?: SwimmingFormExtras,
): RegistrationRequest {
  return {
    parentFirstName: cleanText(form.parentFirstName),
    parentLastName: cleanText(form.parentLastName),
    phoneNumber: normalizeIsraeliPhone(form.phoneNumber),
    studentFirstName: cleanText(form.studentFirstName),
    studentLastName: cleanText(form.studentLastName),
    studentIdentityNumber: normalizeIsraeliId(form.studentIdentityNumber),
    age: Number(form.age),
    ageGroup: form.ageGroup,
    gender: form.gender,
    isKibbutzMember: form.isKibbutzMember,
    budgetNumber: form.isKibbutzMember
      ? cleanText(form.budgetNumber)
      : null,
    activityId,
    seasonId,
    hasMedicalLimitation: form.hasMedicalLimitation,
    healthDeclarationApproved: form.healthDeclarationApproved,
    medicalNotes: cleanText(form.medicalNotes) || null,
    specialRequests: cleanText(form.specialRequests) || null,
    ...(swimming
      ? {
          swimmingLessonType: swimming.swimmingLessonType,
          waterAdaptationLevel: swimming.waterAdaptationLevel,
          weeklySessions: Number(swimming.weeklySessions),
        }
      : {}),
  }
}
