import { Link } from 'react-router-dom'
import { t } from '../i18n/t'

export function PublicHomePage() {
  return (
    <div className="public-home">
      <header className="public-home__intro">
        <h1 className="public-home__welcome">{t('publicHome.welcome')}</h1>
        <p className="public-home__tagline">
          {t('publicHome.tagline')}
          <span className="public-home__sports">
            {' '}
            · {t('publicHome.sportsLine')}
          </span>
        </p>
      </header>

      <section
        className="public-home__split"
        aria-label={t('publicHome.sportsLine')}
      >
        <Link
          to="/register/football"
          className="sport-panel sport-panel--football"
        >
          <span className="sport-panel__media">
            <img
              className="sport-panel__image"
              src="/images/hero-football.jpg?v=7"
              alt=""
              width={1413}
              height={942}
              decoding="async"
            />
          </span>
          <span className="sport-panel__footer">
            <span className="sport-panel__text">
              <span className="sport-panel__title">
                {t('publicHome.footballTitle')}
              </span>
              <span className="sport-panel__hint">
                {t('publicHome.footballPanelHint')}
              </span>
            </span>
            <span className="sport-panel__cta">{t('publicHome.registerCta')}</span>
          </span>
        </Link>

        <Link
          to="/register/swimming"
          className="sport-panel sport-panel--swimming"
        >
          <span className="sport-panel__media">
            <img
              className="sport-panel__image"
              src="/images/hero-swimming.jpg"
              alt=""
              width={1536}
              height={1024}
              decoding="async"
            />
          </span>
          <span className="sport-panel__footer">
            <span className="sport-panel__text">
              <span className="sport-panel__title">
                {t('publicHome.swimmingTitle')}
              </span>
              <span className="sport-panel__hint">
                {t('publicHome.swimmingPanelHint')}
              </span>
            </span>
            <span className="sport-panel__cta">{t('publicHome.registerCta')}</span>
          </span>
        </Link>
      </section>

      <div className="public-home__secondary">
        <Link to="/register/clothing" className="public-home__clothing-btn">
          <span className="public-home__clothing-copy">
            <strong>{t('publicHome.clothingTitle')}</strong>
            <span>{t('publicHome.clothingHint')}</span>
          </span>
          <span className="public-home__clothing-cta">
            {t('publicHome.clothingCta')}
          </span>
        </Link>
      </div>
    </div>
  )
}
