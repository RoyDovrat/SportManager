import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ApiError } from '../api'
import { getHealth } from '../api/health'
import { apiBaseUrl } from '../config'
import { t } from '../i18n/t'

type HealthCheckState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; value: string }
  | { status: 'error'; message: string }

export function PublicLayout() {
  const [check, setCheck] = useState<HealthCheckState>({ status: 'idle' })

  async function handleCheckHealth() {
    setCheck({ status: 'loading' })

    try {
      const result = await getHealth()
      setCheck({ status: 'ok', value: result.status })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t('common.errorGeneric')

      setCheck({ status: 'error', message })
    }
  }

  return (
    <div className="layout layout--public">
      <header className="layout__header">
        <NavLink to="/" end className="layout__brand">
          {t('appName')}
        </NavLink>
        <nav className="layout__nav">
          <NavLink to="/" end>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/register/football">{t('nav.football')}</NavLink>
          <NavLink to="/register/swimming">{t('nav.swimming')}</NavLink>
          <NavLink to="/register/clothing">{t('nav.clothing')}</NavLink>
          <NavLink to="/admin" className="nav-admin-link">
            {t('nav.admin')}
          </NavLink>
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
      <footer className="layout__footer">
        <span>
          {t('apiBase')}: <code>{apiBaseUrl}</code>
        </span>
        <span className="layout__footer-health">
          <button
            type="button"
            className="layout__footer-health-btn"
            onClick={handleCheckHealth}
            disabled={check.status === 'loading'}
          >
            {check.status === 'loading'
              ? t('publicHome.healthChecking')
              : t('publicHome.healthButton')}
          </button>
          {check.status === 'ok' && (
            <span className="health-check__ok">
              {t('publicHome.healthOk')}: <code>{check.value}</code>
            </span>
          )}
          {check.status === 'error' && (
            <span className="health-check__error">
              {t('publicHome.healthFail')}: {check.message}
            </span>
          )}
        </span>
      </footer>
    </div>
  )
}
