import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { NavIcon } from '../components/ui/NavIcon'
import { t } from '../i18n/t'

function adminTheme(pathname: string): string {
  if (pathname.startsWith('/admin/registrations')) return 'registrations'
  if (pathname.startsWith('/admin/clothing-orders')) return 'clothing-orders'
  if (pathname.startsWith('/admin/clothing-pricing')) return 'clothing-pricing'
  if (pathname.startsWith('/admin/activity-pricing')) return 'activity-pricing'
  if (pathname.startsWith('/admin/activity-groups')) return 'groups'
  if (pathname.startsWith('/admin/swimming-registration')) return 'swimming'
  if (pathname.startsWith('/admin/payments')) return 'payments'
  if (pathname.startsWith('/admin/reports')) return 'reports'
  if (pathname.startsWith('/admin/help')) return 'help'
  if (pathname.startsWith('/admin/seasons')) return 'seasons'
  if (pathname.startsWith('/admin/activities')) return 'activities'
  if (pathname.startsWith('/admin/exports/kibbutz')) return 'export'
  return 'dashboard'
}

const navGroups = [
  {
    labelKey: 'nav.groupOverview',
    items: [
      { to: '/admin', labelKey: 'nav.dashboard', icon: 'dashboard' as const },
      { to: '/admin/reports', labelKey: 'nav.reports', icon: 'reports' as const },
      { to: '/admin/help', labelKey: 'nav.help', icon: 'help' as const },
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
      {
        to: '/admin/swimming-registration',
        labelKey: 'nav.swimmingRegistration',
        icon: 'activities' as const,
      },
    ],
  },
] as const

export function AdminLayout() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const theme = adminTheme(pathname)
  const initial = (username ?? 'A').slice(0, 1).toUpperCase()

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  function closeNav() {
    setNavOpen(false)
  }

  return (
    <div className={`layout layout--admin admin-theme-${theme}${navOpen ? ' admin-nav-open' : ''}`}>
      <button
        type="button"
        className="admin-sidebar-backdrop"
        aria-label={t('nav.closeMenu')}
        onClick={closeNav}
      />

      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__mark" aria-hidden="true">
            <NavIcon name="activities" />
          </span>
          <div className="admin-sidebar__brand-copy">
            <span className="admin-sidebar__brand-name">{t('appName')}</span>
            <span className="admin-sidebar__brand-sub">{t('nav.admin')}</span>
          </div>
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
          <p className="admin-topbar__greeting">
            <span className="admin-topbar__avatar" aria-hidden="true">
              {initial}
            </span>
            <span className="admin-topbar__identity">
              <span className="admin-topbar__hello">{t('nav.hello')},</span>{' '}
              <span className="admin-topbar__name">{username ?? 'admin'}</span>
            </span>
          </p>
          <div className="admin-topbar__actions">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setNavOpen((open) => !open)}
            >
              {t('nav.menu')}
            </button>
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
