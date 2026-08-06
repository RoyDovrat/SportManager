import { Link } from 'react-router-dom'
import { t } from '../../i18n/t'

type StepBadge = 'required' | 'optional' | 'ops'

type GuideStep = {
  titleKey: string
  bodyKey: string
  to: string
  linkKey: string
  badge: StepBadge
}

const openSeasonSteps: GuideStep[] = [
  {
    titleKey: 'help.stepSeasonTitle',
    bodyKey: 'help.stepSeasonBody',
    to: '/admin/seasons',
    linkKey: 'help.linkSeasons',
    badge: 'required',
  },
  {
    titleKey: 'help.stepActivitiesTitle',
    bodyKey: 'help.stepActivitiesBody',
    to: '/admin/activities',
    linkKey: 'help.linkActivities',
    badge: 'required',
  },
  {
    titleKey: 'help.stepActivityPricingTitle',
    bodyKey: 'help.stepActivityPricingBody',
    to: '/admin/activity-pricing',
    linkKey: 'help.linkActivityPricing',
    badge: 'required',
  },
  {
    titleKey: 'help.stepSwimmingSettingsTitle',
    bodyKey: 'help.stepSwimmingSettingsBody',
    to: '/admin/swimming-registration',
    linkKey: 'help.linkSwimmingSettings',
    badge: 'optional',
  },
  {
    titleKey: 'help.stepClothingPricingTitle',
    bodyKey: 'help.stepClothingPricingBody',
    to: '/admin/clothing-pricing',
    linkKey: 'help.linkClothingPricing',
    badge: 'optional',
  },
  {
    titleKey: 'help.stepFootballGroupsTitle',
    bodyKey: 'help.stepFootballGroupsBody',
    to: '/admin/activity-groups',
    linkKey: 'help.linkActivityGroups',
    badge: 'required',
  },
  {
    titleKey: 'help.stepSwimmingGroupsTitle',
    bodyKey: 'help.stepSwimmingGroupsBody',
    to: '/admin/activity-groups',
    linkKey: 'help.linkActivityGroups',
    badge: 'optional',
  },
  {
    titleKey: 'help.stepActivateTitle',
    bodyKey: 'help.stepActivateBody',
    to: '/admin/seasons',
    linkKey: 'help.linkSeasons',
    badge: 'required',
  },
]

const opsSteps: GuideStep[] = [
  {
    titleKey: 'help.opsRegistrationsTitle',
    bodyKey: 'help.opsRegistrationsBody',
    to: '/admin/registrations',
    linkKey: 'help.linkRegistrations',
    badge: 'ops',
  },
  {
    titleKey: 'help.opsGroupsTitle',
    bodyKey: 'help.opsGroupsBody',
    to: '/admin/activity-groups',
    linkKey: 'help.linkActivityGroups',
    badge: 'ops',
  },
  {
    titleKey: 'help.opsClothingTitle',
    bodyKey: 'help.opsClothingBody',
    to: '/admin/clothing-orders',
    linkKey: 'help.linkClothingOrders',
    badge: 'ops',
  },
  {
    titleKey: 'help.opsPaymentsTitle',
    bodyKey: 'help.opsPaymentsBody',
    to: '/admin/payments',
    linkKey: 'help.linkPayments',
    badge: 'ops',
  },
  {
    titleKey: 'help.opsKibbutzTitle',
    bodyKey: 'help.opsKibbutzBody',
    to: '/admin/exports/kibbutz',
    linkKey: 'help.linkKibbutz',
    badge: 'ops',
  },
  {
    titleKey: 'help.opsReportsTitle',
    bodyKey: 'help.opsReportsBody',
    to: '/admin/reports',
    linkKey: 'help.linkReports',
    badge: 'ops',
  },
]

function badgeLabel(badge: StepBadge): string {
  if (badge === 'required') {
    return t('help.badgeRequired')
  }
  if (badge === 'optional') {
    return t('help.badgeOptional')
  }
  return t('help.badgeOps')
}

function GuideStepList({ steps }: { steps: GuideStep[] }) {
  return (
    <ol className="admin-help__steps">
      {steps.map((step, index) => (
        <li key={step.titleKey} className="admin-help__step">
          <div className="admin-help__step-index" aria-hidden="true">
            {index + 1}
          </div>
          <div className="admin-help__step-body">
            <div className="admin-help__step-head">
              <h3>{t(step.titleKey)}</h3>
              <span
                className={`admin-help__badge admin-help__badge--${step.badge}`}
              >
                {badgeLabel(step.badge)}
              </span>
            </div>
            <p>{t(step.bodyKey)}</p>
            <Link to={step.to} className="reg-action reg-action--view">
              {t(step.linkKey)}
            </Link>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function AdminHelpPage() {
  return (
    <section className="admin-page admin-help">
      <header className="admin-help__hero">
        <p className="admin-help__eyebrow">{t('help.eyebrow')}</p>
        <h1>{t('help.title')}</h1>
        <p className="admin-page__lede">{t('help.intro')}</p>
        <div className="admin-help__toc">
          <a href="#help-open-season" className="reg-action reg-action--edit">
            {t('help.tocOpenSeason')}
          </a>
          <a href="#help-ops" className="reg-action reg-action--view">
            {t('help.tocOps')}
          </a>
          <Link to="/" className="reg-action reg-action--open">
            {t('help.linkPublicSite')}
          </Link>
        </div>
      </header>

      <section
        id="help-open-season"
        className="admin-help__section"
        aria-labelledby="help-open-season-title"
      >
        <div className="admin-help__section-head">
          <h2 id="help-open-season-title">{t('help.openSeasonTitle')}</h2>
          <p>{t('help.openSeasonIntro')}</p>
        </div>
        <GuideStepList steps={openSeasonSteps} />
        <p className="admin-help__note">{t('help.openSeasonNote')}</p>
      </section>

      <section
        id="help-ops"
        className="admin-help__section"
        aria-labelledby="help-ops-title"
      >
        <div className="admin-help__section-head">
          <h2 id="help-ops-title">{t('help.opsTitle')}</h2>
          <p>{t('help.opsIntro')}</p>
        </div>
        <GuideStepList steps={opsSteps} />
      </section>
    </section>
  )
}
