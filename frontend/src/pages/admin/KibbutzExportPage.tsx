import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import { downloadKibbutzExport } from '../../api/kibbutzExport'
import { activityTypeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import { ACTIVITY_TYPES, type ActivityType } from '../../types/enums'

function currentYearMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function parseYearMonth(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) {
    return null
  }
  return { year, month }
}

function initialMonthValue(searchMonth: string | null): string {
  if (searchMonth && parseYearMonth(searchMonth)) {
    return searchMonth
  }
  return currentYearMonth()
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function KibbutzExportPage() {
  const [searchParams] = useSearchParams()
  const [monthValue, setMonthValue] = useState(() =>
    initialMonthValue(searchParams.get('month')),
  )
  const [downloadingType, setDownloadingType] = useState<ActivityType | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleDownload(activityType: ActivityType) {
    const parsed = parseYearMonth(monthValue)
    if (!parsed) {
      setError(t('kibbutzExport.invalidMonth'))
      return
    }

    setDownloadingType(activityType)
    setError(null)
    setMessage(null)

    try {
      const { blob, fileName } = await downloadKibbutzExport({
        ...parsed,
        activityType,
      })
      saveBlob(
        blob,
        fileName ??
          `kibbutz-export-${activityType.toLowerCase()}-${parsed.year}-${String(parsed.month).padStart(2, '0')}.xlsx`,
      )
      setMessage(
        t('kibbutzExport.downloadStartedSport', {
          sport: activityTypeLabel(activityType),
        }),
      )
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setDownloadingType(null)
    }
  }

  const downloading = downloadingType != null

  return (
    <section className="admin-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('kibbutzExport.title')}</h1>
          <p className="admin-page__lede">{t('kibbutzExport.intro')}</p>
          <p className="clothing-order-form__hint">{t('kibbutzExport.hint')}</p>
        </div>
      </header>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <div className="admin-form">
        <label className="admin-form__field">
          <span>{t('kibbutzExport.month')}</span>
          <input
            type="month"
            value={monthValue}
            onChange={(event) => setMonthValue(event.target.value)}
            required
            disabled={downloading}
          />
        </label>

        <div className="admin-form__actions">
          {ACTIVITY_TYPES.map((activityType) => (
            <button
              key={activityType}
              type="button"
              disabled={downloading || !monthValue}
              onClick={() => void handleDownload(activityType)}
            >
              {downloadingType === activityType
                ? t('kibbutzExport.downloading')
                : t('kibbutzExport.downloadSport', {
                    sport: activityTypeLabel(activityType),
                  })}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
