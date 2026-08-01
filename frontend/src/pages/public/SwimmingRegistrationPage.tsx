import { Link } from 'react-router-dom'
import { useState } from 'react'
import { RegistrationCommonFields } from '../../components/registration/RegistrationCommonFields'
import {
  emptyRegistrationCommonForm,
  type RegistrationCommonForm,
} from '../../components/registration/registrationForm'
import { useRegistrationCatalog } from '../../components/registration/useRegistrationCatalog'
import { t } from '../../i18n/t'

export function SwimmingRegistrationPage() {
  const catalog = useRegistrationCatalog('SWIMMING')
  const [form, setForm] = useState<RegistrationCommonForm>(emptyRegistrationCommonForm)

  return (
    <section className="admin-page">
      <h1>{t('registration.swimmingTitle')}</h1>
      <p>{t('registration.swimmingIntro')}</p>

      {catalog.loading && <p>{t('registration.loadingCatalog')}</p>}
      {catalog.error && <p className="admin-page__error">{catalog.error}</p>}

      {!catalog.loading && catalog.season && catalog.activity && (
        <p className="admin-page__ok">
          {t('registration.seasonLabel')}: <strong>{catalog.season.name}</strong> ·{' '}
          {t('registration.activityIdLabel')}: <strong>{catalog.activity.id}</strong>
        </p>
      )}

      <form
        className="admin-form registration-form"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <RegistrationCommonFields
          form={form}
          onChange={setForm}
          disabled={catalog.loading || !catalog.season || !catalog.activity}
        />

        <div className="admin-form__actions">
          <button type="submit" disabled>
            {t('registration.submitLater')}
          </button>
          <Link to="/">{t('registration.cancel')}</Link>
        </div>
      </form>
    </section>
  )
}
