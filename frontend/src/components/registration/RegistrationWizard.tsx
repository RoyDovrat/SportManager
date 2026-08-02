import { Link } from 'react-router-dom'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  createRegistration,
  type RegistrationResponse,
} from '../../api/registrations'
import { formatPublicApiError } from '../../api/formatPublicApiError'
import {
  hasText,
  isValidIsraeliId,
  isValidIsraeliMobile,
} from '../../validation/fields'
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
import { FootballCatalogPanel } from './FootballCatalogPanel'
import { useRegistrationCatalog } from './useRegistrationCatalog'
import { ActivityStep } from './steps/ActivityStep'
import { HealthStep } from './steps/HealthStep'
import { ParentStep } from './steps/ParentStep'
import { StudentStep } from './steps/StudentStep'

type StepDef = { id: string; labelKey: string }

const SWIMMING_STEPS: StepDef[] = [
  { id: 'parent', labelKey: 'wizard.steps.parent' },
  { id: 'student', labelKey: 'wizard.steps.student' },
  { id: 'activity', labelKey: 'wizard.steps.activity' },
  { id: 'health', labelKey: 'wizard.steps.health' },
  { id: 'done', labelKey: 'wizard.steps.done' },
]

const FOOTBALL_STEPS: StepDef[] = [
  { id: 'catalog', labelKey: 'wizard.steps.catalog' },
  { id: 'parent', labelKey: 'wizard.steps.parent' },
  { id: 'student', labelKey: 'wizard.steps.student' },
  { id: 'activity', labelKey: 'wizard.steps.activity' },
  { id: 'health', labelKey: 'wizard.steps.health' },
  { id: 'done', labelKey: 'wizard.steps.done' },
]

type RegistrationWizardProps = {
  activityType: ActivityType
  title: string
  intro: string
  sideBrand?: ReactNode
}

function validateParent(form: RegistrationCommonForm): string | null {
  if (!hasText(form.parentFirstName) || !hasText(form.parentLastName)) {
    return t('wizard.errors.parentNameRequired')
  }
  if (!hasText(form.phoneNumber)) {
    return t('wizard.errors.phoneRequired')
  }
  if (!isValidIsraeliMobile(form.phoneNumber)) {
    return t('wizard.errors.phoneInvalid')
  }
  if (form.isKibbutzMember && !hasText(form.budgetNumber)) {
    return t('wizard.errors.budgetRequired')
  }
  return null
}

function validateStudent(form: RegistrationCommonForm): string | null {
  if (!hasText(form.studentFirstName) || !hasText(form.studentLastName)) {
    return t('wizard.errors.studentNameRequired')
  }
  if (!hasText(form.studentIdentityNumber)) {
    return t('wizard.errors.identityRequired')
  }
  if (!isValidIsraeliId(form.studentIdentityNumber)) {
    return t('wizard.errors.identityInvalid')
  }
  const age = Number(form.age)
  if (!Number.isFinite(age) || age < 1 || age > 120) {
    return t('wizard.errors.ageInvalid')
  }
  return null
}

export function RegistrationWizard({
  activityType,
  title,
  intro,
  sideBrand,
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

  const isSwimming = activityType === 'SWIMMING'
  const isFootball = activityType === 'FOOTBALL'
  const stepDefs = isFootball ? FOOTBALL_STEPS : SWIMMING_STEPS
  const doneIndex = stepDefs.length - 1
  const healthIndex = doneIndex - 1
  const lastFormIndex = healthIndex

  const steps = useMemo(
    () =>
      stepDefs.map((item) => ({
        id: item.id,
        label: t(item.labelKey),
      })),
    [stepDefs],
  )

  const currentStepId = stepDefs[step]?.id ?? 'parent'

  const formDisabled =
    catalog.loading || !catalog.season || !catalog.activity || submitting

  const highlightedGroupId =
    isFootball && catalog.footballCatalog
      ? (catalog.footballCatalog.groups.find((group) =>
          group.ageGroups.includes(form.ageGroup),
        )?.id ?? null)
      : null

  const matchedFootballGroup =
    isFootball && catalog.footballCatalog && highlightedGroupId != null
      ? (catalog.footballCatalog.groups.find(
          (group) => group.id === highlightedGroupId,
        ) ?? null)
      : null

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
      setStep(doneIndex)
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
    if (currentStepId === 'parent') {
      const message = validateParent(form)
      if (message) {
        setError(message)
        return
      }
    }
    if (currentStepId === 'student') {
      const message = validateStudent(form)
      if (message) {
        setError(message)
        return
      }
      if (isFootball && catalog.footballCatalog) {
        const hasMatch = catalog.footballCatalog.groups.some((group) =>
          group.ageGroups.includes(form.ageGroup),
        )
        if (!hasMatch) {
          setError(t('wizard.errors.footballNoGroup'))
          return
        }
      }
    }
    if (currentStepId === 'activity' && isFootball) {
      if (!matchedFootballGroup) {
        setError(t('wizard.errors.footballNoGroup'))
        return
      }
      if (matchedFootballGroup.monthlyPrice == null) {
        setError(t('wizard.errors.footballPricingMissing'))
        return
      }
    }
    if (currentStepId === 'health') {
      void submitRegistration()
      return
    }
    setStep((current) => Math.min(current + 1, lastFormIndex))
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
        sideBrand={sideBrand}
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
        sideBrand={sideBrand}
        footer={<Link to="/" className="btn">{t('common.backHome')}</Link>}
      >
        <p>{catalog.error ?? t('common.errorGeneric')}</p>
      </WizardShell>
    )
  }

  if (success && step === doneIndex) {
    return (
      <WizardShell
        title={title}
        steps={steps}
        currentIndex={doneIndex}
        showStepper
        sideBrand={sideBrand}
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
      sideBrand={sideBrand}
      bodyClassName="wizard-card__body--scroll"
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
            {currentStepId === 'health'
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
        {currentStepId === 'catalog' &&
          (catalog.footballCatalog ? (
            <FootballCatalogPanel
              catalog={catalog.footballCatalog}
              highlightedGroupId={null}
              showPriceList
              variant="step"
            />
          ) : (
            <p>{t('footballCatalog.empty')}</p>
          ))}
        {currentStepId === 'parent' && (
          <ParentStep form={form} onChange={setForm} disabled={formDisabled} />
        )}
        {currentStepId === 'student' && (
          <StudentStep form={form} onChange={setForm} disabled={formDisabled} />
        )}
        {currentStepId === 'activity' && (
          <ActivityStep
            activityLabel={activityTypeLabel(activityType)}
            seasonName={catalog.season.name}
            form={form}
            onChange={setForm}
            swimming={isSwimming ? swimming : undefined}
            onSwimmingChange={isSwimming ? setSwimming : undefined}
            footballMatchedGroup={isFootball ? matchedFootballGroup : undefined}
            disabled={formDisabled}
          />
        )}
        {currentStepId === 'health' && (
          <HealthStep form={form} onChange={setForm} disabled={formDisabled} />
        )}
      </form>
    </WizardShell>
  )
}
