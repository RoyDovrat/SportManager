import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  createClothingOrder,
  type ClothingOrderRequest,
  type ClothingOrderResponse,
} from '../../api/clothingOrders'
import { formatPublicApiError } from '../../api/formatPublicApiError'
import {
  checkClothingEligibility,
  getClothingCatalog,
  type ClothingCatalogResponse,
  type ClothingEligibilityResponse,
} from '../../api/publicCatalog'
import { WizardShell } from '../../components/wizard/WizardShell'
import { clothingSizeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import { CLOTHING_SIZES, type ClothingSize } from '../../types/enums'
import {
  hasText,
  isValidIsraeliId,
  normalizeIsraeliId,
} from '../../validation/fields'

type FormState = {
  studentIdentityNumber: string
  alreadyHasClothing: boolean
  shortKitQuantity: string
  shortKitSize: string
  longKitQuantity: string
  longKitSize: string
  hoodieQuantity: string
  hoodieSize: string
  shirtNumber: string
}

const emptyForm: FormState = {
  studentIdentityNumber: '',
  alreadyHasClothing: false,
  shortKitQuantity: '0',
  shortKitSize: '',
  longKitQuantity: '0',
  longKitSize: '',
  hoodieQuantity: '0',
  hoodieSize: '',
  shirtNumber: '',
}

const STEP_DEFS = [
  { id: 'prices', labelKey: 'wizard.clothing.prices' },
  { id: 'identity', labelKey: 'wizard.clothing.identity' },
  { id: 'items', labelKey: 'wizard.clothing.items' },
  { id: 'done', labelKey: 'wizard.steps.done' },
] as const

function parseQuantity(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function buildRequest(form: FormState, seasonId: number): ClothingOrderRequest {
  const studentIdentityNumber = normalizeIsraeliId(form.studentIdentityNumber)

  if (form.alreadyHasClothing) {
    return {
      studentIdentityNumber,
      seasonId,
      alreadyHasClothing: true,
    }
  }

  const shortKitQuantity = parseQuantity(form.shortKitQuantity)
  const longKitQuantity = parseQuantity(form.longKitQuantity)
  const hoodieQuantity = parseQuantity(form.hoodieQuantity)
  const shirtRaw = form.shirtNumber.trim()

  return {
    studentIdentityNumber,
    seasonId,
    alreadyHasClothing: false,
    shortKitQuantity,
    shortKitSize:
      shortKitQuantity > 0 ? (form.shortKitSize as ClothingSize) : null,
    longKitQuantity,
    longKitSize:
      longKitQuantity > 0 ? (form.longKitSize as ClothingSize) : null,
    hoodieQuantity,
    hoodieSize: hoodieQuantity > 0 ? (form.hoodieSize as ClothingSize) : null,
    shirtNumber: shirtRaw === '' ? null : Number(shirtRaw),
  }
}

function validateIdentity(form: FormState): string | null {
  if (!hasText(form.studentIdentityNumber)) {
    return t('wizard.clothing.identityRequired')
  }
  if (!isValidIsraeliId(form.studentIdentityNumber)) {
    return t('wizard.errors.identityInvalid')
  }
  return null
}

function validateItems(form: FormState): string | null {
  if (form.alreadyHasClothing) {
    return null
  }
  const shortKitQuantity = parseQuantity(form.shortKitQuantity)
  const longKitQuantity = parseQuantity(form.longKitQuantity)
  const hoodieQuantity = parseQuantity(form.hoodieQuantity)
  const total = shortKitQuantity + longKitQuantity + hoodieQuantity
  if (total < 1) {
    return t('wizard.clothing.itemsRequired')
  }
  if (shortKitQuantity > 0 && !form.shortKitSize) {
    return t('wizard.clothing.sizeRequired')
  }
  if (longKitQuantity > 0 && !form.longKitSize) {
    return t('wizard.clothing.sizeRequired')
  }
  if (hoodieQuantity > 0 && !form.hoodieSize) {
    return t('wizard.clothing.sizeRequired')
  }
  const shirtRaw = form.shirtNumber.trim()
  if (shirtRaw === '') {
    return t('publicClothing.printedNumberRequired')
  }
  const shirtNumber = Number(shirtRaw)
  if (!Number.isInteger(shirtNumber) || shirtNumber < 0 || shirtNumber > 99) {
    return t('publicClothing.printedNumberInvalid')
  }
  return null
}

export function ClothingOrderPage() {
  const [logoVisible, setLogoVisible] = useState(true)
  const [catalog, setCatalog] = useState<ClothingCatalogResponse | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ClothingOrderResponse | null>(null)
  const [eligibleStudent, setEligibleStudent] =
    useState<ClothingEligibilityResponse | null>(null)

  const steps = STEP_DEFS.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }))
  const doneIndex = steps.length - 1
  const currentStepId = STEP_DEFS[step]?.id ?? 'prices'

  const sideBrand = logoVisible ? (
    <img
      src="/images/football-club-logo.png"
      alt={t('footballCatalog.logoAlt')}
      className="football-registration__logo"
      onError={() => setLogoVisible(false)}
    />
  ) : null

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      setCatalogLoading(true)
      setCatalogError(null)
      try {
        const active = await getClothingCatalog()
        if (!cancelled) {
          setCatalog(active)
        }
      } catch (err) {
        if (!cancelled) {
          setCatalog(null)
          setCatalogError(formatPublicApiError(err))
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false)
        }
      }
    }

    void loadCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  async function submitOrder() {
    if (!catalog) {
      setError(catalogError ?? t('publicClothing.noActiveSeason'))
      return
    }
    const itemsError = validateItems(form)
    if (itemsError) {
      setError(itemsError)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const response = await createClothingOrder(
        buildRequest(form, catalog.seasonId),
      )
      setSuccess(response)
      setForm(emptyForm)
      setEligibleStudent(null)
      setStep(doneIndex)
    } catch (err) {
      setError(formatPublicApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function goNext() {
    setError(null)
    if (currentStepId === 'prices') {
      if (!catalog?.pricingConfigured) {
        setError(t('publicClothing.noPricing'))
        return
      }
      setStep(1)
      return
    }
    if (currentStepId === 'identity') {
      const identityError = validateIdentity(form)
      if (identityError) {
        setError(identityError)
        return
      }
      if (!catalog) {
        setError(t('publicClothing.noActiveSeason'))
        return
      }

      setCheckingEligibility(true)
      try {
        const eligibility = await checkClothingEligibility(
          catalog.seasonId,
          normalizeIsraeliId(form.studentIdentityNumber),
        )
        setEligibleStudent(eligibility)

        if (form.alreadyHasClothing) {
          if (!catalog.allowAlreadyHasClothingSkip) {
            setError(t('wizard.errors.clothingSkipDisabled'))
            return
          }
          await submitOrder()
          return
        }
        setStep(2)
      } catch (err) {
        setEligibleStudent(null)
        setError(formatPublicApiError(err))
      } finally {
        setCheckingEligibility(false)
      }
      return
    }
    if (currentStepId === 'items') {
      void submitOrder()
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void goNext()
  }

  function resetWizard() {
    setSuccess(null)
    setStep(0)
    setError(null)
    setEligibleStudent(null)
  }

  function goBack() {
    setError(null)
    if (currentStepId === 'identity') {
      setEligibleStudent(null)
      setStep(0)
      return
    }
    if (currentStepId === 'items') {
      setStep(1)
    }
  }

  if (catalogLoading) {
    return (
      <WizardShell
        title={t('publicClothing.title')}
        steps={steps}
        currentIndex={0}
        sideBrand={sideBrand}
        footer={<Link to="/">{t('registration.cancel')}</Link>}
      >
        <p>{t('common.loading')}</p>
      </WizardShell>
    )
  }

  if (!catalog) {
    return (
      <WizardShell
        title={t('publicClothing.title')}
        steps={steps}
        currentIndex={0}
        showStepper={false}
        error={catalogError}
        sideBrand={sideBrand}
        footer={<Link to="/" className="btn">{t('common.backHome')}</Link>}
      >
        <p>{catalogError ?? t('publicClothing.noActiveSeason')}</p>
      </WizardShell>
    )
  }

  if (success && currentStepId === 'done') {
    return (
      <WizardShell
        title={t('publicClothing.title')}
        steps={steps}
        currentIndex={doneIndex}
        sideBrand={sideBrand}
        footer={
          <Link to="/" className="btn">
            {t('common.backHome')}
          </Link>
        }
      >
        <div className="wizard-success">
          <div className="wizard-success__icon" aria-hidden="true">
            ✓
          </div>
          <h2>{t('wizard.successTitle')}</h2>
          <p>
            {success.alreadyHasClothing
              ? t('publicClothing.successSkip')
              : t('publicClothing.successOrder')}
          </p>
          <p>
            {t('publicClothing.orderId')}: <strong>{success.id}</strong>
          </p>
          <p className="wizard-success__hint">{t('publicClothing.successHint')}</p>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={resetWizard}
          >
            {t('publicClothing.orderAnother')}
          </button>
        </div>
      </WizardShell>
    )
  }

  const formDisabled = submitting || checkingEligibility
  const showSubmit =
    (currentStepId === 'identity' && form.alreadyHasClothing) ||
    currentStepId === 'items'

  return (
    <WizardShell
      title={t('publicClothing.title')}
      subtitle={`${t('publicClothing.season')}: ${catalog.seasonName}`}
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
              disabled={formDisabled}
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
            form="clothing-wizard-form"
            className="btn"
            disabled={formDisabled}
          >
            {checkingEligibility
              ? t('publicClothing.checking')
              : showSubmit
                ? submitting
                  ? t('publicClothing.submitting')
                  : t('publicClothing.submit')
                : t('wizard.continue')}
          </button>
        </>
      }
    >
      <form id="clothing-wizard-form" onSubmit={handleSubmit} noValidate>
        {currentStepId === 'prices' && (
          <section
            className="clothing-catalog"
            aria-label={t('publicClothing.pricesTitle')}
          >
            <h2 className="clothing-catalog__title">
              {t('publicClothing.pricesTitle')}
            </h2>
            {!catalog.pricingConfigured ? (
              <p>{t('publicClothing.noPricing')}</p>
            ) : (
              <ul className="clothing-catalog__list">
                <li>
                  <span>{t('clothingOrders.shortKit')}</span>
                  <strong>
                    {t('publicClothing.priceAmount', {
                      amount: catalog.shortKitPrice ?? '—',
                    })}
                  </strong>
                </li>
                <li>
                  <span>{t('clothingOrders.longKit')}</span>
                  <strong>
                    {t('publicClothing.priceAmount', {
                      amount: catalog.longKitPrice ?? '—',
                    })}
                  </strong>
                </li>
                <li>
                  <span>{t('clothingOrders.hoodie')}</span>
                  <strong>
                    {t('publicClothing.priceAmount', {
                      amount: catalog.hoodiePrice ?? '—',
                    })}
                  </strong>
                </li>
              </ul>
            )}
          </section>
        )}

        {currentStepId === 'identity' && (
          <div className="wizard-fields">
            <p className="wizard-hint">{t('publicClothing.approvedHint')}</p>
            <label className="admin-form__field">
              <span>{t('publicClothing.identity')}</span>
              <input
                value={form.studentIdentityNumber}
                onChange={(event) =>
                  setForm({
                    ...form,
                    studentIdentityNumber: event.target.value,
                  })
                }
                required
                disabled={formDisabled}
                autoFocus
                inputMode="numeric"
                maxLength={12}
              />
            </label>
            {eligibleStudent && (
              <p className="wizard-hint">
                {t('publicClothing.eligibleFor', {
                  name: `${eligibleStudent.studentFirstName} ${eligibleStudent.studentLastName}`,
                })}
              </p>
            )}
            {catalog.allowAlreadyHasClothingSkip && (
              <label className="admin-form__checkbox">
                <input
                  type="checkbox"
                  checked={form.alreadyHasClothing}
                  disabled={formDisabled}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      alreadyHasClothing: event.target.checked,
                    })
                  }
                />
                <span>{t('publicClothing.alreadyHas')}</span>
              </label>
            )}
          </div>
        )}

        {currentStepId === 'items' && (
          <div className="wizard-fields wizard-fields--compact">
            {eligibleStudent && (
              <p className="wizard-hint">
                {t('publicClothing.eligibleFor', {
                  name: `${eligibleStudent.studentFirstName} ${eligibleStudent.studentLastName}`,
                })}
              </p>
            )}
            <div className="wizard-kit-grid">
              <KitFields
                title={t('clothingOrders.shortKit')}
                price={catalog.shortKitPrice}
                quantity={form.shortKitQuantity}
                size={form.shortKitSize}
                disabled={formDisabled}
                onQuantityChange={(value) =>
                  setForm({ ...form, shortKitQuantity: value })
                }
                onSizeChange={(value) =>
                  setForm({ ...form, shortKitSize: value })
                }
              />
              <KitFields
                title={t('clothingOrders.longKit')}
                price={catalog.longKitPrice}
                quantity={form.longKitQuantity}
                size={form.longKitSize}
                disabled={formDisabled}
                onQuantityChange={(value) =>
                  setForm({ ...form, longKitQuantity: value })
                }
                onSizeChange={(value) =>
                  setForm({ ...form, longKitSize: value })
                }
              />
              <KitFields
                title={t('clothingOrders.hoodie')}
                price={catalog.hoodiePrice}
                quantity={form.hoodieQuantity}
                size={form.hoodieSize}
                disabled={formDisabled}
                onQuantityChange={(value) =>
                  setForm({ ...form, hoodieQuantity: value })
                }
                onSizeChange={(value) =>
                  setForm({ ...form, hoodieSize: value })
                }
              />
            </div>
            <label className="admin-form__field">
              <span>{t('publicClothing.printedNumber')}</span>
              <input
                type="number"
                min={0}
                max={99}
                required
                value={form.shirtNumber}
                onChange={(event) =>
                  setForm({ ...form, shirtNumber: event.target.value })
                }
                disabled={formDisabled}
              />
            </label>
          </div>
        )}
      </form>
    </WizardShell>
  )
}

function KitFields({
  title,
  price,
  quantity,
  size,
  disabled,
  onQuantityChange,
  onSizeChange,
}: {
  title: string
  price: number | null
  quantity: string
  size: string
  disabled: boolean
  onQuantityChange: (value: string) => void
  onSizeChange: (value: string) => void
}) {
  const qty = parseQuantity(quantity)

  return (
    <fieldset className="wizard-kit">
      <legend>
        {title}
        {price != null && (
          <span className="wizard-kit__price">
            {' '}
            · {t('publicClothing.priceAmount', { amount: price })}
          </span>
        )}
      </legend>
      <div className="wizard-fields__row">
        <label className="admin-form__field">
          <span>{t('clothingOrders.quantity')}</span>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(event) => onQuantityChange(event.target.value)}
            required
            disabled={disabled}
          />
        </label>
        <label className="admin-form__field">
          <span>{t('clothingOrders.size')}</span>
          <select
            value={size}
            onChange={(event) => onSizeChange(event.target.value)}
            required={qty > 0}
            disabled={disabled || qty === 0}
          >
            <option value="">{t('clothingOrders.selectSize')}</option>
            {CLOTHING_SIZES.map((value) => (
              <option key={value} value={value}>
                {clothingSizeLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  )
}
