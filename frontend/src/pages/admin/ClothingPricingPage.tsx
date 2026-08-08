import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../../api'
import {
  createClothingPricing,
  getClothingPricingBySeason,
  listClothingPricing,
  updateClothingPricing,
  type ClothingPricingResponse,
} from '../../api/clothingPricing'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { activityTypeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'

const FILTER_DEFAULTS = {
  seasonId: '',
}

type PriceForm = {
  shortKitPrice: string
  longKitPrice: string
  hoodiePrice: string
  allowAlreadyHasClothingSkip: boolean
  longKitPublicEnabled: boolean
  hoodiePublicEnabled: boolean
}

const emptyForm: PriceForm = {
  shortKitPrice: '',
  longKitPrice: '',
  hoodiePrice: '',
  allowAlreadyHasClothingSkip: true,
  longKitPublicEnabled: true,
  hoodiePublicEnabled: true,
}

export function ClothingPricingPage() {
  const { filters, setFilter, hasParam } = useUrlFilters(FILTER_DEFAULTS)
  const selectedSeasonId =
    filters.seasonId === '' ? '' : Number(filters.seasonId)

  const formSectionRef = useRef<HTMLFormElement | null>(null)
  const formErrorRef = useRef<HTMLParagraphElement | null>(null)
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [allPricing, setAllPricing] = useState<ClothingPricingResponse[]>([])
  const [current, setCurrent] = useState<ClothingPricingResponse | null>(null)
  const [form, setForm] = useState<PriceForm>(emptyForm)
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const [loadingCurrent, setLoadingCurrent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadSeasonsAndList() {
    setLoadingSeasons(true)
    setError(null)
    try {
      const [seasonData, pricingData] = await Promise.all([
        listSeasons(),
        listClothingPricing(),
      ])
      const footballSeasons = seasonData.filter(
        (season) => season.activityType === 'FOOTBALL',
      )
      setSeasons(footballSeasons)
      setAllPricing(pricingData)

      if (!hasParam('seasonId')) {
        const active = footballSeasons.find((season) => season.isActive)
        if (active) {
          setFilter('seasonId', String(active.id))
        } else if (footballSeasons.length > 0) {
          setFilter('seasonId', String(footballSeasons[0].id))
        }
      }
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoadingSeasons(false)
    }
  }

  async function loadCurrentForSeason(seasonId: number) {
    setLoadingCurrent(true)
    setError(null)
    setMessage(null)

    try {
      const pricing = await getClothingPricingBySeason(seasonId)
      setCurrent(pricing)
      const longKitEnabled = pricing.longKitPublicEnabled !== false
      const hoodieEnabled = pricing.hoodiePublicEnabled !== false
      setForm({
        shortKitPrice: String(pricing.shortKitPrice),
        longKitPrice:
          longKitEnabled && pricing.longKitPrice > 0
            ? String(pricing.longKitPrice)
            : '',
        hoodiePrice:
          hoodieEnabled && pricing.hoodiePrice > 0
            ? String(pricing.hoodiePrice)
            : '',
        allowAlreadyHasClothingSkip:
          pricing.allowAlreadyHasClothingSkip !== false,
        longKitPublicEnabled: longKitEnabled,
        hoodiePublicEnabled: hoodieEnabled,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setCurrent(null)
        setForm(emptyForm)
      } else {
        setError(formatApiError(err))
        setCurrent(null)
        setForm(emptyForm)
      }
    } finally {
      setLoadingCurrent(false)
    }
  }

  function editPricingRow(row: ClothingPricingResponse) {
    setFilter('seasonId', String(row.seasonId))
    void loadCurrentForSeason(row.seasonId)
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  useEffect(() => {
    void loadSeasonsAndList()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, [])

  useEffect(() => {
    if (typeof selectedSeasonId === 'number' && !Number.isNaN(selectedSeasonId)) {
      void loadCurrentForSeason(selectedSeasonId)
    } else {
      setCurrent(null)
      setForm(emptyForm)
    }
  }, [selectedSeasonId])

  function showFormError(messageText: string) {
    setError(messageText)
    requestAnimationFrame(() => {
      formErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (typeof selectedSeasonId !== 'number') {
      showFormError(t('clothingPricing.selectSeasonFirst'))
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    if (form.longKitPublicEnabled && !(Number(form.longKitPrice) > 0)) {
      showFormError(t('clothingPricing.longKitPriceRequired'))
      setSaving(false)
      return
    }
    if (form.hoodiePublicEnabled && !(Number(form.hoodiePrice) > 0)) {
      showFormError(t('clothingPricing.hoodiePriceRequired'))
      setSaving(false)
      return
    }

    const payload = {
      shortKitPrice: Number(form.shortKitPrice),
      longKitPrice: form.longKitPublicEnabled ? Number(form.longKitPrice) : 0,
      hoodiePrice: form.hoodiePublicEnabled ? Number(form.hoodiePrice) : 0,
      allowAlreadyHasClothingSkip: form.allowAlreadyHasClothingSkip,
      longKitPublicEnabled: form.longKitPublicEnabled,
      hoodiePublicEnabled: form.hoodiePublicEnabled,
    }

    try {
      if (current) {
        await updateClothingPricing(current.id, payload)
        setMessage(t('clothingPricing.updated'))
      } else {
        await createClothingPricing({
          seasonId: selectedSeasonId,
          ...payload,
        })
        setMessage(t('clothingPricing.created'))
      }

      const pricingData = await listClothingPricing()
      setAllPricing(pricingData)
      await loadCurrentForSeason(selectedSeasonId)
    } catch (err) {
      showFormError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-page admin-page--wide clothing-pricing-page">
      <header className="clothing-hero">
        <div>
          <h1>{t('clothingPricing.title')}</h1>
          <p className="admin-page__lede">{t('clothingPricing.intro')}</p>
        </div>
      </header>

      {message && <p className="admin-page__ok">{message}</p>}

      <label className="admin-form__field clothing-pricing-page__season">
        <span>{t('clothingPricing.season')}</span>
        <select
          value={filters.seasonId}
          onChange={(event) => setFilter('seasonId', event.target.value)}
          disabled={loadingSeasons || seasons.length === 0}
        >          {seasons.length === 0 ? (
            <option value="">{t('clothingPricing.noSeasons')}</option>
          ) : (
            seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} · {activityTypeLabel(season.activityType)}
                {season.isActive ? ` ${t('clothingPricing.activeSuffix')}` : ''}
              </option>
            ))
          )}
        </select>
      </label>

      <form
        ref={formSectionRef}
        className="admin-form clothing-pricing-form"
        onSubmit={handleSubmit}
      >
        <h2>
          {loadingCurrent
            ? t('clothingPricing.loading')
            : current
              ? t('clothingPricing.editTitle')
              : t('clothingPricing.createTitle')}
        </h2>

        <div className="clothing-pricing-form__grid">
          <label className="admin-form__field">
            <span>{t('clothingPricing.shortKit')}</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={form.shortKitPrice}
              onChange={(event) =>
                setForm({ ...form, shortKitPrice: event.target.value })
              }
              required
              disabled={loadingCurrent || typeof selectedSeasonId !== 'number'}
            />
          </label>

          <label className="admin-form__field">
            <span>{t('clothingPricing.longKit')}</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={form.longKitPrice}
              onChange={(event) =>
                setForm({ ...form, longKitPrice: event.target.value })
              }
              required={form.longKitPublicEnabled}
              disabled={
                loadingCurrent ||
                typeof selectedSeasonId !== 'number' ||
                !form.longKitPublicEnabled
              }
            />
            {!form.longKitPublicEnabled && (
              <span className="admin-form__hint">
                {t('clothingPricing.priceNotNeededWhenHidden')}
              </span>
            )}
          </label>

          <label className="admin-form__field">
            <span>{t('clothingPricing.hoodie')}</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={form.hoodiePrice}
              onChange={(event) =>
                setForm({ ...form, hoodiePrice: event.target.value })
              }
              required={form.hoodiePublicEnabled}
              disabled={
                loadingCurrent ||
                typeof selectedSeasonId !== 'number' ||
                !form.hoodiePublicEnabled
              }
            />
            {!form.hoodiePublicEnabled && (
              <span className="admin-form__hint">
                {t('clothingPricing.priceNotNeededWhenHidden')}
              </span>
            )}
          </label>
        </div>

        <fieldset className="clothing-pricing-form__visibility">
          <legend>{t('clothingPricing.publicVisibilityTitle')}</legend>
          <p className="admin-form__hint">
            {t('clothingPricing.shortKitAlwaysPublic')}
          </p>
          <label className="admin-form__checkbox">
            <input
              type="checkbox"
              checked={form.longKitPublicEnabled}
              disabled={loadingCurrent || typeof selectedSeasonId !== 'number'}
              onChange={(event) =>
                setForm({
                  ...form,
                  longKitPublicEnabled: event.target.checked,
                })
              }
            />
            <span>{t('clothingPricing.longKitPublicEnabled')}</span>
          </label>
          <label className="admin-form__checkbox">
            <input
              type="checkbox"
              checked={form.hoodiePublicEnabled}
              disabled={loadingCurrent || typeof selectedSeasonId !== 'number'}
              onChange={(event) =>
                setForm({
                  ...form,
                  hoodiePublicEnabled: event.target.checked,
                })
              }
            />
            <span>{t('clothingPricing.hoodiePublicEnabled')}</span>
          </label>
          <label className="admin-form__checkbox">
            <input
              type="checkbox"
              checked={form.allowAlreadyHasClothingSkip}
              disabled={loadingCurrent || typeof selectedSeasonId !== 'number'}
              onChange={(event) =>
                setForm({
                  ...form,
                  allowAlreadyHasClothingSkip: event.target.checked,
                })
              }
            />
            <span>{t('clothingPricing.allowAlreadyHasSkip')}</span>
          </label>
        </fieldset>

        {error && (
          <p ref={formErrorRef} className="admin-page__error" role="alert">
            {error}
          </p>
        )}

        <div className="admin-form__actions">
          <button
            type="submit"
            disabled={
              saving || loadingCurrent || typeof selectedSeasonId !== 'number'
            }
          >
            {saving
              ? t('common.saving')
              : current
                ? t('common.save')
                : t('common.create')}
          </button>
        </div>
      </form>

      <div className="admin-table-wrap">
        <h2>{t('clothingPricing.all')}</h2>
        {allPricing.length === 0 ? (
          <p className="dashboard-empty">{t('clothingPricing.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('clothingPricing.season')}</th>
                <th>{t('clothingPricing.shortKit')}</th>
                <th>{t('clothingPricing.longKit')}</th>
                <th>{t('clothingPricing.hoodie')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {allPricing.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.seasonName}</td>
                  <td>{row.shortKitPrice}</td>
                  <td>{row.longKitPrice}</td>
                  <td>{row.hoodiePrice}</td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="reg-action reg-action--open"
                      onClick={() => editPricingRow(row)}
                    >
                      {t('common.edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
