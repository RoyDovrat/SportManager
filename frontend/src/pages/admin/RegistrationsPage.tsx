import { t } from '../../i18n/t'

/** Placeholder — list + filters land in Stage 3. */
export function RegistrationsPage() {
  return (
    <section className="admin-page">
      <h1>{t('registrations.title')}</h1>
      <p>{t('registrations.placeholderList')}</p>
    </section>
  )
}
