import { t } from '../../i18n/t'

export function ReportsPage() {
  return (
    <section className="admin-page">
      <h1>{t('reports.title')}</h1>
      <p>{t('reports.intro')}</p>
      <p>{t('reports.placeholder')}</p>
    </section>
  )
}
