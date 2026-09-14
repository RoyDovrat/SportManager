import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  generateMonthlyPayments,
  syncSeasonMonthlyPayments,
  listPayments,
  type PaymentResponse,
} from '../../api/payments'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import { FilterClearButton } from '../../components/ui/FilterClearButton'
import { DateText } from '../../components/ui/DateText'
import { NavIcon } from '../../components/ui/NavIcon'
import {
  StatusBadge,
  paymentStatusTone,
} from '../../components/ui/StatusBadge'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTypeLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import {
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  type PaymentStatus,
  type PaymentType,
} from '../../types/enums'

const ALL = ''

const FILTER_DEFAULTS = {
  status: 'PENDING',
  paymentType: ALL,
  chargeMonth: ALL,
}

/** Convert `<input type="month">` value `YYYY-MM` → `YYYY-MM-01`. */
function toChargeMonthParam(monthValue: string): string | null {
  if (!monthValue) {
    return null
  }
  return `${monthValue}-01`
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function currentMonthValue(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function SeasonField({
  value,
  seasons,
  disabled,
  onChange,
}: {
  value: string
  seasons: SeasonResponse[]
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="admin-form__field">
      <span>{t('payments.generateSeason')}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">{t('payments.activeSeasonDefault')}</option>
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name}
            {season.isActive ? ` (${t('common.active')})` : ''}
          </option>
        ))}
      </select>
    </label>
  )
}

export function PaymentsPage() {
  const { filters, setFilter, setFilters } = useUrlFilters(FILTER_DEFAULTS)
  const { status, paymentType, chargeMonth } = filters

  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [rows, setRows] = useState<PaymentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [generateMonth, setGenerateMonth] = useState(currentMonthValue)
  const [generateSeasonId, setGenerateSeasonId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [syncingSeason, setSyncingSeason] = useState(false)
  const [chargeActionsOpen, setChargeActionsOpen] = useState(false)

  useEffect(() => {
    async function loadSeasons() {
      try {
        const data = await listSeasons()
        setSeasons(data)
        const active = data.find((season) => season.isActive)
        if (active) {
          setGenerateSeasonId(String(active.id))
        } else if (data.length > 0) {
          setGenerateSeasonId(String(data[0].id))
        }
      } catch (err) {
        setError(formatApiError(err))
      }
    }

    void loadSeasons()
  }, [])

  async function loadRows() {
    setLoading(true)
    setError(null)

    try {
      const data = await listPayments({
        status: status === ALL ? null : (status as PaymentStatus),
        paymentType: paymentType === ALL ? null : (paymentType as PaymentType),
        chargeMonth: toChargeMonthParam(chargeMonth),
      })
      setRows(data)
    } catch (err) {
      setError(formatApiError(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters change
  }, [status, paymentType, chargeMonth])

  async function handleSyncSeason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSyncingSeason(true)
    setError(null)
    setMessage(null)

    try {
      const result = await syncSeasonMonthlyPayments(
        generateSeasonId === '' ? null : Number(generateSeasonId),
      )
      setMessage(
        t('payments.currentMonthResult', {
          created: result.createdCount,
          skipped: result.skippedCount,
        }),
      )
      await loadRows()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSyncingSeason(false)
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const monthParam = toChargeMonthParam(generateMonth)
    if (!monthParam) {
      setError(t('payments.pastMonthMonthRequired'))
      return
    }

    setGenerating(true)
    setError(null)
    setMessage(null)

    try {
      const result = await generateMonthlyPayments({
        chargeMonth: monthParam,
        seasonId:
          generateSeasonId === '' ? null : Number(generateSeasonId),
      })
      setMessage(
        t('payments.pastMonthResult', {
          created: result.createdCount,
          skipped: result.skippedCount,
        }),
      )
      await loadRows()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setGenerating(false)
    }
  }

  const filtersActive =
    status !== FILTER_DEFAULTS.status ||
    paymentType !== ALL ||
    chargeMonth !== ALL

  function resetFilters() {
    setFilters({ ...FILTER_DEFAULTS })
  }

  const exportHref = chargeMonth
    ? `/admin/exports/kibbutz?month=${encodeURIComponent(chargeMonth)}`
    : '/admin/exports/kibbutz'

  return (
    <section className="admin-page admin-page--wide payments-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('payments.title')}</h1>
          <p className="admin-page__lede">{t('payments.intro')}</p>
        </div>
        <div className="seasons-hero-meta">
          <Link to={exportHref} className="admin-export-link">
            <NavIcon name="export" />
            {t('payments.kibbutzExportLink')}
          </Link>
          <button
            type="button"
            className="reg-action reg-action--approve"
            aria-expanded={chargeActionsOpen}
            onClick={() => setChargeActionsOpen((open) => !open)}
          >
            {chargeActionsOpen
              ? t('payments.closeChargeActions')
              : t('payments.chargeActions')}
          </button>
        </div>
      </header>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      {chargeActionsOpen && (
        <div className="payments-actions">
          <form
            className="payments-action-card payments-action-card--current"
            onSubmit={handleSyncSeason}
          >
            <div className="seasons-card-head">
              <span className="seasons-card-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />
                </svg>
              </span>
              <div>
                <h2>{t('payments.currentMonthTitle')}</h2>
                <p>{t('payments.currentMonthHint')}</p>
              </div>
            </div>

            <SeasonField
              value={generateSeasonId}
              seasons={seasons}
              disabled={generating || syncingSeason}
              onChange={setGenerateSeasonId}
            />

            <div className="admin-form__actions">
              <button
                type="submit"
                className="reg-action reg-action--approve"
                disabled={generating || syncingSeason}
              >
                {syncingSeason
                  ? t('payments.currentMonthWorking')
                  : t('payments.currentMonthSubmit')}
              </button>
            </div>
          </form>

          <form
            className="payments-action-card payments-action-card--past"
            onSubmit={handleGenerate}
          >
            <div className="seasons-card-head">
              <span className="seasons-card-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M8 3v4M16 3v4M3 10h18" />
                </svg>
              </span>
              <div>
                <h2>{t('payments.pastMonthTitle')}</h2>
                <p>{t('payments.pastMonthHint')}</p>
              </div>
            </div>

            <div className="payments-action-card__grid">
              <SeasonField
                value={generateSeasonId}
                seasons={seasons}
                disabled={generating || syncingSeason}
                onChange={setGenerateSeasonId}
              />

              <label className="admin-form__field">
                <span>{t('payments.pastMonthMonth')}</span>
                <input
                  type="month"
                  value={generateMonth}
                  onChange={(event) => setGenerateMonth(event.target.value)}
                  required
                  disabled={generating || syncingSeason}
                />
              </label>
            </div>

            <div className="admin-form__actions">
              <button type="submit" disabled={generating || syncingSeason}>
                {generating
                  ? t('payments.pastMonthWorking')
                  : t('payments.pastMonthSubmit')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-filters payments-filters">
        <p className="payments-filters__title">
          <NavIcon name="filter" />
          {t('payments.filterTitle')}
        </p>
        <label className="admin-form__field">
          <span>{t('payments.filterStatus')}</span>
          <select
            value={status}
            onChange={(event) => setFilter('status', event.target.value)}
          >
            <option value={ALL}>{t('payments.allStatuses')}</option>
            {PAYMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {paymentStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('payments.filterType')}</span>
          <select
            value={paymentType}
            onChange={(event) => setFilter('paymentType', event.target.value)}
          >
            <option value={ALL}>{t('payments.allTypes')}</option>
            {PAYMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {paymentTypeLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('payments.filterMonth')}</span>
          <input
            type="month"
            value={chargeMonth}
            onChange={(event) => setFilter('chargeMonth', event.target.value)}
          />
        </label>

        <FilterClearButton onClick={resetFilters} disabled={!filtersActive}>
          {t('payments.resetFilters')}
        </FilterClearButton>
      </div>

      <div className="admin-table-wrap">
        <div className="seasons-table-head">
          <h2>
            <NavIcon name="payments" />
            {t('payments.listTitle')}
          </h2>
        </div>
        {loading ? (
          <p className="admin-page__loading">{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <div className="registrations-empty">
            <span className="registrations-empty__icon" aria-hidden="true">
              <NavIcon name="payments" />
            </span>
            <p>{t('payments.empty')}</p>
            <p className="registrations-empty__hint">
              {t('payments.emptyHint')}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('payments.student')}</th>
                <th>{t('payments.amount')}</th>
                <th>{t('payments.chargeMonth')}</th>
                <th>{t('payments.type')}</th>
                <th>{t('common.status')}</th>
                <th>{t('payments.method')}</th>
                <th>{t('payments.kibbutz')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>
                    {row.studentFirstName} {row.studentLastName}
                  </td>
                  <td>{formatAmount(row.amount)}</td>
                  <td>
                    <DateText value={row.chargeMonth} />
                  </td>
                  <td>{paymentTypeLabel(row.paymentType)}</td>
                  <td>
                    <StatusBadge tone={paymentStatusTone(row.status)}>
                      {paymentStatusLabel(row.status)}
                    </StatusBadge>
                  </td>
                  <td>
                    {row.paymentMethod
                      ? paymentMethodLabel(row.paymentMethod)
                      : '—'}
                  </td>
                  <td>
                    {row.isKibbutzMember ? t('common.yes') : t('common.no')}
                  </td>
                  <td className="admin-table__actions">
                    <Link
                      to={`/admin/payments/${row.id}`}
                      className="reg-action reg-action--view"
                    >
                      {t('payments.view')}
                    </Link>
                    <Link
                      to={`/admin/payments/${row.id}?edit=1`}
                      className="reg-action reg-action--edit"
                    >
                      {t('payments.edit')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}