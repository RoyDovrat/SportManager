import { Link, useParams } from 'react-router-dom'
import { t } from '../../i18n/t'

/** Placeholder — detail + actions land in Stage 4. */
export function PaymentDetailPage() {
  const { id } = useParams()

  return (
    <section className="admin-page">
      <h1>{t('payments.detailTitle')}</h1>
      <p>{t('payments.placeholderDetail', { id: id ?? '—' })}</p>
      <p>
        <Link to="/admin/payments">{t('payments.backToList')}</Link>
      </p>
    </section>
  )
}
