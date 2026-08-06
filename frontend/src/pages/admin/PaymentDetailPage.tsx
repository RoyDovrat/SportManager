import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  cancelPayment,
  confirmPayment,
  getPayment,
  updatePayment,
  type PaymentResponse,
} from '../../api/payments'
import { AdminBackLink } from '../../components/admin/AdminBackLink'
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
  const [searchParams] = useSearchParams()
  const paymentId = Number(id)
  const preferEdit = searchParams.get('edit') === '1'

  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmMethod, setConfirmMethod] = useState<PaymentMethod>('BIT')
  const [editAmount, setEditAmount] = useState('')
  const [savingAmount, setSavingAmount] = useState(false)

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
          setEditAmount(String(data.amount))
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

  useEffect(() => {
    if (!preferEdit || loading || !payment || payment.status !== 'PENDING') {
      return
    }
    const form = document.getElementById('payment-edit-amount')
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const amountInput = form?.querySelector('input')
    if (amountInput instanceof HTMLInputElement) {
      amountInput.focus()
    }
  }, [preferEdit, loading, payment])

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
      setEditAmount(String(updated.amount))
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
      setEditAmount(String(updated.amount))
      setMessage(t('payments.cancelled'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setActing(false)
    }
  }

  async function handleSaveAmount(event: FormEvent) {
    event.preventDefault()
    if (!payment) {
      return
    }
    const amount = Number(editAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t('payments.amountInvalid'))
      return
    }

    setSavingAmount(true)
    setError(null)
    setMessage(null)
    try {
      const updated = await updatePayment(payment.id, { amount })
      setPayment(updated)
      setEditAmount(String(updated.amount))
      setMessage(t('payments.amountUpdated'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSavingAmount(false)
    }
  }

  const canConfirm = payment?.status === 'PENDING'
  const canCancel = payment?.status === 'PENDING'
  const canEditAmount = payment?.status === 'PENDING'

  return (
    <section className="admin-page">
      <nav className="admin-back-nav" aria-label={t('payments.backToList')}>
        <AdminBackLink
          fallbackTo="/admin/payments"
          className="admin-back"
          aria-label={t('payments.backToList')}
        >
          <span className="admin-back__arrow" aria-hidden="true">
            →
          </span>
          <span>{t('payments.backToList')}</span>
        </AdminBackLink>
        {payment?.clothingOrderId != null && (
          <Link
            to={`/admin/clothing-orders/${payment.clothingOrderId}`}
            className="admin-back admin-back--secondary"
          >
            <span>{t('clothingOrders.openClothingOrder')}</span>
          </Link>
        )}
      </nav>

      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('payments.detailTitle')}</h1>
        </div>
      </header>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      {loading ? (
        <p className="admin-page__loading">{t('common.loading')}</p>
      ) : payment === null ? (
        <p className="dashboard-empty">{t('payments.notFound')}</p>
      ) : (
        <>
          {canEditAmount && (
            <form
              id="payment-edit-amount"
              className={`admin-form payment-edit-amount${preferEdit ? ' payment-edit-amount--highlight' : ''}`}
              onSubmit={(event) => void handleSaveAmount(event)}
            >
              <h2>{t('payments.editAmountTitle')}</h2>
              <p className="admin-form__hint">{t('payments.editAmountHint')}</p>
              <label className="admin-form__field">
                <span>{t('payments.amount')}</span>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={editAmount}
                  onChange={(event) => setEditAmount(event.target.value)}
                  required
                  disabled={savingAmount || acting}
                />
              </label>
              <div className="admin-form__actions">
                <button
                  type="submit"
                  className="reg-action reg-action--approve"
                  disabled={savingAmount || acting}
                >
                  {savingAmount ? t('common.saving') : t('payments.saveAmount')}
                </button>
              </div>
            </form>
          )}

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
                  className="reg-action reg-action--approve"
                  onClick={() => void handleConfirm()}
                  disabled={acting}
                >
                  {acting ? t('payments.working') : t('payments.confirm')}
                </button>
                {canCancel && (
                  <button
                    type="button"
                    className="reg-action reg-action--cancel"
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
                className="reg-action reg-action--cancel"
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
