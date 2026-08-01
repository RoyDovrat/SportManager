import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { NavIcon } from '../components/ui/NavIcon'
import { t } from '../i18n/t'

const navGroups = [
  {
    labelKey: 'nav.groupOverview',
    items: [
      { to: '/admin', labelKey: 'nav.dashboard', icon: 'dashboard' as const },
      { to: '/admin/reports', labelKey: 'nav.reports', icon: 'reports' as const },
    ],
  },
  {
    labelKey: 'nav.groupOperations',
    items: [
      {
        to: '/admin/registrations',
        labelKey: 'nav.registrations',
        icon: 'registrations' as const,
      },
      {
        to: '/admin/clothing-orders',
        labelKey: 'nav.clothingOrders',
        icon: 'clothing' as const,
      },
      { to: '/admin/payments', labelKey: 'nav.payments', icon: 'payments' as const },
      {
        to: '/admin/activity-groups',
        labelKey: 'nav.activityGroups',
        icon: 'groups' as const,
      },
      {
        to: '/admin/exports/kibbutz',
        labelKey: 'nav.kibbutzExport',
        icon: 'export' as const,
      },
    ],
  },
  {
    labelKey: 'nav.groupSetup',
    items: [
      { to: '/admin/seasons', labelKey: 'nav.seasons', icon: 'seasons' as const },
      { to: '/admin/activities', labelKey: 'nav.activities', icon: 'activities' as const },
      {
        to: '/admin/activity-pricing',
        labelKey: 'nav.activityPricing',
        icon: 'pricing' as const,
      },
      {
        to: '/admin/clothing-pricing',
        labelKey: 'nav.clothingPricing',
        icon: 'pricing' as const,
      },
    ],
  },
] as const

export function AdminLayout() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  function closeNav() {
    setNavOpen(false)
  }

  return (
    <div className={`layout layout--admin${navOpen ? ' admin-nav-open' : ''}`}>
      <button
        type="button"
        className="admin-sidebar-backdrop"
        aria-label={t('nav.closeMenu')}
        onClick={closeNav}
      />

      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__brand-name">{t('appName')}</span>
          <span className="admin-sidebar__brand-sub">{t('nav.admin')}</span>
        </div>

        <nav className="admin-sidebar__nav" aria-label={t('nav.admin')}>
          {navGroups.map((group) => (
            <div key={group.labelKey} className="admin-sidebar__group">
              <div className="admin-sidebar__group-label">{t(group.labelKey)}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className="admin-sidebar__link"
                  onClick={closeNav}
                >
                  <NavIcon name={item.icon} />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <NavLink to="/" className="admin-sidebar__link" onClick={closeNav}>
            <NavIcon name="public" />
            <span>{t('nav.publicSite')}</span>
          </NavLink>
          <button type="button" className="layout__logout" onClick={handleLogout}>
            <NavIcon name="logout" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="admin-shell">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setNavOpen((open) => !open)}
            >
              {t('nav.menu')}
            </button>
            <p className="admin-topbar__greeting">
              <span>{t('nav.hello')}, </span>
              {username ?? 'admin'}
            </p>
          </div>
          <div className="admin-topbar__actions">
            <button type="button" className="layout__logout" onClick={handleLogout}>
              {t('nav.logout')}
            </button>
          </div>
        </header>
        <main className="admin-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
