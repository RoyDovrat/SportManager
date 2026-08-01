import { t } from './t'
import type {
  ActivityType,
  AgeGroup,
  Gender,
  RegistrationStatus,
  SwimmingLessonType,
  WaterAdaptationLevel,
} from '../types/enums'

export function activityTypeLabel(value: ActivityType): string {
  return t(`enums.activityType.${value}`)
}

export function ageGroupLabel(value: AgeGroup): string {
  return t(`enums.ageGroup.${value}`)
}

export function swimmingLessonTypeLabel(value: SwimmingLessonType): string {
  return t(`enums.swimmingLessonType.${value}`)
}

export function genderLabel(value: Gender): string {
  return t(`enums.gender.${value}`)
}

export function waterAdaptationLevelLabel(value: WaterAdaptationLevel): string {
  return t(`enums.waterAdaptationLevel.${value}`)
}

export function registrationStatusLabel(value: RegistrationStatus): string {
  return t(`enums.registrationStatus.${value}`)
}
