import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import { listPayments, type PaymentResponse } from '../../api/payments'
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

export function PaymentsPage() {
  const [status, setStatus] = useState<string>('PENDING')
  const [paymentType, setPaymentType] = useState<string>(ALL)
  const [chargeMonth, setChargeMonth] = useState('')
  const [rows, setRows] = useState<PaymentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadRows() {
      setLoading(true)
      setError(null)

      try {
        const data = await listPayments({
          status: status === ALL ? null : (status as PaymentStatus),
          paymentType:
            paymentType === ALL ? null : (paymentType as PaymentType),
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

    void loadRows()
  }, [status, paymentType, chargeMonth])

  return (
    <section className="admin-page admin-page--wide">
      <h1>{t('payments.title')}</h1>
      <p>{t('payments.intro')}</p>

      {error && <p className="admin-page__error">{error}</p>}

      <div className="admin-filters">
        <label className="admin-form__field">
          <span>{t('payments.filterStatus')}</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
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
            onChange={(event) => setPaymentType(event.target.value)}
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
            onChange={(event) => setChargeMonth(event.target.value)}
          />
        </label>

        {chargeMonth && (
          <div className="admin-form__actions">
            <button type="button" onClick={() => setChargeMonth('')}>
              {t('payments.clearMonth')}
            </button>
          </div>
        )}
      </div>

      <div className="admin-table-wrap">
        <h2>{t('payments.listTitle')}</h2>
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <p>{t('payments.empty')}</p>
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
                  <td>{paymentStatusLabel(row.status)}</td>
                  <td>
                    {row.paymentMethod
                      ? paymentMethodLabel(row.paymentMethod)
                      : '—'}
                  </td>
                  <td>
                    {row.isKibbutzMember ? t('common.yes') : t('common.no')}
                  </td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/payments/${row.id}`}>
                      {t('payments.viewDetails')}
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
