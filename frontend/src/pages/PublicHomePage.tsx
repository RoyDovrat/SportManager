import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api'
import { getHealth } from '../api/health'
import { t } from '../i18n/t'

type HealthCheckState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; value: string }
  | { status: 'error'; message: string }

export function PublicHomePage() {
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
    <section className="admin-page">
      <h1>{t('publicHome.title')}</h1>
      <p>{t('publicHome.subtitle')}</p>

      <ul className="admin-home__cards">
        <li>
          <Link to="/register/football" className="admin-home__card">
            <strong>{t('publicHome.footballTitle')}</strong>
            <span>{t('publicHome.footballDesc')}</span>
          </Link>
        </li>
        <li>
          <Link to="/register/swimming" className="admin-home__card">
            <strong>{t('publicHome.swimmingTitle')}</strong>
            <span>{t('publicHome.swimmingDesc')}</span>
          </Link>
        </li>
      </ul>

      <div className="health-check">
        <h2>{t('publicHome.healthTitle')}</h2>
        <p>{t('publicHome.healthHint')}</p>
        <button type="button" onClick={handleCheckHealth} disabled={check.status === 'loading'}>
          {check.status === 'loading' ? t('publicHome.healthChecking') : t('publicHome.healthButton')}
        </button>

        {check.status === 'ok' && (
          <p className="health-check__ok">
            {t('publicHome.healthOk')}: <code>{check.value}</code>
          </p>
        )}

        {check.status === 'error' && (
          <p className="health-check__error">
            {t('publicHome.healthFail')}: {check.message}
          </p>
        )}
      </div>
    </section>
  )
}
