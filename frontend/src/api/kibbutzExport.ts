import { apiDownload, type ApiDownloadResult } from './client'

export type KibbutzExportParams = {
  year: number
  month: number
}

export function downloadKibbutzExport(
  params: KibbutzExportParams,
): Promise<ApiDownloadResult> {
  const search = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
  })
  return apiDownload(`/api/exports/kibbutz?${search.toString()}`)
}
