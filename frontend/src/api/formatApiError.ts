import { t } from '../i18n/t'
import { ApiError } from './types'

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldErrors = error.body?.fieldErrors
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      return Object.values(fieldErrors).join(' · ')
    }
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return t('common.errorGeneric')
}
