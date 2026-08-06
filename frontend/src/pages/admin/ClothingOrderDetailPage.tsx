import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  getClothingOrder,
  updateClothingOrder,
  type ClothingOrderResponse,
  type ClothingOrderUpdateRequest,
} from '../../api/clothingOrders'
import { formatApiError } from '../../api/formatApiError'
import { createClothingPayment } from '../../api/payments'
import { AdminBackLink } from '../../components/admin/AdminBackLink'
import { clothingSizeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import { CLOTHING_SIZES, type ClothingSize } from '../../types/enums'

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  return String(value)
}

function kitLine(quantity: number | null, size: ClothingSize | null): string {
  const qty = quantity ?? 0
  if (qty <= 0) {
    return t('clothingOrders.noneOrdered')
  }
  return `${qty} × ${size ? clothingSizeLabel(size) : '—'}`
}

function parseQuantity(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

type EditFormState = {
  alreadyHasClothing: boolean
  shortKitQuantity: string
  shortKitSize: string
  longKitQuantity: string
  longKitSize: string
  hoodieQuantity: string
  hoodieSize: string
  shirtNumber: string
}

function toEditForm(order: ClothingOrderResponse): EditFormState {
  return {
    alreadyHasClothing: order.alreadyHasClothing,
    shortKitQuantity: String(order.shortKitQuantity ?? 0),
    shortKitSize: order.shortKitSize ?? '',
    longKitQuantity: String(order.longKitQuantity ?? 0),
    longKitSize: order.longKitSize ?? '',
    hoodieQuantity: String(order.hoodieQuantity ?? 0),
    hoodieSize: order.hoodieSize ?? '',
    shirtNumber: order.shirtNumber == null ? '' : String(order.shirtNumber),
  }
}

function buildUpdateRequest(form: EditFormState): ClothingOrderUpdateRequest {
  if (form.alreadyHasClothing) {
    return { alreadyHasClothing: true }
  }

  const shortKitQuantity = parseQuantity(form.shortKitQuantity)
  const longKitQuantity = parseQuantity(form.longKitQuantity)
  const hoodieQuantity = parseQuantity(form.hoodieQuantity)
  const shirtRaw = form.shirtNumber.trim()

  return {
    alreadyHasClothing: false,
    shortKitQuantity,
    shortKitSize:
      shortKitQuantity > 0 ? (form.shortKitSize as ClothingSize) : null,
    longKitQuantity,
    longKitSize:
      longKitQuantity > 0 ? (form.longKitSize as ClothingSize) : null,
    hoodieQuantity,
    hoodieSize: hoodieQuantity > 0 ? (form.hoodieSize as ClothingSize) : null,
    shirtNumber: shirtRaw === '' ? null : Number(shirtRaw),
  }
}

export function ClothingOrderDetailPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const orderId = Number(id)
  const editing = searchParams.get('edit') === '1'

  const [order, setOrder] = useState<ClothingOrderResponse | null>(null)
  const [form, setForm] = useState<EditFormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOrder() {
      if (!Number.isFinite(orderId) || orderId <= 0) {
        if (!cancelled) {
          setError(t('clothingOrders.invalidId'))
          setOrder(null)
          setForm(null)
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
        const data = await getClothingOrder(orderId)
        if (!cancelled) {
          setOrder(data)
          setForm(toEditForm(data))
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatApiError(err))
          setOrder(null)
          setForm(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadOrder()

    return () => {
      cancelled = true
    }
  }, [orderId])

  async function handleCreateClothingPayment() {
    if (!order) {
      return
    }

    setCreatingPayment(true)
    setError(null)
    setMessage(null)

    try {
      const payment = await createClothingPayment({ clothingOrderId: order.id })
      setMessage(t('payments.clothingPaymentCreated', { id: payment.id }))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setCreatingPayment(false)
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!order || !form) {
      return
    }

    if (!form.alreadyHasClothing) {
      const shortKitQuantity = parseQuantity(form.shortKitQuantity)
      const longKitQuantity = parseQuantity(form.longKitQuantity)
      const hoodieQuantity = parseQuantity(form.hoodieQuantity)
      if (shortKitQuantity + longKitQuantity + hoodieQuantity < 1) {
        setError(t('wizard.clothing.itemsRequired'))
        return
      }
      if (
        (shortKitQuantity > 0 && !form.shortKitSize) ||
        (longKitQuantity > 0 && !form.longKitSize) ||
        (hoodieQuantity > 0 && !form.hoodieSize)
      ) {
        setError(t('wizard.clothing.sizeRequired'))
        return
      }
      const shirtRaw = form.shirtNumber.trim()
      if (shirtRaw === '') {
        setError(t('publicClothing.printedNumberRequired'))
        return
      }
      const shirtNumber = Number(shirtRaw)
      if (!Number.isInteger(shirtNumber) || shirtNumber < 0 || shirtNumber > 99) {
        setError(t('publicClothing.printedNumberInvalid'))
        return
      }
    }

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const updated = await updateClothingOrder(order.id, buildUpdateRequest(form))
      setOrder(updated)
      setForm(toEditForm(updated))
      setMessage(t('clothingOrders.updated'))
      setSearchParams({}, { replace: true })
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  function startEdit() {
    if (order) {
      setForm(toEditForm(order))
    }
    setSearchParams({ edit: '1' })
  }

  function stopEdit() {
    if (order) {
      setForm(toEditForm(order))
    }
    setSearchParams({}, { replace: true })
  }

  return (
    <section className="admin-page admin-page--wide clothing-order-detail">
      <nav className="admin-back-nav" aria-label={t('clothingOrders.backToList')}>
        <AdminBackLink
          fallbackTo="/admin/clothing-orders"
          className="admin-back"
          aria-label={t('clothingOrders.backToList')}
        >
          <span className="admin-back__arrow" aria-hidden="true">
            →
          </span>
          <span>{t('clothingOrders.backToList')}</span>
        </AdminBackLink>
        <Link to="/admin/payments" className="admin-back admin-back--secondary">
          <span>{t('clothingOrders.backToPayments')}</span>
        </Link>
      </nav>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : order === null || form === null ? (
        <p>{t('clothingOrders.notFound')}</p>
      ) : (
        <>
          <header className="clothing-hero">
            <div>
              <p className="clothing-hero__eyebrow">
                {editing
                  ? t('clothingOrders.editTitle')
                  : t('clothingOrders.detailTitle')}
                <span aria-hidden="true"> · </span>
                {t('common.id')} #{order.id}
              </p>
              <h1>
                {order.studentFirstName} {order.studentLastName}
              </h1>
              <p className="clothing-hero__meta">
                <span className="registrations-chip">{order.seasonName}</span>
                <span className="registrations-chip registrations-chip--muted" dir="ltr">
                  {order.studentIdentityNumber}
                </span>
              </p>
            </div>
          </header>

          <div className="clothing-order-detail__actions">
            {!editing && (
              <button
                type="button"
                className="reg-action reg-action--edit"
                onClick={startEdit}
              >
                {t('clothingOrders.edit')}
              </button>
            )}
            {!editing && order.clothingPaymentRequired && (
              <button
                type="button"
                className="reg-action reg-action--approve"
                onClick={() => void handleCreateClothingPayment()}
                disabled={creatingPayment}
              >
                {creatingPayment
                  ? t('common.saving')
                  : t('clothingOrders.createPayment')}
              </button>
            )}
          </div>

          {editing ? (
            <form className="admin-form clothing-order-form" onSubmit={handleSave}>
              <label className="admin-form__checkbox">
                <input
                  type="checkbox"
                  checked={form.alreadyHasClothing}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      alreadyHasClothing: event.target.checked,
                    })
                  }
                  disabled={saving}
                />
                <span>{t('clothingOrders.alreadyHas')}</span>
              </label>

              {!form.alreadyHasClothing && (
                <>
                  <div className="clothing-order-form__kits">
                    <KitFields
                      title={t('clothingOrders.shortKit')}
                      quantity={form.shortKitQuantity}
                      size={form.shortKitSize}
                      disabled={saving}
                      onQuantityChange={(value) =>
                        setForm({ ...form, shortKitQuantity: value })
                      }
                      onSizeChange={(value) =>
                        setForm({ ...form, shortKitSize: value })
                      }
                    />
                    <KitFields
                      title={t('clothingOrders.longKit')}
                      quantity={form.longKitQuantity}
                      size={form.longKitSize}
                      disabled={saving}
                      onQuantityChange={(value) =>
                        setForm({ ...form, longKitQuantity: value })
                      }
                      onSizeChange={(value) =>
                        setForm({ ...form, longKitSize: value })
                      }
                    />
                    <KitFields
                      title={t('clothingOrders.hoodie')}
                      quantity={form.hoodieQuantity}
                      size={form.hoodieSize}
                      disabled={saving}
                      onQuantityChange={(value) =>
                        setForm({ ...form, hoodieQuantity: value })
                      }
                      onSizeChange={(value) =>
                        setForm({ ...form, hoodieSize: value })
                      }
                    />
                  </div>
                  <label className="admin-form__field">
                    <span>{t('clothingOrders.shirtNumber')}</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      required
                      value={form.shirtNumber}
                      onChange={(event) =>
                        setForm({ ...form, shirtNumber: event.target.value })
                      }
                      disabled={saving}
                    />
                  </label>
                </>
              )}

              <div className="clothing-order-form__actions">
                <button
                  type="submit"
                  className="reg-action reg-action--approve"
                  disabled={saving}
                >
                  {saving ? t('common.saving') : t('common.save')}
                </button>
                <button
                  type="button"
                  className="reg-action reg-action--view"
                  onClick={stopEdit}
                  disabled={saving}
                >
                  {t('common.cancelEdit')}
                </button>
              </div>
            </form>
          ) : (
            <div className="admin-detail clothing-order-detail__panels">
              <DetailSection title={t('clothingOrders.summarySection')}>
                <DetailRow label={t('common.id')} value={order.id} />
                <DetailRow
                  label={t('clothingOrders.registrationId')}
                  value={order.registrationId}
                />
                <DetailRow
                  label={t('clothingOrders.season')}
                  value={order.seasonName}
                />
                <DetailRow
                  label={t('clothingOrders.alreadyHas')}
                  value={
                    order.alreadyHasClothing ? t('common.yes') : t('common.no')
                  }
                />
                <DetailRow
                  label={t('clothingOrders.paymentRequired')}
                  value={
                    order.clothingPaymentRequired
                      ? t('common.yes')
                      : t('common.no')
                  }
                />
              </DetailSection>

              <DetailSection title={t('clothingOrders.student')}>
                <DetailRow
                  label={t('clothingOrders.student')}
                  value={`${order.studentFirstName} ${order.studentLastName}`}
                />
                <DetailRow
                  label={t('clothingOrders.identity')}
                  value={order.studentIdentityNumber}
                />
              </DetailSection>

              <DetailSection title={t('clothingOrders.itemsSection')}>
                <DetailRow
                  label={t('clothingOrders.shortKit')}
                  value={kitLine(order.shortKitQuantity, order.shortKitSize)}
                />
                <DetailRow
                  label={t('clothingOrders.longKit')}
                  value={kitLine(order.longKitQuantity, order.longKitSize)}
                />
                <DetailRow
                  label={t('clothingOrders.hoodie')}
                  value={kitLine(order.hoodieQuantity, order.hoodieSize)}
                />
                <DetailRow
                  label={t('clothingOrders.shirtNumber')}
                  value={displayValue(order.shirtNumber)}
                />
              </DetailSection>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function KitFields({
  title,
  quantity,
  size,
  disabled,
  onQuantityChange,
  onSizeChange,
}: {
  title: string
  quantity: string
  size: string
  disabled: boolean
  onQuantityChange: (value: string) => void
  onSizeChange: (value: string) => void
}) {
  const qty = parseQuantity(quantity)

  return (
    <fieldset className="clothing-order-form__kit">
      <legend>{title}</legend>
      <label className="admin-form__field">
        <span>{t('clothingOrders.quantity')}</span>
        <input
          type="number"
          min={0}
          value={quantity}
          onChange={(event) => onQuantityChange(event.target.value)}
          required
          disabled={disabled}
        />
      </label>
      <label className="admin-form__field">
        <span>{t('clothingOrders.size')}</span>
        <select
          value={size}
          onChange={(event) => onSizeChange(event.target.value)}
          required={qty > 0}
          disabled={disabled || qty === 0}
        >
          <option value="">{t('clothingOrders.selectSize')}</option>
          {CLOTHING_SIZES.map((value) => (
            <option key={value} value={value}>
              {clothingSizeLabel(value)}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
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
  value: string | number
}) {
  return (
    <div className="admin-detail__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
