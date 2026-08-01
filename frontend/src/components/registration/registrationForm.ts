import type { AgeGroup, Gender } from '../../types/enums'

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
