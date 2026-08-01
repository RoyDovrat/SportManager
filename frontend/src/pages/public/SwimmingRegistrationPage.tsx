import { Link } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { createRegistration, type RegistrationResponse } from '../../api/registrations'
import { formatApiError } from '../../api/formatApiError'
import { RegistrationCommonFields } from '../../components/registration/RegistrationCommonFields'
import { SwimmingRegistrationFields } from '../../components/registration/SwimmingRegistrationFields'
import {
  emptyRegistrationCommonForm,
  emptySwimmingFormExtras,
  toRegistrationRequest,
  type RegistrationCommonForm,
  type SwimmingFormExtras,
} from '../../components/registration/registrationForm'
import { useRegistrationCatalog } from '../../components/registration/useRegistrationCatalog'
import {
  StatusBadge,
  registrationStatusTone,
} from '../../components/ui/StatusBadge'
import { registrationStatusLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'

export function SwimmingRegistrationPage() {
  const catalog = useRegistrationCatalog('SWIMMING')
  const [form, setForm] = useState<RegistrationCommonForm>(emptyRegistrationCommonForm)
  const [swimming, setSwimming] = useState<SwimmingFormExtras>(emptySwimmingFormExtras)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<RegistrationResponse | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!catalog.season || !catalog.activity) {
      setError(catalog.error ?? t('common.errorGeneric'))
      return
    }

    if (!form.healthDeclarationApproved) {
      setError(t('registration.healthDeclaration'))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await createRegistration(
        toRegistrationRequest(
          form,
          catalog.season.id,
          catalog.activity.id,
          swimming,
        ),
      )
      setSuccess(response)
      setForm(emptyRegistrationCommonForm)
      setSwimming(emptySwimmingFormExtras)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <section className="public-page">
        <div className="public-page__panel admin-page">
          <h1>{t('registration.swimmingTitle')}</h1>
          <p className="admin-page__ok">{t('registration.success')}</p>
          <p>
            {t('registration.registrationId')}: <strong>{success.id}</strong>
          </p>
          <p>
            {t('registration.status')}:{' '}
            <StatusBadge tone={registrationStatusTone(success.status)}>
              {registrationStatusLabel(success.status)}
            </StatusBadge>
          </p>
          <p>
            <Link to="/">{t('registration.cancel')}</Link>
            {' · '}
            <button type="button" onClick={() => setSuccess(null)}>
              {t('registration.registerAnother')}
            </button>
          </p>
        </div>
      </section>
    )
  }

  const formDisabled =
    catalog.loading || !catalog.season || !catalog.activity || submitting

  return (
    <section className="public-page">
      <div className="public-page__panel admin-page">
        <h1>{t('registration.swimmingTitle')}</h1>
        <p>{t('registration.swimmingIntro')}</p>

        {catalog.loading && <p>{t('registration.loadingCatalog')}</p>}
        {catalog.error && <p className="admin-page__error">{catalog.error}</p>}
        {error && <p className="admin-page__error">{error}</p>}

        {!catalog.loading && catalog.season && catalog.activity && (
          <p className="admin-page__ok">
            {t('registration.seasonLabel')}:{' '}
            <strong>{catalog.season.name}</strong>
          </p>
        )}

        <form className="admin-form registration-form" onSubmit={handleSubmit}>
          <RegistrationCommonFields
            form={form}
            onChange={setForm}
            disabled={formDisabled}
          />

          <SwimmingRegistrationFields
            form={swimming}
            onChange={setSwimming}
            disabled={formDisabled}
          />

          <div className="admin-form__actions">
            <button type="submit" disabled={formDisabled}>
              {submitting
                ? t('registration.submitting')
                : t('registration.submit')}
            </button>
            <Link to="/">{t('registration.cancel')}</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
