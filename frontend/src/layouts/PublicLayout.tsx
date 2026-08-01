import { NavLink, Outlet } from 'react-router-dom'
import { apiBaseUrl } from '../config'
import { t } from '../i18n/t'

export function PublicLayout() {
  return (
    <div className="layout layout--public">
      <header className="layout__header">
        <strong>{t('appName')}</strong>
        <nav className="layout__nav">
          <NavLink to="/" end>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/register/football">{t('nav.football')}</NavLink>
          <NavLink to="/register/swimming">{t('nav.swimming')}</NavLink>
          <NavLink to="/admin">{t('nav.admin')}</NavLink>
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
      <footer className="layout__footer">
        {t('apiBase')}: <code>{apiBaseUrl}</code>
      </footer>
    </div>
  )
}
