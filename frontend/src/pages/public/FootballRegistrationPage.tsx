import { RegistrationWizard } from '../../components/registration/RegistrationWizard'
import { t } from '../../i18n/t'

export function FootballRegistrationPage() {
  return (
    <RegistrationWizard
      activityType="FOOTBALL"
      title={t('registration.footballTitle')}
      intro={t('registration.footballIntro')}
    />
  )
}
