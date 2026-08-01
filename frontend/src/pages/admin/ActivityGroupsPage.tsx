import { t } from '../../i18n/t'

/** Placeholder — list + create land in Stage 3. */
export function ActivityGroupsPage() {
  return (
    <section className="admin-page">
      <h1>{t('activityGroups.title')}</h1>
      <p>{t('activityGroups.placeholderList')}</p>
    </section>
  )
}
