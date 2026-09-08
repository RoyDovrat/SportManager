import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  activateActivity,
  createActivity,
  deactivateActivity,
  listActivities,
  updateActivity,
  type ActivityRequest,
  type ActivityResponse,
} from '../../api/activities'
import { formatApiError } from '../../api/formatApiError'
import { NavIcon } from '../../components/ui/NavIcon'
import { FilterClearButton } from '../../components/ui/FilterClearButton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { activityTypeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import { ACTIVITY_TYPES, type ActivityType } from '../../types/enums'

const emptyForm: ActivityRequest = {
  activityType: 'FOOTBALL',
  isActive: true,
}

export function ActivitiesPage() {
  const formRef = useRef<HTMLDivElement>(null)
  const [activities, setActivities] = useState<ActivityResponse[]>([])
  const [form, setForm] = useState<ActivityRequest>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)

  const formOpen = creating || editingId !== null

  async function loadActivities(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await listActivities()
      setActivities(data)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadActivities()
  }, [])

  useEffect(() => {
    if (!formOpen) {
      return
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [formOpen, editingId])

  function startEdit(activity: ActivityResponse) {
    setCreating(false)
    setEditingId(activity.id)
    setForm({
      activityType: activity.activityType,
      isActive: activity.isActive,
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
    setActiveOnly(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      if (editingId === null) {
        await createActivity(form)
        setMessage(t('activities.created'))
      } else {
        await updateActivity(editingId, form)
        setMessage(t('activities.updated'))
      }
      setCreating(false)
      resetForm()
      await loadActivities({ silent: true })
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate(activityId: number) {
    setError(null)
    setMessage(null)
    try {
      await activateActivity(activityId)
      setMessage(t('activities.activated'))
      await loadActivities({ silent: true })
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  async function handleDeactivate(activityId: number) {
    setError(null)
    setMessage(null)
    try {
      await deactivateActivity(activityId)
      setMessage(t('activities.deactivated'))
      await loadActivities({ silent: true })
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  const visibleActivities = useMemo(() => {
    const query = search.trim()
    return activities.filter((activity) => {
      if (activeOnly && !activity.isActive) {
        return false
      }
      if (query && !activityTypeLabel(activity.activityType).includes(query)) {
        return false
      }
      return true
    })
  }, [activeOnly, activities, search])

  const filtersActive = search.trim() !== '' || activeOnly
  const activeCount = activities.filter((activity) => activity.isActive).length

  return (
    <section className="admin-page admin-page--wide seasons-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('activities.title')}</h1>
          <p className="admin-page__lede">{t('activities.intro')}</p>
        </div>
        <div className="seasons-hero-meta">
          {!loading && (
            <div
              className={
                activeCount > 0
                  ? 'seasons-active-chip seasons-active-chip--on'
                  : 'seasons-active-chip'
              }
            >
              <span className="seasons-active-chip__label">
                <NavIcon name="activities" />
                {t('activities.title')}
              </span>
              <div className="seasons-active-chip__row">
                <strong>
                  {activeCount > 0
                    ? t('activities.activeCount', { count: activeCount })
                    : t('activities.noActive')}
                </strong>
                {activeCount > 0 && (
                  <StatusBadge tone="success">{t('common.active')}</StatusBadge>
                )}
              </div>
            </div>
          )}
          <button
            type="button"
            className="reg-action reg-action--approve"
            onClick={toggleForm}
          >
            {formOpen ? t('activities.closeCreate') : t('activities.newActivity')}
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
                    ? t('activities.createTitle')
                    : t('activities.editTitle')}
                </h2>
                <p>
                  {editingId === null
                    ? t('activities.createSubtitle')
                    : t('activities.editSubtitle')}
                </p>
              </div>
            </div>

            <div className="activities-form-grid">
              <label className="admin-form__field">
                <span>{t('activities.activityType')}</span>
                <select
                  value={form.activityType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      activityType: event.target.value as ActivityType,
                    })
                  }
                  required
                >
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {activityTypeLabel(type)}
                    </option>
                  ))}
                </select>
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
                    ? t('activities.clearForm')
                    : t('common.cancelEdit')}
                </button>
              </div>
            </div>
          </form>

          <aside
            className="seasons-instructions"
            aria-labelledby="activities-instructions-title"
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
                <h2 id="activities-instructions-title">
                  {t('activities.instructionsTitle')}
                </h2>
                <p>{t('activities.instructionsIntro')}</p>
              </div>
            </div>
            <ul className="seasons-instructions__list">
              <li>{t('activities.tipOnePerType')}</li>
              <li>{t('activities.tipNeededForSeason')}</li>
              <li>{t('activities.tipEditAnytime')}</li>
              <li>{t('activities.tipDeactivate')}</li>
            </ul>
          </aside>
        </div>
      )}

      <div className="admin-filters seasons-filters">
        <label className="admin-form__field seasons-filters__search">
          <span>{t('common.type')}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('activities.searchPlaceholder')}
          />
        </label>

        <label className="admin-form__checkbox seasons-filters__active">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />
          <span>{t('activities.activeOnly')}</span>
        </label>

        <FilterClearButton
          onClick={resetFilters}
          disabled={!filtersActive}
        >
          {t('activities.resetFilters')}
        </FilterClearButton>
      </div>

      <div className="admin-table-wrap">
        <div className="seasons-table-head">
          <h2>{t('activities.existing')}</h2>
          {!loading && activities.length > 0 && (
            <p className="seasons-table-count">
              {t('activities.showingCount', {
                shown: visibleActivities.length,
                total: activities.length,
              })}
            </p>
          )}
        </div>
        {loading ? (
          <p className="admin-page__loading">{t('activities.loading')}</p>
        ) : activities.length === 0 ? (
          <p className="dashboard-empty">{t('activities.empty')}</p>
        ) : visibleActivities.length === 0 ? (
          <p className="dashboard-empty">{t('activities.emptyFiltered')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('common.type')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleActivities.map((activity) => (
                <tr
                  key={activity.id}
                  className={
                    editingId === activity.id ? 'seasons-row--editing' : undefined
                  }
                >
                  <td>{activity.id}</td>
                  <td>{activityTypeLabel(activity.activityType)}</td>
                  <td>
                    <StatusBadge tone={activity.isActive ? 'success' : 'neutral'}>
                      {activity.isActive ? t('common.active') : t('common.inactive')}
                    </StatusBadge>
                  </td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="reg-action reg-action--edit"
                      onClick={() => startEdit(activity)}
                    >
                      {t('common.edit')}
                    </button>
                    {activity.isActive ? (
                      <button
                        type="button"
                        className="reg-action reg-action--deactivate"
                        onClick={() => void handleDeactivate(activity.id)}
                      >
                        {t('common.deactivate')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="reg-action reg-action--activate"
                        onClick={() => void handleActivate(activity.id)}
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
