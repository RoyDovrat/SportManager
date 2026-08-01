import { RegistrationWizard } from '../../components/registration/RegistrationWizard'
import { t } from '../../i18n/t'

export function SwimmingRegistrationPage() {
  return (
    <RegistrationWizard
      activityType="SWIMMING"
      title={t('registration.swimmingTitle')}
      intro={t('registration.swimmingIntro')}
    />
  )
}
