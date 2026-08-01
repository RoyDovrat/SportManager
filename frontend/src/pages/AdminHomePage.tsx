import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { t } from '../i18n/t'

const setupLinks = [
  {
    to: '/admin/seasons',
    labelKey: 'nav.seasons',
    descriptionKey: 'adminHome.seasonsDesc',
  },
  {
    to: '/admin/activities',
    labelKey: 'nav.activities',
    descriptionKey: 'adminHome.activitiesDesc',
  },
  {
    to: '/admin/activity-pricing',
    labelKey: 'nav.activityPricing',
    descriptionKey: 'adminHome.activityPricingDesc',
  },
  {
    to: '/admin/clothing-pricing',
    labelKey: 'nav.clothingPricing',
    descriptionKey: 'adminHome.clothingPricingDesc',
  },
  {
    to: '/admin/registrations',
    labelKey: 'nav.registrations',
    descriptionKey: 'adminHome.registrationsDesc',
  },
  {
    to: '/admin/clothing-orders',
    labelKey: 'nav.clothingOrders',
    descriptionKey: 'adminHome.clothingOrdersDesc',
  },
  {
    to: '/admin/payments',
    labelKey: 'nav.payments',
    descriptionKey: 'adminHome.paymentsDesc',
  },
  {
    to: '/admin/activity-groups',
    labelKey: 'nav.activityGroups',
    descriptionKey: 'adminHome.activityGroupsDesc',
  },
  {
    to: '/admin/exports/kibbutz',
    labelKey: 'nav.kibbutzExport',
    descriptionKey: 'adminHome.kibbutzExportDesc',
  },
] as const

export function AdminHomePage() {
  const { username } = useAuth()

  return (
    <section className="admin-page">
      <h1>{t('adminHome.title')}</h1>
      <p>
        {t('adminHome.signedIn')} <strong>{username}</strong>.
      </p>
      <p>{t('adminHome.intro')}</p>

      <ul className="admin-home__cards">
        {setupLinks.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="admin-home__card">
              <strong>{t(link.labelKey)}</strong>
              <span>{t(link.descriptionKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
