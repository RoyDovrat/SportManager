import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  activateSeason,
  createSeason,
  deactivateSeason,
  listSeasons,
  updateSeason,
  type SeasonRequest,
  type SeasonResponse,
} from '../../api/seasons'
import { formatApiError } from '../../api/formatApiError'
import { NavIcon } from '../../components/ui/NavIcon'
import { FilterClearButton } from '../../components/ui/FilterClearButton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { DateText } from '../../components/ui/DateText'
import { activityTypeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import { ACTIVITY_TYPES, type ActivityType } from '../../types/enums'

const emptyForm: SeasonRequest = {
  name: '',
  startDate: '',
  endDate: '',
  activityType: 'FOOTBALL',
  isActive: false,
}

export function SeasonsPage() {
  const formRef = useRef<HTMLDivElement>(null)
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [form, setForm] = useState<SeasonRequest>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activityTypeFilter, setActivityTypeFilter] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)

  const formOpen = creating || editingId !== null

  async function loadSeasons(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await listSeasons()
      setSeasons(data)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSeasons()
  }, [])

  useEffect(() => {
    if (!formOpen) {
      return
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [formOpen, editingId])

  function startEdit(season: SeasonResponse) {
    setCreating(false)
    setEditingId(season.id)
    setForm({
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      activityType: season.activityType,
      isActive: season.isActive,
    })
    setMessage(null)
    setError(null)
  }

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

  function resetFilters() {
    setSearch('')
    setActivityTypeFilter('')
    setActiveOnly(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      if (editingId === null) {
        await createSeason(form)
        setMessage(t('seasons.created'))
      } else {
        await updateSeason(editingId, form)
        setMessage(t('seasons.updated'))
      }
      setCreating(false)
      resetForm()
      await loadSeasons({ silent: true })
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate(seasonId: number) {
    setError(null)
    setMessage(null)
    try {
      await activateSeason(seasonId)
      setMessage(t('seasons.activated'))
      await loadSeasons({ silent: true })
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  async function handleDeactivate(seasonId: number) {
    setError(null)
    setMessage(null)
    try {
      await deactivateSeason(seasonId)
      setMessage(t('seasons.deactivated'))
      await loadSeasons({ silent: true })
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  const visibleSeasons = useMemo(() => {
    const query = search.trim()
    return seasons
      .filter((season) => {
        if (activityTypeFilter !== '' && season.activityType !== activityTypeFilter) {
          return false
        }
        if (activeOnly && !season.isActive) {
          return false
        }
        if (query && !season.name.includes(query)) {
          return false
        }
        return true
      })
      .sort((a, b) => a.id - b.id)
  }, [activeOnly, activityTypeFilter, search, seasons])

  const filtersActive =
    search.trim() !== '' || activityTypeFilter !== '' || activeOnly

  return (
    <section className="admin-page admin-page--wide seasons-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('seasons.title')}</h1>
          <p className="admin-page__lede">{t('seasons.intro')}</p>
        </div>
        <div className="seasons-hero-meta">
          <div className="seasons-active-list" aria-live="polite">
            {!loading &&
              ACTIVITY_TYPES.map((type) => {
                const active = seasons.find(
                  (season) => season.isActive && season.activityType === type,
                )
                return (
                  <div
                    key={type}
                    className={
                      active
                        ? 'seasons-active-chip seasons-active-chip--on'
                        : 'seasons-active-chip'
                    }
                  >
                    <span className="seasons-active-chip__label">
                      <NavIcon name="seasons" />
                      {t('seasons.activeNow')} · {activityTypeLabel(type)}
                    </span>
                    <div className="seasons-active-chip__row">
                      <strong>{active ? active.name : t('seasons.noActive')}</strong>
                      {active && (
                        <StatusBadge tone="success">{t('common.active')}</StatusBadge>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
          <button
            type="button"
            className="reg-action reg-action--approve"
            onClick={toggleForm}
          >
            {formOpen ? t('seasons.closeCreate') : t('seasons.newSeason')}
          </button>
        </div>
      </header>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

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
                    ? t('seasons.createTitle')
                    : t('seasons.editTitle')}
                </h2>
                <p>
                  {editingId === null
                    ? t('seasons.createSubtitle')
                    : t('seasons.editSubtitle')}
                </p>
              </div>
            </div>

            <div className="seasons-form-grid">
              <label className="admin-form__field">
                <span>{t('seasons.name')}</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder={t('seasons.namePlaceholder')}
                  required
                />
              </label>

              <label className="admin-form__field">
                <span>{t('seasons.activityType')}</span>
                <select
                  value={form.activityType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      activityType: event.target.value as ActivityType,
                    })
                  }
                  required
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
                <span>{t('seasons.startDate')}</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm({ ...form, startDate: event.target.value })
                  }
                  required
                />
              </label>

              <label className="admin-form__field">
                <span>{t('seasons.endDate')}</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm({ ...form, endDate: event.target.value })
                  }
                  required
                />
              </label>
            </div>

            <div className="seasons-form__footer">
              <label className="admin-form__checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm({ ...form, isActive: event.target.checked })
                  }
                />
                <span>{t('common.active')}</span>
              </label>

              <div className="admin-form__actions">
                <button type="submit" disabled={saving}>
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
                    ? t('seasons.clearForm')
                    : t('common.cancelEdit')}
                </button>
              </div>
            </div>
          </form>

          <aside className="seasons-instructions" aria-labelledby="seasons-instructions-title">
            <div className="seasons-card-head">
              <span className="seasons-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 11v7" />
                  <circle cx="12" cy="7" r="1.15" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <div>
                <h2 id="seasons-instructions-title">{t('seasons.instructionsTitle')}</h2>
                <p>{t('seasons.instructionsIntro')}</p>
              </div>
            </div>
            <ul className="seasons-instructions__list">
              <li>{t('seasons.tipOneActive')}</li>
              <li>{t('seasons.tipPlanAhead')}</li>
              <li>{t('seasons.tipEditAnytime')}</li>
              <li>{t('seasons.tipDeactivate')}</li>
            </ul>
          </aside>
        </div>
      )}

      <div className="admin-filters seasons-filters">
        <label className="admin-form__field seasons-filters__search">
          <span>{t('common.name')}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('seasons.searchPlaceholder')}
          />
        </label>

        <label className="admin-form__field seasons-filters__type">
          <span>{t('seasons.activityType')}</span>
          <select
            value={activityTypeFilter}
            onChange={(event) => setActivityTypeFilter(event.target.value)}
          >
            <option value="">{t('seasons.allActivityTypes')}</option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {activityTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__checkbox seasons-filters__active">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />
          <span>{t('seasons.activeOnly')}</span>
        </label>

        <FilterClearButton
          onClick={resetFilters}
          disabled={!filtersActive}
        >
          {t('seasons.resetFilters')}
        </FilterClearButton>
      </div>

      <div className="admin-table-wrap">
        <div className="seasons-table-head">
          <h2>{t('seasons.existing')}</h2>
          {!loading && seasons.length > 0 && (
            <p className="seasons-table-count">
              {t('seasons.showingCount', {
                shown: visibleSeasons.length,
                total: seasons.length,
              })}
            </p>
          )}
        </div>
        {loading ? (
          <p className="admin-page__loading">{t('seasons.loading')}</p>
        ) : seasons.length === 0 ? (
          <p className="dashboard-empty">{t('seasons.empty')}</p>
        ) : visibleSeasons.length === 0 ? (
          <p className="dashboard-empty">{t('seasons.emptyFiltered')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('common.name')}</th>
                <th>{t('seasons.activityType')}</th>
                <th>{t('common.start')}</th>
                <th>{t('common.end')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleSeasons.map((season) => (
                <tr
                  key={season.id}
                  className={
                    editingId === season.id ? 'seasons-row--editing' : undefined
                  }
                >
                  <td>{season.id}</td>
                  <td>{season.name}</td>
                  <td>{activityTypeLabel(season.activityType)}</td>
                  <td>
                    <DateText value={season.startDate} />
                  </td>
                  <td>
                    <DateText value={season.endDate} />
                  </td>
                  <td>
                    <StatusBadge tone={season.isActive ? 'success' : 'neutral'}>
                      {season.isActive ? t('common.active') : t('common.inactive')}
                    </StatusBadge>
                  </td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="reg-action reg-action--edit"
                      onClick={() => startEdit(season)}
                    >
                      {t('common.edit')}
                    </button>
                    {season.isActive ? (
                      <button
                        type="button"
                        className="reg-action reg-action--deactivate"
                        onClick={() => void handleDeactivate(season.id)}
                      >
                        {t('common.deactivate')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="reg-action reg-action--activate"
                        onClick={() => void handleActivate(season.id)}
                      >
                        {t('common.activate')}
                      </button>
                    )}
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
