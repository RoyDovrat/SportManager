import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  createClothingOrder,
  type ClothingOrderRequest,
  type ClothingOrderResponse,
} from '../../api/clothingOrders'
import { formatPublicApiError } from '../../api/formatPublicApiError'
import { getActiveSeason } from '../../api/publicCatalog'
import type { SeasonResponse } from '../../api/seasons'
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
  return null
}

export function ClothingOrderPage() {
  const [season, setSeason] = useState<SeasonResponse | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ClothingOrderResponse | null>(null)

  const steps = STEP_DEFS.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }))

  useEffect(() => {
    let cancelled = false

    async function loadSeason() {
      setCatalogLoading(true)
      setCatalogError(null)
      try {
        const active = await getActiveSeason()
        if (!cancelled) {
          setSeason(active)
        }
      } catch (err) {
        if (!cancelled) {
          setSeason(null)
          setCatalogError(formatPublicApiError(err))
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false)
        }
      }
    }

    void loadSeason()
    return () => {
      cancelled = true
    }
  }, [])

  async function submitOrder() {
    if (!season) {
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
      const response = await createClothingOrder(buildRequest(form, season.id))
      setSuccess(response)
      setForm(emptyForm)
      setStep(2)
    } catch (err) {
      setError(formatPublicApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  function goNext() {
    setError(null)
    if (step === 0) {
      const identityError = validateIdentity(form)
      if (identityError) {
        setError(identityError)
        return
      }
      if (form.alreadyHasClothing) {
        void submitOrder()
        return
      }
      setStep(1)
      return
    }
    if (step === 1) {
      void submitOrder()
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    goNext()
  }

  function resetWizard() {
    setSuccess(null)
    setStep(0)
    setError(null)
  }

  if (catalogLoading) {
    return (
      <WizardShell
        title={t('publicClothing.title')}
        steps={steps}
        currentIndex={0}
        footer={<Link to="/">{t('registration.cancel')}</Link>}
      >
        <p>{t('common.loading')}</p>
      </WizardShell>
    )
  }

  if (!season) {
    return (
      <WizardShell
        title={t('publicClothing.title')}
        steps={steps}
        currentIndex={0}
        showStepper={false}
        error={catalogError}
        footer={<Link to="/" className="btn">{t('common.backHome')}</Link>}
      >
        <p>{catalogError ?? t('publicClothing.noActiveSeason')}</p>
      </WizardShell>
    )
  }

  if (success && step === 2) {
    return (
      <WizardShell
        title={t('publicClothing.title')}
        steps={steps}
        currentIndex={2}
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
          <button type="button" className="btn btn--secondary" onClick={resetWizard}>
            {t('publicClothing.orderAnother')}
          </button>
        </div>
      </WizardShell>
    )
  }

  const formDisabled = submitting

  return (
    <WizardShell
      title={t('publicClothing.title')}
      subtitle={`${t('publicClothing.season')}: ${season.name}`}
      steps={steps}
      currentIndex={step}
      error={error}
      footer={
        <>
          {step > 0 ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setError(null)
                setStep(0)
              }}
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
            form="clothing-wizard-form"
            className="btn"
            disabled={formDisabled}
          >
            {step === 0 && form.alreadyHasClothing
              ? submitting
                ? t('publicClothing.submitting')
                : t('publicClothing.submit')
              : step === 1
                ? submitting
                  ? t('publicClothing.submitting')
                  : t('publicClothing.submit')
                : t('wizard.continue')}
          </button>
        </>
      }
    >
      <form id="clothing-wizard-form" onSubmit={handleSubmit} noValidate>
        {step === 0 && (
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
                placeholder=""
                maxLength={12}
              />
            </label>
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
          </div>
        )}

        {step === 1 && (
          <div className="wizard-fields wizard-fields--compact">
            <div className="wizard-kit-grid">
              <KitFields
                title={t('clothingOrders.shortKit')}
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
              <span>{t('clothingOrders.shirtNumber')}</span>
              <input
                type="number"
                min={0}
                max={99}
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
  quantity,
  size,
  disabled,
  onQuantityChange,
  onSizeChange,
}: {
  title: string
  quantity: string
  size: string
  disabled: boolean
  onQuantityChange: (value: string) => void
  onSizeChange: (value: string) => void
}) {
  const qty = parseQuantity(quantity)

  return (
    <fieldset className="wizard-kit">
      <legend>{title}</legend>
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
