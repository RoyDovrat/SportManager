import { Link, useParams } from 'react-router-dom'
import { t } from '../../i18n/t'

/** Placeholder — detail lands in Stage 5. */
export function ClothingOrderDetailPage() {
  const { id } = useParams()

  return (
    <section className="admin-page">
      <h1>{t('clothingOrders.detailTitle')}</h1>
      <p>{t('clothingOrders.placeholderDetail', { id: id ?? '—' })}</p>
      <p>
        <Link to="/admin/clothing-orders">{t('clothingOrders.backToList')}</Link>
      </p>
    </section>
  )
}
