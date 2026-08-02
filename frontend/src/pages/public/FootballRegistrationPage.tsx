import { useState } from 'react'
import { RegistrationWizard } from '../../components/registration/RegistrationWizard'
import { t } from '../../i18n/t'

export function FootballRegistrationPage() {
  const [logoVisible, setLogoVisible] = useState(true)

  const sideBrand = logoVisible ? (
    <img
      src="/images/football-club-logo.png"
      alt={t('footballCatalog.logoAlt')}
      className="football-registration__logo"
      onError={() => setLogoVisible(false)}
    />
  ) : null

  return (
    <div className="football-registration">
      <RegistrationWizard
        activityType="FOOTBALL"
        title={t('registration.footballTitle')}
        intro={t('registration.footballIntro')}
        sideBrand={sideBrand}
      />
    </div>
  )
}
