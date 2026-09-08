import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
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
import { NavIcon } from '../../components/ui/NavIcon'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useUrlFilters } from '../../hooks/useUrlFilters'
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

function formatPrice(amount: number): string {
  return `₪${amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function formFromPricing(pricing: ClothingPricingResponse): PriceForm {
  const longKitEnabled = pricing.longKitPublicEnabled !== false
  const hoodieEnabled = pricing.hoodiePublicEnabled !== false
  return {
    shortKitPrice: String(pricing.shortKitPrice),
    longKitPrice:
      longKitEnabled && pricing.longKitPrice > 0
        ? String(pricing.longKitPrice)
        : '',
    hoodiePrice:
      hoodieEnabled && pricing.hoodiePrice > 0
        ? String(pricing.hoodiePrice)
        : '',
    allowAlreadyHasClothingSkip: pricing.allowAlreadyHasClothingSkip !== false,
    longKitPublicEnabled: longKitEnabled,
    hoodiePublicEnabled: hoodieEnabled,
  }
}

export function ClothingPricingPage() {
  const { filters, setFilter, hasParam } = useUrlFilters(FILTER_DEFAULTS)
  const selectedSeasonId =
    filters.seasonId === '' ? '' : Number(filters.seasonId)

  const formRef = useRef<HTMLDivElement>(null)
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [allPricing, setAllPricing] = useState<ClothingPricingResponse[]>([])
  const [current, setCurrent] = useState<ClothingPricingResponse | null>(null)
  const [form, setForm] = useState<PriceForm>(emptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const [loadingCurrent, setLoadingCurrent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const selectedSeason = seasons.find(
    (season) => String(season.id) === filters.seasonId,
  )

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

    try {
      const pricing = await getClothingPricingBySeason(seasonId)
      setCurrent(pricing)
      setForm(formFromPricing(pricing))
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

  function closeForm() {
    setFormOpen(false)
    setError(null)
  }

  function toggleForm() {
    if (formOpen) {
      closeForm()
      return
    }
    setFormOpen(true)
    setMessage(null)
    setError(null)
  }

  function editPricingRow(row: ClothingPricingResponse) {
    setFilter('seasonId', String(row.seasonId))
    setFormOpen(true)
    setMessage(null)
    setError(null)
  }

  function resetFormFields() {
    if (current) {
      setForm(formFromPricing(current))
    } else {
      setForm(emptyForm)
    }
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

  useEffect(() => {
    if (!formOpen) {
      return
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [formOpen, selectedSeasonId])

  function showFormError(messageText: string) {
    setError(messageText)
    setFormOpen(true)
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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
      setFormOpen(false)
    } catch (err) {
      showFormError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const visibleRows = useMemo(() => {
    const query = search.trim()
    if (!query) {
      return allPricing
    }
    return allPricing.filter((row) => row.seasonName.includes(query))
  }, [allPricing, search])

  const heroButtonLabel = formOpen
    ? t('clothingPricing.closeCreate')
    : current
      ? t('clothingPricing.editPricing')
      : t('clothingPricing.newPricing')

  return (
    <section className="admin-page admin-page--wide seasons-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('clothingPricing.title')}</h1>
          <p className="admin-page__lede">{t('clothingPricing.intro')}</p>
        </div>
        <div className="seasons-hero-meta">
          <label
            className={
              selectedSeason?.isActive
                ? 'seasons-active-chip seasons-active-chip--on pricing-season-picker'
                : 'seasons-active-chip pricing-season-picker'
            }
          >
            <span className="seasons-active-chip__label">
              <NavIcon name="seasons" />
              {t('clothingPricing.season')}
            </span>
            <div className="seasons-active-chip__row">
              <select
                className="pricing-season-picker__select"
                value={filters.seasonId}
                onChange={(event) => {
                  setFilter('seasonId', event.target.value)
                  closeForm()
                }}
                disabled={loadingSeasons || seasons.length === 0}
              >
                {seasons.length === 0 ? (
                  <option value="">{t('clothingPricing.noSeasons')}</option>
                ) : (
                  seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                      {season.isActive ? ` · ${t('common.active')}` : ''}
                    </option>
                  ))
                )}
              </select>
              {selectedSeason?.isActive && (
                <StatusBadge tone="success">{t('common.active')}</StatusBadge>
              )}
            </div>
          </label>
          <button
            type="button"
            className="reg-action reg-action--approve"
            onClick={toggleForm}
          >
            {heroButtonLabel}
          </button>
        </div>
      </header>

      {message && <p className="admin-page__ok">{message}</p>}
      {error && (
        <p className="admin-page__error" role="alert">
          {error}
        </p>
      )}

      {formOpen && (
        <div ref={formRef} className="seasons-editor">
          <form className="admin-form seasons-form clothing-pricing-form" onSubmit={handleSubmit}>
            <div className="seasons-card-head">
              <span className="seasons-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <div>
                <h2>
                  {loadingCurrent
                    ? t('clothingPricing.loading')
                    : current
                      ? t('clothingPricing.editTitle')
                      : t('clothingPricing.createTitle')}
                </h2>
                <p>
                  {current
                    ? t('clothingPricing.editSubtitle')
                    : t('clothingPricing.createSubtitle')}
                </p>
              </div>
            </div>

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

            <div className="seasons-form__footer">
              <div className="admin-form__actions">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingCurrent ||
                    typeof selectedSeasonId !== 'number'
                  }
                >
                  {saving
                    ? t('common.saving')
                    : current
                      ? t('common.save')
                      : t('common.create')}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={resetFormFields}
                  disabled={saving || loadingCurrent}
                >
                  {t('clothingPricing.clearForm')}
                </button>
              </div>
            </div>
          </form>

          <aside
            className="seasons-instructions"
            aria-labelledby="clothing-instructions-title"
          >
            <div className="seasons-card-head">
              <span className="seasons-card-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="M12 11v7" />
                  <circle cx="12" cy="7" r="1.15" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <div>
                <h2 id="clothing-instructions-title">
                  {t('clothingPricing.instructionsTitle')}
                </h2>
                <p>{t('clothingPricing.instructionsIntro')}</p>
              </div>
            </div>
            <ul className="seasons-instructions__list">
              <li>{t('clothingPricing.tipFootballOnly')}</li>
              <li>{t('clothingPricing.tipShortAlways')}</li>
              <li>{t('clothingPricing.tipHideOptional')}</li>
              <li>{t('clothingPricing.tipAlreadyHas')}</li>
            </ul>
          </aside>
        </div>
      )}

      <div className="admin-filters seasons-filters">
        <label className="admin-form__field seasons-filters__search">
          <span>{t('clothingPricing.season')}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('clothingPricing.searchPlaceholder')}
          />
        </label>
        <button
          type="button"
          className="btn btn--secondary seasons-filters__reset"
          onClick={() => setSearch('')}
          disabled={search.trim() === ''}
        >
          {t('clothingPricing.resetFilters')}
        </button>
      </div>

      <div className="admin-table-wrap">
        <div className="seasons-table-head">
          <h2>{t('clothingPricing.all')}</h2>
          {allPricing.length > 0 && (
            <p className="seasons-table-count">
              {t('clothingPricing.showingCount', {
                shown: visibleRows.length,
                total: allPricing.length,
              })}
            </p>
          )}
        </div>
        {allPricing.length === 0 ? (
          <p className="dashboard-empty">{t('clothingPricing.empty')}</p>
        ) : visibleRows.length === 0 ? (
          <p className="dashboard-empty">{t('clothingPricing.emptyFiltered')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('clothingPricing.season')}</th>
                <th>{t('clothingPricing.shortKit')}</th>
                <th>{t('clothingPricing.longKit')}</th>
                <th>{t('clothingPricing.hoodie')}</th>
                <th>{t('clothingPricing.publicColumn')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    current?.id === row.id && formOpen
                      ? 'seasons-row--editing'
                      : undefined
                  }
                >
                  <td>{row.id}</td>
                  <td>{row.seasonName}</td>
                  <td>{formatPrice(row.shortKitPrice)}</td>
                  <td>
                    {row.longKitPublicEnabled === false
                      ? '—'
                      : formatPrice(row.longKitPrice)}
                  </td>
                  <td>
                    {row.hoodiePublicEnabled === false
                      ? '—'
                      : formatPrice(row.hoodiePrice)}
                  </td>
                  <td>
                    <div className="clothing-visibility-pills">
                      <StatusBadge
                        tone={
                          row.longKitPublicEnabled !== false ? 'success' : 'neutral'
                        }
                      >
                        {row.longKitPublicEnabled !== false
                          ? t('clothingPricing.longKitShown')
                          : t('clothingPricing.longKitHidden')}
                      </StatusBadge>
                      <StatusBadge
                        tone={
                          row.hoodiePublicEnabled !== false ? 'success' : 'neutral'
                        }
                      >
                        {row.hoodiePublicEnabled !== false
                          ? t('clothingPricing.hoodieShown')
                          : t('clothingPricing.hoodieHidden')}
                      </StatusBadge>
                      <StatusBadge
                        tone={
                          row.allowAlreadyHasClothingSkip !== false
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {row.allowAlreadyHasClothingSkip !== false
                          ? t('clothingPricing.skipShown')
                          : t('clothingPricing.skipHidden')}
                      </StatusBadge>
                    </div>
                  </td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="reg-action reg-action--edit"
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
