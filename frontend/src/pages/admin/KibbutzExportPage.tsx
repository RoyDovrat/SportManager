import { useState, type FormEvent } from 'react'
import { formatApiError } from '../../api/formatApiError'
import { downloadKibbutzExport } from '../../api/kibbutzExport'
import { t } from '../../i18n/t'

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

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function KibbutzExportPage() {
  const [monthValue, setMonthValue] = useState(currentYearMonth)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleDownload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = parseYearMonth(monthValue)
    if (!parsed) {
      setError(t('kibbutzExport.invalidMonth'))
      return
    }

    setDownloading(true)
    setError(null)
    setMessage(null)

    try {
      const { blob, fileName } = await downloadKibbutzExport(parsed)
      saveBlob(
        blob,
        fileName ??
          `kibbutz-export-${parsed.year}-${String(parsed.month).padStart(2, '0')}.xlsx`,
      )
      setMessage(t('kibbutzExport.downloadStarted'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="admin-page">
      <h1>{t('kibbutzExport.title')}</h1>
      <p>{t('kibbutzExport.intro')}</p>
      <p className="clothing-order-form__hint">{t('kibbutzExport.hint')}</p>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <form className="admin-form" onSubmit={handleDownload}>
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
          <button type="submit" disabled={downloading || !monthValue}>
            {downloading
              ? t('kibbutzExport.downloading')
              : t('kibbutzExport.download')}
          </button>
        </div>
      </form>
    </section>
  )
}
