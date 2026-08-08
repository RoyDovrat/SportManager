import { apiDownload, type ApiDownloadResult } from './client'
import type { ActivityType } from '../types/enums'

export type KibbutzExportParams = {
  year: number
  month: number
  activityType: ActivityType
}

export type KibbutzClothingExportParams = {
  year: number
  month: number
}

export function downloadKibbutzExport(
  params: KibbutzExportParams,
): Promise<ApiDownloadResult> {
  const search = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
    activityType: params.activityType,
  })
  return apiDownload(`/api/exports/kibbutz?${search.toString()}`)
}

export function downloadKibbutzClothingExport(
  params: KibbutzClothingExportParams,
): Promise<ApiDownloadResult> {
  const search = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
  })
  return apiDownload(`/api/exports/kibbutz/clothing?${search.toString()}`)
}
