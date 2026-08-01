import { Link } from 'react-router-dom'
import { t } from '../i18n/t'

export function PublicHomePage() {
  return (
    <div className="public-home">
      <section className="public-home__intro">
        <p className="public-home__brand">{t('appName')}</p>
        <h1 className="public-home__welcome">{t('publicHome.welcome')}</h1>
        <p className="public-home__tagline">{t('publicHome.tagline')}</p>
        <p className="public-home__sports">{t('publicHome.sportsLine')}</p>
      </section>

      <section className="public-home__split" aria-label={t('publicHome.sportsLine')}>
        <Link
          to="/register/football"
          className="sport-panel sport-panel--football"
          style={{
            backgroundImage: "url('/images/hero-football.jpg')",
          }}
        >
          <span className="sport-panel__shade" aria-hidden="true" />
          <span className="sport-panel__body">
            <span className="sport-panel__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3c2.2 2.4 3.4 5 3.4 9s-1.2 6.6-3.4 9c-2.2-2.4-3.4-5-3.4-9s1.2-6.6 3.4-9Z" />
                <path d="M3.5 9.5h17M3.5 14.5h17" />
              </svg>
            </span>
            <span className="sport-panel__title">{t('publicHome.footballTitle')}</span>
            <span className="sport-panel__cta btn btn--sport">
              {t('publicHome.registerCta')}
            </span>
          </span>
        </Link>

        <Link
          to="/register/swimming"
          className="sport-panel sport-panel--swimming"
          style={{
            backgroundImage: "url('/images/hero-swimming.jpg')",
          }}
        >
          <span className="sport-panel__shade" aria-hidden="true" />
          <span className="sport-panel__body">
            <span className="sport-panel__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M3 15c2-.8 3.5-.8 5.5 0s3.5.8 5.5 0 3.5-.8 5.5 0" />
                <path d="M3 19c2-.8 3.5-.8 5.5 0s3.5.8 5.5 0 3.5-.8 5.5 0" />
                <circle cx="15" cy="8" r="2.2" />
                <path d="M9 11c1.5-2 3-3 5-3" />
              </svg>
            </span>
            <span className="sport-panel__title">{t('publicHome.swimmingTitle')}</span>
            <span className="sport-panel__cta btn btn--pool">
              {t('publicHome.registerCta')}
            </span>
          </span>
        </Link>
      </section>

      <section className="public-home__secondary">
        <h2>{t('publicHome.clothingTitle')}</h2>
        <p>{t('publicHome.clothingDesc')}</p>
        <Link to="/register/clothing" className="public-home__link-card">
          <strong>{t('publicHome.clothingCta')}</strong>
          <span>{t('publicHome.clothingHint')}</span>
        </Link>
      </section>
    </div>
  )
}
