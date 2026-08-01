import { t } from '../../i18n/t'

/** Placeholder — list + billing actions land in Stages 3–5. */
export function PaymentsPage() {
  return (
    <section className="admin-page">
      <h1>{t('payments.title')}</h1>
      <p>{t('payments.placeholderList')}</p>
    </section>
  )
}
