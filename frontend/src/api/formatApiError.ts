import { t } from '../i18n/t'
import { ApiError } from './types'

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldErrors = error.body?.fieldErrors
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      const details = Object.entries(fieldErrors)
        .map(([field, message]) => `${field}: ${message}`)
        .join('; ')
      return `${error.message} (${details})`
    }
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return t('common.errorGeneric')
}
