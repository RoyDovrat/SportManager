import { t } from '../i18n/t'
import { ApiError } from './types'

const FIELD_LABELS: Record<string, string> = {
  parentFirstName: 'שם פרטי של ההורה',
  parentLastName: 'שם משפחה של ההורה',
  phoneNumber: 'מספר טלפון',
  studentFirstName: 'שם פרטי של הילד/ה',
  studentLastName: 'שם משפחה של הילד/ה',
  studentIdentityNumber: 'מספר זהות',
  age: 'גיל',
  ageGroup: 'קבוצת גיל',
  gender: 'מגדר',
  budgetNumber: 'מספר תקציב',
  healthDeclarationApproved: 'הצהרת בריאות',
  swimmingLessonType: 'סוג שיעור',
  waterAdaptationLevel: 'רמת הסתגלות למים',
  weeklySessions: 'מפגשים בשבוע',
  seasonId: 'עונה',
  activityId: 'חוג',
  shortKitSize: 'מידת חליפה קצרה',
  longKitSize: 'מידת חליפה ארוכה',
  hoodieSize: 'מידת קפוצ׳ון',
  shirtNumber: 'מספר חולצה',
}

function looksHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text)
}

/** User-facing API errors for public registration/clothing wizards (Hebrew). */
export function formatPublicApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldErrors = error.body?.fieldErrors
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      const details = Object.entries(fieldErrors)
        .map(([field, message]) => {
          const label = FIELD_LABELS[field] ?? field
          const detail = looksHebrew(message)
            ? message
            : t('wizard.errors.fieldInvalid')
          return `${label}: ${detail}`
        })
        .join(' · ')
      return `${t('wizard.errors.validation')} ${details}`
    }

    if (error.status === 409) {
      return t('wizard.errors.conflict')
    }
    if (error.status === 404) {
      return t('wizard.errors.notFound')
    }
    if (error.status === 400 || error.status === 422) {
      if (error.message && looksHebrew(error.message)) {
        return error.message
      }
      return t('wizard.errors.validation')
    }
    if (error.status >= 500) {
      return t('wizard.errors.server')
    }
    if (error.message && looksHebrew(error.message)) {
      return error.message
    }
    return t('wizard.errors.requestFailed')
  }

  if (error instanceof Error && looksHebrew(error.message)) {
    return error.message
  }

  return t('wizard.errors.requestFailed')
}
