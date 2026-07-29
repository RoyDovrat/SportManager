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
