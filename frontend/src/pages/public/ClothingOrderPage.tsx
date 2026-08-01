import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  createClothingOrder,
  type ClothingOrderRequest,
  type ClothingOrderResponse,
} from '../../api/clothingOrders'
import { formatApiError } from '../../api/formatApiError'
import { getActiveSeason } from '../../api/publicCatalog'
import type { SeasonResponse } from '../../api/seasons'
import { clothingSizeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import { CLOTHING_SIZES, type ClothingSize } from '../../types/enums'

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

function parseQuantity(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function buildRequest(form: FormState, seasonId: number): ClothingOrderRequest {
  if (form.alreadyHasClothing) {
    return {
      studentIdentityNumber: form.studentIdentityNumber.trim(),
      seasonId,
      alreadyHasClothing: true,
    }
  }

  const shortKitQuantity = parseQuantity(form.shortKitQuantity)
  const longKitQuantity = parseQuantity(form.longKitQuantity)
  const hoodieQuantity = parseQuantity(form.hoodieQuantity)

  return {
    studentIdentityNumber: form.studentIdentityNumber.trim(),
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
    shirtNumber:
      form.shirtNumber.trim() === '' ? null : Number(form.shirtNumber),
  }
}

export function ClothingOrderPage() {
  const [season, setSeason] = useState<SeasonResponse | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ClothingOrderResponse | null>(null)

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
          setCatalogError(formatApiError(err))
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!season) {
      setError(catalogError ?? t('publicClothing.noActiveSeason'))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await createClothingOrder(buildRequest(form, season.id))
      setSuccess(response)
      setForm(emptyForm)
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
          <h1>{t('publicClothing.title')}</h1>
          <p className="admin-page__ok">
            {success.alreadyHasClothing
              ? t('publicClothing.successSkip')
              : t('publicClothing.successOrder')}
          </p>
          <p>
            {t('publicClothing.orderId')}: <strong>{success.id}</strong>
          </p>
          <p>{t('publicClothing.successHint')}</p>
          <p>
            <Link to="/">{t('common.backHome')}</Link>
            {' · '}
            <button type="button" onClick={() => setSuccess(null)}>
              {t('publicClothing.orderAnother')}
            </button>
          </p>
        </div>
      </section>
    )
  }

  const formDisabled = catalogLoading || !season || submitting

  return (
    <section className="public-page">
      <div className="public-page__panel admin-page">
      <h1>{t('publicClothing.title')}</h1>
      <p>{t('publicClothing.intro')}</p>
      <p className="clothing-order-form__hint">{t('publicClothing.approvedHint')}</p>

      {catalogLoading && <p>{t('common.loading')}</p>}
      {catalogError && <p className="admin-page__error">{catalogError}</p>}
      {!catalogLoading && !season && !catalogError && (
        <p className="admin-page__error">{t('publicClothing.noActiveSeason')}</p>
      )}
      {error && <p className="admin-page__error">{error}</p>}

      {season && (
        <p>
          {t('publicClothing.season')}: <strong>{season.name}</strong>
        </p>
      )}

      <form
        className="admin-form clothing-order-form registration-form"
        onSubmit={handleSubmit}
      >
        <label className="admin-form__field">
          <span>{t('publicClothing.identity')}</span>
          <input
            value={form.studentIdentityNumber}
            onChange={(event) =>
              setForm({ ...form, studentIdentityNumber: event.target.value })
            }
            required
            disabled={formDisabled}
          />
        </label>

        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={form.alreadyHasClothing}
            onChange={(event) =>
              setForm({ ...form, alreadyHasClothing: event.target.checked })
            }
            disabled={formDisabled}
          />
          <span>{t('publicClothing.alreadyHas')}</span>
        </label>

        {!form.alreadyHasClothing && (
          <>
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
              onSizeChange={(value) => setForm({ ...form, longKitSize: value })}
            />
            <KitFields
              title={t('clothingOrders.hoodie')}
              quantity={form.hoodieQuantity}
              size={form.hoodieSize}
              disabled={formDisabled}
              onQuantityChange={(value) =>
                setForm({ ...form, hoodieQuantity: value })
              }
              onSizeChange={(value) => setForm({ ...form, hoodieSize: value })}
            />
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
          </>
        )}

        <div className="admin-form__actions">
          <button type="submit" disabled={formDisabled}>
            {submitting
              ? t('publicClothing.submitting')
              : t('publicClothing.submit')}
          </button>
          <Link to="/">{t('registration.cancel')}</Link>
        </div>
      </form>
      </div>
    </section>
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
    <fieldset className="clothing-order-form__kit">
      <legend>{title}</legend>
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
    </fieldset>
  )
}
