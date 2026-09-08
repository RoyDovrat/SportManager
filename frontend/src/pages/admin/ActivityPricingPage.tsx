import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  createActivityPricing,
  listActivityPricingBySeason,
  updateActivityPricing,
  type ActivityPricingResponse,
} from '../../api/activityPricing'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import { NavIcon } from '../../components/ui/NavIcon'
import { FilterClearButton } from '../../components/ui/FilterClearButton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import {
  activityTypeLabel,
  swimmingLessonTypeLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import {
  ACTIVITY_TYPES,
  SWIMMING_LESSON_TYPES,
  type ActivityType,
  type SwimmingLessonType,
} from '../../types/enums'

const FOOTBALL_WEEKLY_OPTIONS = [1, 2] as const

const FILTER_DEFAULTS = {
  seasonId: '',
}

type FormState = {
  activityType: ActivityType
  swimmingLessonType: SwimmingLessonType
  weeklySessions: string
  monthlyPrice: string
}

const emptyForm: FormState = {
  activityType: 'FOOTBALL',
  swimmingLessonType: 'GROUP',
  weeklySessions: '1',
  monthlyPrice: '',
}

function formatPrice(amount: number): string {
  return `₪${amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export function ActivityPricingPage() {
  const { filters, setFilter, hasParam } = useUrlFilters(FILTER_DEFAULTS)
  const selectedSeasonId =
    filters.seasonId === '' ? '' : Number(filters.seasonId)
  const formRef = useRef<HTMLDivElement>(null)

  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [rows, setRows] = useState<ActivityPricingResponse[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activityTypeFilter, setActivityTypeFilter] = useState('')
  const [weeklyFilter, setWeeklyFilter] = useState('')

  const formOpen = creating || editingId !== null
  const isFootball = form.activityType === 'FOOTBALL'

  async function loadSeasons() {
    setLoadingSeasons(true)
    setError(null)
    try {
      const data = await listSeasons()
      setSeasons(data)
      if (!hasParam('seasonId')) {
        const active = data.find((season) => season.isActive)
        if (active) {
          setFilter('seasonId', String(active.id))
        } else if (data.length > 0) {
          setFilter('seasonId', String(data[0].id))
        }
      }
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoadingSeasons(false)
    }
  }

  async function loadPricing(seasonId: number) {
    setLoadingRows(true)
    setError(null)
    try {
      const data = await listActivityPricingBySeason(seasonId)
      setRows(data)
    } catch (err) {
      setError(formatApiError(err))
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }

  useEffect(() => {
    void loadSeasons()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load seasons once on mount
  }, [])

  useEffect(() => {
    if (typeof selectedSeasonId === 'number' && !Number.isNaN(selectedSeasonId)) {
      void loadPricing(selectedSeasonId)
    } else {
      setRows([])
    }
  }, [selectedSeasonId])

  useEffect(() => {
    if (!formOpen) {
      return
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [formOpen, editingId])

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function closeForm() {
    setCreating(false)
    resetForm()
    setMessage(null)
    setError(null)
  }

  function toggleForm() {
    if (formOpen) {
      closeForm()
      return
    }
    resetForm()
    setCreating(true)
    setMessage(null)
    setError(null)
  }

  function startEdit(row: ActivityPricingResponse) {
    setCreating(false)
    setEditingId(row.id)
    setForm({
      activityType: row.activityType,
      swimmingLessonType: row.swimmingLessonType ?? 'GROUP',
      weeklySessions: row.weeklySessions?.toString() ?? '1',
      monthlyPrice: String(row.monthlyPrice),
    })
    setMessage(null)
    setError(null)
  }

  function resetFilters() {
    setSearch('')
    setActivityTypeFilter('')
    setWeeklyFilter('')
  }

  function handleActivityTypeChange(nextType: ActivityType) {
    setForm({
      ...form,
      activityType: nextType,
      weeklySessions: '1',
    })
    const matching =
      seasons.find(
        (season) => season.isActive && season.activityType === nextType,
      ) ?? seasons.find((season) => season.activityType === nextType)
    if (matching) {
      setFilter('seasonId', String(matching.id))
      setEditingId(null)
    }
  }

  function showFormError(messageText: string) {
    setError(messageText)
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (typeof selectedSeasonId !== 'number') {
      showFormError(t('activityPricing.selectSeasonFirst'))
      return
    }

    if (editingId === null) {
      const selectedSeason = seasons.find((season) => season.id === selectedSeasonId)
      if (
        selectedSeason?.activityType != null &&
        selectedSeason.activityType !== form.activityType
      ) {
        showFormError(
          t('activityPricing.seasonActivityMismatch', {
            seasonSport: activityTypeLabel(selectedSeason.activityType),
            pricingSport: activityTypeLabel(form.activityType),
          }),
        )
        return
      }
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    const monthlyPrice = Number(form.monthlyPrice)
    const weeklySessions =
      form.activityType === 'SWIMMING' ? 1 : Number(form.weeklySessions)

    try {
      if (editingId === null) {
        await createActivityPricing({
          seasonId: selectedSeasonId,
          activityType: form.activityType,
          swimmingLessonType:
            form.activityType === 'SWIMMING' ? form.swimmingLessonType : null,
          weeklySessions,
          monthlyPrice,
        })
        setMessage(t('activityPricing.created'))
      } else {
        await updateActivityPricing(editingId, {
          monthlyPrice,
          weeklySessions: form.activityType === 'SWIMMING' ? 1 : weeklySessions,
        })
        setMessage(t('activityPricing.updated'))
      }
      setCreating(false)
      resetForm()
      await loadPricing(selectedSeasonId)
    } catch (err) {
      showFormError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const visibleRows = useMemo(() => {
    const query = search.trim()
    return rows.filter((row) => {
      if (activityTypeFilter !== '' && row.activityType !== activityTypeFilter) {
        return false
      }
      if (weeklyFilter !== '') {
        if (row.activityType !== 'FOOTBALL') {
          return false
        }
        if (String(row.weeklySessions ?? '') !== weeklyFilter) {
          return false
        }
      }
      if (query) {
        const haystack = [
          activityTypeLabel(row.activityType),
          row.swimmingLessonType
            ? swimmingLessonTypeLabel(row.swimmingLessonType)
            : '',
          String(row.monthlyPrice),
        ].join(' ')
        if (!haystack.includes(query)) {
          return false
        }
      }
      return true
    })
  }, [activityTypeFilter, rows, search, weeklyFilter])

  const filtersActive =
    search.trim() !== '' || activityTypeFilter !== '' || weeklyFilter !== ''
  const selectedSeason = seasons.find(
    (season) => String(season.id) === filters.seasonId,
  )

  return (
    <section className="admin-page admin-page--wide seasons-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('activityPricing.title')}</h1>
          <p className="admin-page__lede">{t('activityPricing.intro')}</p>
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
              {t('activityPricing.season')}
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
                  <option value="">{t('activityPricing.noSeasons')}</option>
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
            {formOpen ? t('activityPricing.closeCreate') : t('activityPricing.newPrice')}
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
          <form className="admin-form seasons-form" onSubmit={handleSubmit}>
            <div className="seasons-card-head">
              <span className="seasons-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <div>
                <h2>
                  {editingId === null
                    ? t('activityPricing.createTitle')
                    : t('activityPricing.editTitle')}
                </h2>
                <p>
                  {editingId === null
                    ? t('activityPricing.createSubtitle')
                    : t('activityPricing.editSubtitle')}
                </p>
              </div>
            </div>

            <div className="seasons-form-grid">
              <label className="admin-form__field">
                <span>{t('activities.activityType')}</span>
                <select
                  value={form.activityType}
                  onChange={(event) =>
                    handleActivityTypeChange(event.target.value as ActivityType)
                  }
                  disabled={editingId !== null}
                >
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {activityTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-form__field">
                <span>{t('activityPricing.weeklySessions')}</span>
                <select
                  value={form.weeklySessions}
                  onChange={(event) =>
                    setForm({ ...form, weeklySessions: event.target.value })
                  }
                  required={isFootball}
                  disabled={!isFootball}
                >
                  {FOOTBALL_WEEKLY_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-form__field">
                <span>
                  {isFootball
                    ? t('activityPricing.monthlyPrice')
                    : t('activityPricing.unitPrice')}
                </span>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.monthlyPrice}
                  onChange={(event) =>
                    setForm({ ...form, monthlyPrice: event.target.value })
                  }
                  required
                />
              </label>

              <label className="admin-form__field">
                <span>{t('activityPricing.lessonType')}</span>
                <select
                  value={form.swimmingLessonType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      swimmingLessonType: event.target.value as SwimmingLessonType,
                      weeklySessions: '1',
                    })
                  }
                  disabled={isFootball || editingId !== null}
                >
                  {SWIMMING_LESSON_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {swimmingLessonTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="seasons-form__footer">
              <div className="admin-form__actions">
                <button
                  type="submit"
                  disabled={saving || typeof selectedSeasonId !== 'number'}
                >
                  {saving
                    ? t('common.saving')
                    : editingId === null
                      ? t('common.create')
                      : t('common.save')}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={editingId === null ? resetForm : closeForm}
                  disabled={saving}
                >
                  {editingId === null
                    ? t('activityPricing.clearForm')
                    : t('common.cancelEdit')}
                </button>
              </div>
            </div>
          </form>

          <aside
            className="seasons-instructions"
            aria-labelledby="pricing-instructions-title"
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
                <h2 id="pricing-instructions-title">
                  {t('activityPricing.instructionsTitle')}
                </h2>
                <p>{t('activityPricing.instructionsIntro')}</p>
              </div>
            </div>
            <ul className="seasons-instructions__list">
              <li>{t('activityPricing.tipByType')}</li>
              <li>{t('activityPricing.tipFootball')}</li>
              <li>{t('activityPricing.tipSwimming')}</li>
              <li>{t('activityPricing.tipSeasonMatch')}</li>
            </ul>
            <div className="pricing-plans-count">
              <strong>{rows.length}</strong>
              <span>{t('activityPricing.plansInSeason')}</span>
            </div>
          </aside>
        </div>
      )}

      <div className="admin-filters seasons-filters">
        <label className="admin-form__field seasons-filters__search">
          <span>{t('common.type')}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('activityPricing.searchPlaceholder')}
          />
        </label>

        <label className="admin-form__field seasons-filters__type">
          <span>{t('activities.activityType')}</span>
          <select
            value={activityTypeFilter}
            onChange={(event) => setActivityTypeFilter(event.target.value)}
          >
            <option value="">{t('activityPricing.allActivityTypes')}</option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {activityTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field seasons-filters__type">
          <span>{t('activityPricing.weeklySessions')}</span>
          <select
            value={weeklyFilter}
            onChange={(event) => setWeeklyFilter(event.target.value)}
          >
            <option value="">{t('activityPricing.allWeeklySessions')}</option>
            {FOOTBALL_WEEKLY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <FilterClearButton
          onClick={resetFilters}
          disabled={!filtersActive}
        >
          {t('activityPricing.resetFilters')}
        </FilterClearButton>
      </div>

      <div className="admin-table-wrap">
        <div className="seasons-table-head">
          <h2>{t('activityPricing.forSeason')}</h2>
          {!loadingRows && rows.length > 0 && (
            <p className="seasons-table-count">
              {t('activityPricing.showingCount', {
                shown: visibleRows.length,
                total: rows.length,
              })}
            </p>
          )}
        </div>
        {loadingRows ? (
          <p className="admin-page__loading">{t('activityPricing.loading')}</p>
        ) : typeof selectedSeasonId !== 'number' ? (
          <p className="dashboard-empty">{t('activityPricing.selectSeason')}</p>
        ) : rows.length === 0 ? (
          <p className="dashboard-empty">{t('activityPricing.empty')}</p>
        ) : visibleRows.length === 0 ? (
          <p className="dashboard-empty">{t('activityPricing.emptyFiltered')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('activities.activityType')}</th>
                <th>{t('activityPricing.lessonType')}</th>
                <th>{t('activityPricing.weeklySessions')}</th>
                <th>{t('activityPricing.priceColumn')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    editingId === row.id ? 'seasons-row--editing' : undefined
                  }
                >
                  <td>{row.id}</td>
                  <td>{activityTypeLabel(row.activityType)}</td>
                  <td>
                    {row.swimmingLessonType
                      ? swimmingLessonTypeLabel(row.swimmingLessonType)
                      : '—'}
                  </td>
                  <td>
                    {row.activityType === 'FOOTBALL'
                      ? (row.weeklySessions ?? '—')
                      : '—'}
                  </td>
                  <td>{formatPrice(row.monthlyPrice)}</td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="reg-action reg-action--edit"
                      onClick={() => startEdit(row)}
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
