import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  cancelPayment,
  confirmPayment,
  getPayment,
  type PaymentResponse,
} from '../../api/payments'
import {
  StatusBadge,
  paymentStatusTone,
} from '../../components/ui/StatusBadge'
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTypeLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import type { PaymentMethod } from '../../types/enums'

const CONFIRM_METHODS = ['BIT', 'PAYBOX'] as const

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  return String(value)
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function PaymentDetailPage() {
  const { id } = useParams()
  const paymentId = Number(id)

  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmMethod, setConfirmMethod] = useState<PaymentMethod>('BIT')

  useEffect(() => {
    let cancelled = false

    async function loadPayment() {
      if (!Number.isFinite(paymentId) || paymentId <= 0) {
        if (!cancelled) {
          setError(t('payments.invalidId'))
          setPayment(null)
          setLoading(false)
        }
        return
      }

      if (!cancelled) {
        setLoading(true)
        setError(null)
        setMessage(null)
      }

      try {
        const data = await getPayment(paymentId)
        if (!cancelled) {
          setPayment(data)
          if (
            data.paymentMethod === 'BIT' ||
            data.paymentMethod === 'PAYBOX'
          ) {
            setConfirmMethod(data.paymentMethod)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatApiError(err))
          setPayment(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPayment()

    return () => {
      cancelled = true
    }
  }, [paymentId])

  async function handleConfirm() {
    if (!payment) {
      return
    }
    if (!window.confirm(t('payments.confirmPaid'))) {
      return
    }

    setActing(true)
    setError(null)
    setMessage(null)

    try {
      const updated = await confirmPayment(
        payment.id,
        payment.isKibbutzMember ? {} : { paymentMethod: confirmMethod },
      )
      setPayment(updated)
      setMessage(t('payments.confirmed'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setActing(false)
    }
  }

  async function handleCancel() {
    if (!payment) {
      return
    }
    if (!window.confirm(t('payments.confirmCancel'))) {
      return
    }

    setActing(true)
    setError(null)
    setMessage(null)

    try {
      const updated = await cancelPayment(payment.id)
      setPayment(updated)
      setMessage(t('payments.cancelled'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setActing(false)
    }
  }

  const canConfirm = payment?.status === 'PENDING'
  const canCancel = payment?.status === 'PENDING'

  return (
    <section className="admin-page">
      <p>
        <Link to="/admin/payments">{t('payments.backToList')}</Link>
      </p>

      <h1>{t('payments.detailTitle')}</h1>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : payment === null ? (
        <p>{t('payments.notFound')}</p>
      ) : (
        <>
          {canConfirm && (
            <div className="admin-form payment-confirm-form">
              {!payment.isKibbutzMember && (
                <label className="admin-form__field">
                  <span>{t('payments.confirmMethod')}</span>
                  <select
                    value={confirmMethod}
                    onChange={(event) =>
                      setConfirmMethod(event.target.value as PaymentMethod)
                    }
                    disabled={acting}
                  >
                    {CONFIRM_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {paymentMethodLabel(method)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {payment.isKibbutzMember && (
                <p className="clothing-order-form__hint">
                  {t('payments.kibbutzConfirmHint')}
                </p>
              )}
              <div className="admin-form__actions">
                <button
                  type="button"
                  onClick={() => void handleConfirm()}
                  disabled={acting}
                >
                  {acting ? t('payments.working') : t('payments.confirm')}
                </button>
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => void handleCancel()}
                    disabled={acting}
                  >
                    {acting ? t('payments.working') : t('payments.cancelAction')}
                  </button>
                )}
              </div>
            </div>
          )}

          {!canConfirm && canCancel && (
            <div className="admin-form__actions">
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={acting}
              >
                {acting ? t('payments.working') : t('payments.cancelAction')}
              </button>
            </div>
          )}

          <div className="admin-detail">
            <DetailSection title={t('payments.summarySection')}>
              <DetailRow label={t('common.id')} value={payment.id} />
              <DetailRow
                label={t('common.status')}
                value={
                  <StatusBadge tone={paymentStatusTone(payment.status)}>
                    {paymentStatusLabel(payment.status)}
                  </StatusBadge>
                }
              />
              <DetailRow
                label={t('payments.type')}
                value={paymentTypeLabel(payment.paymentType)}
              />
              <DetailRow
                label={t('payments.amount')}
                value={formatAmount(payment.amount)}
              />
              <DetailRow
                label={t('payments.chargeMonth')}
                value={displayValue(payment.chargeMonth)}
              />
              <DetailRow
                label={t('payments.method')}
                value={
                  payment.paymentMethod
                    ? paymentMethodLabel(payment.paymentMethod)
                    : '—'
                }
              />
              <DetailRow
                label={t('payments.paymentDate')}
                value={displayValue(payment.paymentDate)}
              />
              <DetailRow
                label={t('payments.registrationId')}
                value={payment.registrationId}
              />
              <DetailRow
                label={t('payments.clothingOrderId')}
                value={displayValue(payment.clothingOrderId)}
              />
            </DetailSection>

            <DetailSection title={t('payments.student')}>
              <DetailRow
                label={t('payments.student')}
                value={`${payment.studentFirstName} ${payment.studentLastName}`}
              />
              <DetailRow
                label={t('payments.parent')}
                value={`${payment.parentFirstName} ${payment.parentLastName}`}
              />
              <DetailRow
                label={t('payments.kibbutz')}
                value={payment.isKibbutzMember ? t('common.yes') : t('common.no')}
              />
            </DetailSection>
          </div>
        </>
      )}
    </section>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="admin-detail__section">
      <h2>{title}</h2>
      <dl className="admin-detail__list">{children}</dl>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="admin-detail__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
