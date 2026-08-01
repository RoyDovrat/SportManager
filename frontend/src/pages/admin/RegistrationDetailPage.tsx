import { Link, useParams } from 'react-router-dom'
import { t } from '../../i18n/t'

/** Placeholder — detail + actions land in Stage 4. */
export function RegistrationDetailPage() {
  const { id } = useParams()

  return (
    <section className="admin-page">
      <h1>{t('registrations.detailTitle')}</h1>
      <p>{t('registrations.placeholderDetail', { id: id ?? '—' })}</p>
      <p>
        <Link to="/admin/registrations">{t('registrations.backToList')}</Link>
      </p>
    </section>
  )
}
