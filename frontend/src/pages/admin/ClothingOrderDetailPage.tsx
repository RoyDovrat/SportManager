import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getClothingOrder,
  type ClothingOrderResponse,
} from '../../api/clothingOrders'
import { formatApiError } from '../../api/formatApiError'
import { clothingSizeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import type { ClothingSize } from '../../types/enums'

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  return String(value)
}

function kitLine(
  quantity: number | null,
  size: ClothingSize | null,
): string {
  const qty = quantity ?? 0
  if (qty <= 0) {
    return t('clothingOrders.noneOrdered')
  }
  return `${qty} × ${size ? clothingSizeLabel(size) : '—'}`
}

export function ClothingOrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)

  const [order, setOrder] = useState<ClothingOrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOrder() {
      if (!Number.isFinite(orderId) || orderId <= 0) {
        if (!cancelled) {
          setError(t('clothingOrders.invalidId'))
          setOrder(null)
          setLoading(false)
        }
        return
      }

      if (!cancelled) {
        setLoading(true)
        setError(null)
      }

      try {
        const data = await getClothingOrder(orderId)
        if (!cancelled) {
          setOrder(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatApiError(err))
          setOrder(null)
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

  return (
    <section className="admin-page">
      <p>
        <Link to="/admin/clothing-orders">{t('clothingOrders.backToList')}</Link>
      </p>

      <h1>{t('clothingOrders.detailTitle')}</h1>

      {error && <p className="admin-page__error">{error}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : order === null ? (
        <p>{t('clothingOrders.notFound')}</p>
      ) : (
        <div className="admin-detail">
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
              value={order.alreadyHasClothing ? t('common.yes') : t('common.no')}
            />
            <DetailRow
              label={t('clothingOrders.paymentRequired')}
              value={
                order.clothingPaymentRequired ? t('common.yes') : t('common.no')
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
  value: string | number
}) {
  return (
    <div className="admin-detail__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
