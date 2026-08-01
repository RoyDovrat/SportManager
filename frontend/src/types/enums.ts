export const ACTIVITY_TYPES = ['FOOTBALL', 'SWIMMING'] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const AGE_GROUPS = [
  'YOUNG_GAN_RIMON',
  'OLD_GAN_RIMON',
  'GRADE_1',
  'GRADE_2',
  'GRADE_3',
  'GRADE_4',
  'GRADE_5',
  'GRADE_6',
  'OLD_GAN_HADAR',
] as const
export type AgeGroup = (typeof AGE_GROUPS)[number]

export const SWIMMING_LESSON_TYPES = ['PRIVATE', 'PAIR', 'GROUP'] as const
export type SwimmingLessonType = (typeof SWIMMING_LESSON_TYPES)[number]

export const GENDERS = ['MALE', 'FEMALE'] as const
export type Gender = (typeof GENDERS)[number]

export const WATER_ADAPTATION_LEVELS = [
  'NOT_INDEPENDENT',
  'INDEPENDENT_NO_HEAD',
  'INDEPENDENT_WITH_HEAD',
  'BASIC_SWIMMING',
] as const
export type WaterAdaptationLevel = (typeof WATER_ADAPTATION_LEVELS)[number]

export const REGISTRATION_STATUSES = ['PENDING', 'APPROVED', 'CANCELLED'] as const
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number]

export const CLOTHING_SIZES = [
  'YOUTH_4',
  'YOUTH_6',
  'YOUTH_8',
  'YOUTH_10',
  'YOUTH_12',
  'YOUTH_14',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
] as const
export type ClothingSize = (typeof CLOTHING_SIZES)[number]

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_TYPES = [
  'MONTHLY_ACTIVITY',
  'CLOTHING',
  'MANUAL_ONE_TIME',
] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

export const PAYMENT_METHODS = ['BIT', 'PAYBOX', 'KIBBUTZ_BUDGET'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
