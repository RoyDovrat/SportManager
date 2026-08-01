import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { t } from '../i18n/t'

export function AdminLayout() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="layout layout--admin">
      <header className="layout__header">
        <strong>{t('appName')} — {t('nav.admin')}</strong>
        <nav className="layout__nav">
          <NavLink to="/admin" end>
            {t('nav.adminHome')}
          </NavLink>
          <NavLink to="/admin/seasons">{t('nav.seasons')}</NavLink>
          <NavLink to="/admin/activities">{t('nav.activities')}</NavLink>
          <NavLink to="/admin/activity-pricing">{t('nav.activityPricing')}</NavLink>
          <NavLink to="/admin/clothing-pricing">{t('nav.clothingPricing')}</NavLink>
          <NavLink to="/admin/registrations">{t('nav.registrations')}</NavLink>
          <NavLink to="/admin/clothing-orders">{t('nav.clothingOrders')}</NavLink>
          <NavLink to="/admin/payments">{t('nav.payments')}</NavLink>
          <NavLink to="/admin/activity-groups">{t('nav.activityGroups')}</NavLink>
          <NavLink to="/admin/exports/kibbutz">{t('nav.kibbutzExport')}</NavLink>
          <NavLink to="/">{t('nav.publicSite')}</NavLink>
          <span className="layout__user">
            {t('nav.signedInAs')} <strong>{username ?? 'admin'}</strong>
          </span>
          <button type="button" className="layout__logout" onClick={handleLogout}>
            {t('nav.logout')}
          </button>
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
