import { Link, useParams } from 'react-router-dom'
import { t } from '../../i18n/t'

/** Placeholder — detail + members land in Stages 4–5. */
export function ActivityGroupDetailPage() {
  const { id } = useParams()

  return (
    <section className="admin-page">
      <h1>{t('activityGroups.detailTitle')}</h1>
      <p>{t('activityGroups.placeholderDetail', { id: id ?? '—' })}</p>
      <p>
        <Link to="/admin/activity-groups">{t('activityGroups.backToList')}</Link>
      </p>
    </section>
  )
}
