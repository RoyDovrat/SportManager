import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  downloadKibbutzClothingExport,
  downloadKibbutzExport,
} from '../../api/kibbutzExport'
import { NavIcon } from '../../components/ui/NavIcon'
import { activityTypeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import { type ActivityType } from '../../types/enums'

type DownloadKind = ActivityType | 'CLOTHING'

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
  const [downloadingKind, setDownloadingKind] = useState<DownloadKind | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleDownloadSport(activityType: ActivityType) {
    const parsed = parseYearMonth(monthValue)
    if (!parsed) {
      setError(t('kibbutzExport.invalidMonth'))
      return
    }

    setDownloadingKind(activityType)
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
      setDownloadingKind(null)
    }
  }

  async function handleDownloadClothing() {
    const parsed = parseYearMonth(monthValue)
    if (!parsed) {
      setError(t('kibbutzExport.invalidMonth'))
      return
    }

    setDownloadingKind('CLOTHING')
    setError(null)
    setMessage(null)

    try {
      const { blob, fileName } = await downloadKibbutzClothingExport(parsed)
      saveBlob(
        blob,
        fileName ??
          `kibbutz-export-clothing-${parsed.year}-${String(parsed.month).padStart(2, '0')}.xlsx`,
      )
      setMessage(t('kibbutzExport.downloadStartedClothing'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setDownloadingKind(null)
    }
  }

  const downloading = downloadingKind != null

  return (
    <section className="admin-page admin-page--wide export-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('kibbutzExport.title')}</h1>
          <p className="admin-page__lede">{t('kibbutzExport.intro')}</p>
        </div>
      </header>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <div className="seasons-editor export-layout">
        <div className="admin-form seasons-form">
          <div className="seasons-card-head">
            <span className="seasons-card-icon" aria-hidden="true">
              <NavIcon name="seasons" />
            </span>
            <div>
              <h2>{t('kibbutzExport.downloadTitle')}</h2>
              <p>{t('kibbutzExport.month')}</p>
            </div>
          </div>

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

          <div className="export-download-grid">
            <button
              type="button"
              className="export-download-btn"
              disabled={downloading || !monthValue}
              onClick={() => void handleDownloadSport('SWIMMING')}
            >
              <NavIcon name="swimming" />
              {downloadingKind === 'SWIMMING'
                ? t('kibbutzExport.downloading')
                : t('kibbutzExport.downloadSwimming')}
            </button>
            <button
              type="button"
              className="export-download-btn"
              disabled={downloading || !monthValue}
              onClick={() => void handleDownloadSport('FOOTBALL')}
            >
              <NavIcon name="football" />
              {downloadingKind === 'FOOTBALL'
                ? t('kibbutzExport.downloading')
                : t('kibbutzExport.downloadFootball')}
            </button>
            <button
              type="button"
              className="export-download-btn"
              disabled={downloading || !monthValue}
              onClick={() => void handleDownloadClothing()}
            >
              <NavIcon name="clothing" />
              {downloadingKind === 'CLOTHING'
                ? t('kibbutzExport.downloading')
                : t('kibbutzExport.downloadClothingShort')}
            </button>
          </div>
        </div>

        <aside className="seasons-instructions">
          <div className="seasons-card-head">
            <span className="seasons-card-icon" aria-hidden="true">
              <NavIcon name="help" />
            </span>
            <div>
              <h2>{t('kibbutzExport.includesTitle')}</h2>
            </div>
          </div>
          <ul className="seasons-instructions__list">
            <li>{t('kibbutzExport.includePending')}</li>
            <li>{t('kibbutzExport.includeKibbutz')}</li>
            <li>{t('kibbutzExport.includeMonth')}</li>
            <li>{t('kibbutzExport.includeClothingSeparate')}</li>
            <li>{t('kibbutzExport.includeSwimming')}</li>
          </ul>
        </aside>
      </div>

      <p className="export-note">
        <NavIcon name="registrations" />
        <span>
          <strong>{t('kibbutzExport.noteTitle')}: </strong>
          {t('kibbutzExport.hint')}
        </span>
      </p>
    </section>
  )
}
