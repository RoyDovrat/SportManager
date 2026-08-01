import { t } from '../../i18n/t'

export function KibbutzExportPage() {
  return (
    <section className="admin-page">
      <h1>{t('kibbutzExport.title')}</h1>
      <p>{t('kibbutzExport.intro')}</p>
      <p>{t('kibbutzExport.placeholder')}</p>
    </section>
  )
}
