import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  createClothingPayment,
  generateMonthlyPayments,
  syncSeasonMonthlyPayments,
  listPayments,
  type PaymentResponse,
} from '../../api/payments'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
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

export function PaymentsPage() {
  const { filters, setFilter } = useUrlFilters(FILTER_DEFAULTS)
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

  const [clothingOrderId, setClothingOrderId] = useState('')
  const [creatingClothing, setCreatingClothing] = useState(false)

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

  async function handleSyncSeason() {
    setSyncingSeason(true)
    setError(null)
    setMessage(null)

    try {
      const result = await syncSeasonMonthlyPayments(
        generateSeasonId === '' ? null : Number(generateSeasonId),
      )
      setMessage(
        t('payments.syncSeasonResult', {
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
      setError(t('payments.generateMonthRequired'))
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
        t('payments.generateResult', {
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

  async function handleClothingPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const orderId = Number(clothingOrderId)
    if (!Number.isFinite(orderId) || orderId <= 0) {
      setError(t('payments.clothingOrderIdRequired'))
      return
    }

    setCreatingClothing(true)
    setError(null)
    setMessage(null)

    try {
      const created = await createClothingPayment({ clothingOrderId: orderId })
      setMessage(t('payments.clothingPaymentCreated', { id: created.id }))
      setClothingOrderId('')
      await loadRows()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setCreatingClothing(false)
    }
  }

  return (
    <section className="admin-page admin-page--wide">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('payments.title')}</h1>
          <p className="admin-page__lede">{t('payments.intro')}</p>
        </div>
      </header>
      <p>
            <Link
              to={
                chargeMonth
                  ? `/admin/exports/kibbutz?month=${encodeURIComponent(chargeMonth)}`
                  : '/admin/exports/kibbutz'
              }
            >
              {t('payments.kibbutzExportLink')}
            </Link>
      </p>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <div className="payments-actions">
        <form className="admin-form" onSubmit={handleGenerate}>
          <h2>{t('payments.generateTitle')}</h2>
          <p className="clothing-order-form__hint">{t('payments.generateHint')}</p>
          <p className="clothing-order-form__hint">{t('payments.syncSeasonHint')}</p>

          <label className="admin-form__field">
            <span>{t('payments.generateSeason')}</span>
            <select
              value={generateSeasonId}
              onChange={(event) => setGenerateSeasonId(event.target.value)}
              disabled={generating || syncingSeason}
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

          <div className="admin-form__actions">
            <button
              type="button"
              className="reg-action reg-action--approve"
              disabled={generating || syncingSeason}
              onClick={() => void handleSyncSeason()}
            >
              {syncingSeason
                ? t('payments.syncingSeason')
                : t('payments.syncSeasonSubmit')}
            </button>
          </div>

          <label className="admin-form__field">
            <span>{t('payments.generateMonth')}</span>
            <input
              type="month"
              value={generateMonth}
              onChange={(event) => setGenerateMonth(event.target.value)}
              required
              disabled={generating || syncingSeason}
            />
          </label>

          <div className="admin-form__actions">
            <button type="submit" disabled={generating || syncingSeason}>
              {generating
                ? t('payments.generating')
                : t('payments.generateSubmit')}
            </button>
          </div>
        </form>

        <form className="admin-form" onSubmit={handleClothingPayment}>
          <h2>{t('payments.clothingPaymentTitle')}</h2>
          <p className="clothing-order-form__hint">
            {t('payments.clothingPaymentHint')}
          </p>

          <label className="admin-form__field">
            <span>{t('payments.clothingOrderId')}</span>
            <input
              type="number"
              min={1}
              value={clothingOrderId}
              onChange={(event) => setClothingOrderId(event.target.value)}
              required
              disabled={creatingClothing}
            />
          </label>

          <div className="admin-form__actions">
            <button type="submit" disabled={creatingClothing}>
              {creatingClothing
                ? t('common.saving')
                : t('payments.clothingPaymentSubmit')}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-filters">
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

        {chargeMonth && (
          <div className="admin-form__actions">
            <button type="button" onClick={() => setFilter('chargeMonth', '')}>
              {t('payments.clearMonth')}
            </button>
          </div>
        )}
      </div>

      <div className="admin-table-wrap">
        <h2>{t('payments.listTitle')}</h2>
        {loading ? (
          <p className="admin-page__loading">{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <p className="dashboard-empty">{t('payments.empty')}</p>
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
                  <td>{row.chargeMonth ?? '—'}</td>
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
