import { Link } from 'react-router-dom'
import { t } from '../i18n/t'

export function PublicHomePage() {
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
        <li>
          <Link to="/register/clothing" className="admin-home__card">
            <strong>{t('publicHome.clothingTitle')}</strong>
            <span>{t('publicHome.clothingDesc')}</span>
          </Link>
        </li>
      </ul>
    </section>
  )
}
