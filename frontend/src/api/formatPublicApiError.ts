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

function translateBusinessMessage(message: string | undefined): string | null {
  if (!message) {
    return null
  }

  const exact: Record<string, string> = {
    'Health declaration must be approved to complete registration':
      t('wizard.errors.healthRequired'),
    'Budget number is required for a kibbutz member':
      t('wizard.errors.budgetRequired'),
    'No active football group matches this age group for the selected season':
      t('wizard.errors.footballNoGroup'),
    'Multiple active football groups match this age group; fix admin configuration':
      t('wizard.errors.footballMultipleGroups'),
    'Matched football group does not have enough active training sessions configured':
      t('wizard.errors.footballSessionsIncomplete'),
    'Student identity number is associated with another parent':
      t('wizard.errors.studentParentConflict'),
    'Registrations can only be created for an active activity':
      t('wizard.errors.inactiveActivity'),
    'Registrations can only be created for an active season':
      t('wizard.errors.inactiveSeason'),
    'Swimming fields must not be provided for football registration':
      t('wizard.errors.validation'),
  }

  if (exact[message]) {
    return exact[message]
  }
  if (message.startsWith('Football pricing was not found')) {
    return t('wizard.errors.footballPricingMissing')
  }
  if (message.includes('already registered to this activity')) {
    return t('wizard.errors.alreadyRegistered')
  }
  if (
    message.toLowerCase().includes('already') ||
    message.toLowerCase().includes('duplicate')
  ) {
    return t('wizard.errors.conflict')
  }
  return null
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

    const business = translateBusinessMessage(error.message)
    if (business) {
      return business
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
