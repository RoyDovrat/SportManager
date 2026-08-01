import { t } from '../../i18n/t'

/** Placeholder — list + create form land in Stages 3–4. */
export function ClothingOrdersPage() {
  return (
    <section className="admin-page">
      <h1>{t('clothingOrders.title')}</h1>
      <p>{t('clothingOrders.placeholderList')}</p>
    </section>
  )
}
