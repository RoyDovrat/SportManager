import { Link } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import {
  createRegistration,
  type RegistrationResponse,
} from '../../api/registrations'
import { formatPublicApiError } from '../../api/formatPublicApiError'
import {
  StatusBadge,
  registrationStatusTone,
} from '../ui/StatusBadge'
import { WizardShell } from '../wizard/WizardShell'
import { activityTypeLabel, registrationStatusLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import type { ActivityType } from '../../types/enums'
import {
  emptyRegistrationCommonForm,
  emptySwimmingFormExtras,
  toRegistrationRequest,
  type RegistrationCommonForm,
  type SwimmingFormExtras,
} from './registrationForm'
import { useRegistrationCatalog } from './useRegistrationCatalog'
import { ActivityStep } from './steps/ActivityStep'
import { HealthStep } from './steps/HealthStep'
import { ParentStep } from './steps/ParentStep'
import { StudentStep } from './steps/StudentStep'

const STEPS = [
  { id: 'parent', labelKey: 'wizard.steps.parent' },
  { id: 'student', labelKey: 'wizard.steps.student' },
  { id: 'activity', labelKey: 'wizard.steps.activity' },
  { id: 'health', labelKey: 'wizard.steps.health' },
  { id: 'done', labelKey: 'wizard.steps.done' },
] as const

type RegistrationWizardProps = {
  activityType: ActivityType
  title: string
  intro: string
}

function validateParent(form: RegistrationCommonForm): string | null {
  if (!form.parentFirstName.trim() || !form.parentLastName.trim()) {
    return t('wizard.errors.parentNameRequired')
  }
  if (!form.phoneNumber.trim()) {
    return t('wizard.errors.phoneRequired')
  }
  if (form.isKibbutzMember && !form.budgetNumber.trim()) {
    return t('wizard.errors.budgetRequired')
  }
  return null
}

function validateStudent(form: RegistrationCommonForm): string | null {
  if (!form.studentFirstName.trim() || !form.studentLastName.trim()) {
    return t('wizard.errors.studentNameRequired')
  }
  if (!form.studentIdentityNumber.trim()) {
    return t('wizard.errors.identityRequired')
  }
  const age = Number(form.age)
  if (!Number.isFinite(age) || age < 1) {
    return t('wizard.errors.ageInvalid')
  }
  return null
}

export function RegistrationWizard({
  activityType,
  title,
  intro,
}: RegistrationWizardProps) {
  const catalog = useRegistrationCatalog(activityType)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<RegistrationCommonForm>(
    emptyRegistrationCommonForm,
  )
  const [swimming, setSwimming] = useState<SwimmingFormExtras>(
    emptySwimmingFormExtras,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<RegistrationResponse | null>(null)

  const steps = STEPS.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }))

  const isSwimming = activityType === 'SWIMMING'
  const formDisabled =
    catalog.loading || !catalog.season || !catalog.activity || submitting

  async function submitRegistration() {
    if (!catalog.season || !catalog.activity) {
      setError(catalog.error ?? t('common.errorGeneric'))
      return
    }
    if (!form.healthDeclarationApproved) {
      setError(t('wizard.errors.healthRequired'))
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
          isSwimming ? swimming : undefined,
        ),
      )
      setSuccess(response)
      setStep(4)
      setForm(emptyRegistrationCommonForm)
      setSwimming(emptySwimmingFormExtras)
    } catch (err) {
      setError(formatPublicApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  function goNext() {
    setError(null)
    if (step === 0) {
      const message = validateParent(form)
      if (message) {
        setError(message)
        return
      }
    }
    if (step === 1) {
      const message = validateStudent(form)
      if (message) {
        setError(message)
        return
      }
    }
    if (step === 3) {
      void submitRegistration()
      return
    }
    setStep((current) => Math.min(current + 1, 3))
  }

  function goBack() {
    setError(null)
    setStep((current) => Math.max(current - 1, 0))
  }

  function handleFormSubmit(event: FormEvent) {
    event.preventDefault()
    goNext()
  }

  function resetWizard() {
    setSuccess(null)
    setStep(0)
    setError(null)
  }

  if (catalog.loading) {
    return (
      <WizardShell
        title={title}
        subtitle={intro}
        steps={steps}
        currentIndex={0}
        footer={<Link to="/">{t('registration.cancel')}</Link>}
      >
        <p>{t('registration.loadingCatalog')}</p>
      </WizardShell>
    )
  }

  if (!catalog.season || !catalog.activity) {
    return (
      <WizardShell
        title={title}
        steps={steps}
        currentIndex={0}
        error={catalog.error}
        showStepper={false}
        footer={<Link to="/" className="btn">{t('common.backHome')}</Link>}
      >
        <p>{catalog.error ?? t('common.errorGeneric')}</p>
      </WizardShell>
    )
  }

  if (success && step === 4) {
    return (
      <WizardShell
        title={title}
        steps={steps}
        currentIndex={4}
        showStepper
        footer={
          <>
            <Link to="/" className="btn">
              {t('common.backHome')}
            </Link>
            {activityType === 'FOOTBALL' && (
              <Link to="/register/clothing" className="btn btn--secondary">
                {t('registration.clothingLink')}
              </Link>
            )}
          </>
        }
      >
        <div className="wizard-success">
          <div className="wizard-success__icon" aria-hidden="true">
            ✓
          </div>
          <h2>{t('wizard.successTitle')}</h2>
          <p>{t('registration.success')}</p>
          <p>
            {t('registration.registrationId')}: <strong>{success.id}</strong>
          </p>
          <p>
            {t('registration.status')}:{' '}
            <StatusBadge tone={registrationStatusTone(success.status)}>
              {registrationStatusLabel(success.status)}
            </StatusBadge>
          </p>
          {activityType === 'FOOTBALL' && (
            <p className="wizard-success__hint">
              {t('registration.clothingAfterApprove')}
            </p>
          )}
          <button type="button" className="btn btn--secondary" onClick={resetWizard}>
            {t('registration.registerAnother')}
          </button>
        </div>
      </WizardShell>
    )
  }

  const seasonLine = `${t('registration.seasonLabel')}: ${catalog.season.name}`

  return (
    <WizardShell
      title={title}
      subtitle={seasonLine}
      steps={steps}
      currentIndex={step}
      error={error}
      footer={
        <>
          {step > 0 ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={goBack}
              disabled={submitting}
            >
              {t('wizard.back')}
            </button>
          ) : (
            <Link to="/" className="btn btn--secondary">
              {t('registration.cancel')}
            </Link>
          )}
          <button
            type="submit"
            form="registration-wizard-form"
            className="btn"
            disabled={formDisabled}
          >
            {step === 3
              ? submitting
                ? t('registration.submitting')
                : t('registration.submit')
              : t('wizard.continue')}
          </button>
        </>
      }
    >
      <form
        id="registration-wizard-form"
        onSubmit={handleFormSubmit}
        noValidate
      >
        {step === 0 && (
          <ParentStep form={form} onChange={setForm} disabled={formDisabled} />
        )}
        {step === 1 && (
          <StudentStep form={form} onChange={setForm} disabled={formDisabled} />
        )}
        {step === 2 && (
          <ActivityStep
            activityLabel={activityTypeLabel(activityType)}
            seasonName={catalog.season.name}
            form={form}
            onChange={setForm}
            swimming={isSwimming ? swimming : undefined}
            onSwimmingChange={isSwimming ? setSwimming : undefined}
            disabled={formDisabled}
          />
        )}
        {step === 3 && (
          <HealthStep form={form} onChange={setForm} disabled={formDisabled} />
        )}
      </form>
    </WizardShell>
  )
}
