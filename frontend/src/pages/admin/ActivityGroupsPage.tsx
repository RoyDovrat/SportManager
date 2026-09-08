import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { listActivities, type ActivityResponse } from '../../api/activities'
import {
  createActivityGroup,
  listActivityGroups,
  type ActivityGroupResponse,
} from '../../api/activityGroups'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import {
  GroupFormFields,
  emptyGroupFormErrors,
  hasGroupFormErrors,
  resolvedWeeklySessions,
  validateGroupForm,
  type GroupFormErrors,
  type GroupFormValues,
} from '../../components/admin/GroupFormFields'
import {
  draftsToRequest,
  newTrainingSessionDraft,
} from '../../components/admin/TrainingSessionsEditor'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import {
  activityTypeLabel,
  ageGroupLabel,
  dayOfWeekLabel,
  swimmingLessonTypeLabel,
  waterAdaptationLevelLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import {
  ACTIVITY_TYPES,
  type ActivityType,
  type SwimmingLessonType,
  type WaterAdaptationLevel,
} from '../../types/enums'

const FILTER_DEFAULTS = {
  seasonId: '',
  activityId: '',
  activeOnly: '',
  activityType: '',
}

function isActivityType(value: string): value is ActivityType {
  return value === 'FOOTBALL' || value === 'SWIMMING'
}

function pickSeasonForType(
  seasonData: SeasonResponse[],
  activityType: ActivityType,
): SeasonResponse | undefined {
  return (
    seasonData.find(
      (season) => season.isActive && season.activityType === activityType,
    ) ?? seasonData.find((season) => season.activityType === activityType)
  )
}

function emptyCreateForm(seasonId = '', activityType: ActivityType = 'FOOTBALL'): GroupFormValues {
  return {
    name: '',
    seasonId,
    activityType,
    ageGroups: [],
    weeklySessions: '1',
    swimmingLessonType: '',
    waterAdaptationLevel: '',
    isActive: true,
    trainingSessions: [newTrainingSessionDraft()],
  }
}

function formatSessionTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value
}

function formatSessions(row: ActivityGroupResponse): string {
  const sessions = (row.trainingSessions ?? []).filter((session) => session.isActive)
  if (sessions.length === 0) {
    return t('activityGroups.noSessions')
  }
  return sessions
    .map((session) => {
      const end = session.endTime ? `–${formatSessionTime(session.endTime)}` : ''
      return `${dayOfWeekLabel(session.dayOfWeek)} ${formatSessionTime(session.startTime)}${end}`
    })
    .join(' · ')
}

export function ActivityGroupsPage() {
  const { filters, setFilter, setFilters, hasParam } = useUrlFilters(FILTER_DEFAULTS)
  const {
    seasonId,
    activityId: activityFilterId,
    activeOnly,
    activityType: activityTypeFilter,
  } = filters

  const formRef = useRef<HTMLFormElement>(null)
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [activities, setActivities] = useState<ActivityResponse[]>([])
  const [rows, setRows] = useState<ActivityGroupResponse[]>([])
  const [filtersReady, setFiltersReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<GroupFormErrors>(emptyGroupFormErrors())
  const [createForm, setCreateForm] = useState<GroupFormValues>(emptyCreateForm())

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [seasonData, activityData] = await Promise.all([
          listSeasons(),
          listActivities(),
        ])
        setSeasons(seasonData)
        setActivities(activityData)

        const typedFilter = isActivityType(filters.activityType)
          ? filters.activityType
          : null
        const typedSeason = typedFilter
          ? pickSeasonForType(seasonData, typedFilter)
          : undefined
        const active = seasonData.find((season) => season.isActive)
        const defaultSeasonId =
          typedSeason?.id ?? active?.id ?? seasonData[0]?.id

        if (!hasParam('seasonId') && defaultSeasonId != null) {
          setFilter('seasonId', String(defaultSeasonId))
        }

        const resolvedSeasonId =
          (hasParam('seasonId') && filters.seasonId) ||
          (defaultSeasonId != null ? String(defaultSeasonId) : '')

        setCreateForm((prev) => ({
          ...prev,
          seasonId: resolvedSeasonId || prev.seasonId,
          activityType: typedFilter ?? prev.activityType,
        }))
        setFiltersReady(true)
      } catch (err) {
        setListError(formatApiError(err))
        setLoading(false)
      }
    }

    void loadCatalog()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load catalog once on mount
  }, [])

  async function loadRows() {
    if (!seasonId) {
      setRows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setListError(null)

    try {
      const data = await listActivityGroups({
        seasonId: Number(seasonId),
        activityId:
          activityFilterId === '' ? null : Number(activityFilterId),
        activeOnly: activeOnly === '1' ? true : null,
      })
      setRows(data)
    } catch (err) {
      setListError(formatApiError(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!filtersReady) {
      return
    }
    void loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersReady, seasonId, activityFilterId, activeOnly])

  function resetCreateForm() {
    setCreateForm(
      emptyCreateForm(
        seasonId || createForm.seasonId,
        isActivityType(activityTypeFilter)
          ? activityTypeFilter
          : emptyCreateForm().activityType,
      ),
    )
    setFormErrors(emptyGroupFormErrors())
  }

  function handleActivityTypeFilterChange(nextValue: string) {
    const nextType = isActivityType(nextValue) ? nextValue : ''
    const typedSeason =
      nextType !== '' ? pickSeasonForType(seasons, nextType) : undefined
    const nextSeasonId =
      nextType !== ''
        ? typedSeason != null
          ? String(typedSeason.id)
          : ''
        : seasonId ||
          (seasons[0] != null ? String(seasons[0].id) : '')

    setFilters({
      activityType: nextType,
      activityId: '',
      seasonId: nextSeasonId,
    })

    if (nextType !== '') {
      setCreateForm((prev) => ({
        ...emptyCreateForm(nextSeasonId || prev.seasonId, nextType),
        name: prev.name,
        isActive: prev.isActive,
      }))
    }
  }

  function resetFilters() {
    const active = seasons.find((season) => season.isActive) ?? seasons[0]
    setFilters({
      activityType: '',
      activityId: '',
      activeOnly: '',
      seasonId: active ? String(active.id) : '',
    })
    setSearch('')
  }

  const seasonsForFilter = isActivityType(activityTypeFilter)
    ? seasons.filter((season) => season.activityType === activityTypeFilter)
    : seasons
  const activitiesForFilter = isActivityType(activityTypeFilter)
    ? activities.filter(
        (activity) => activity.activityType === activityTypeFilter,
      )
    : activities

  const visibleRows = useMemo(() => {
    const typed = isActivityType(activityTypeFilter)
      ? rows.filter((row) => row.activityType === activityTypeFilter)
      : rows
    const q = search.trim()
    if (!q) {
      return typed
    }
    return typed.filter((row) => row.name.includes(q))
  }, [activityTypeFilter, rows, search])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    const errors = validateGroupForm(createForm)
    if (hasGroupFormErrors(errors)) {
      setFormErrors(errors)
      setSaving(false)
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    try {
      const weeklySessions = resolvedWeeklySessions(createForm)
      await createActivityGroup({
        name: createForm.name.trim(),
        seasonId: Number(createForm.seasonId),
        activityType: createForm.activityType,
        ageGroups: createForm.ageGroups,
        weeklySessions,
        swimmingLessonType:
          createForm.activityType === 'FOOTBALL'
            ? null
            : (createForm.swimmingLessonType as SwimmingLessonType),
        waterAdaptationLevel:
          createForm.activityType === 'FOOTBALL'
            ? null
            : (createForm.waterAdaptationLevel as WaterAdaptationLevel),
        isActive: createForm.isActive,
        trainingSessions: draftsToRequest(createForm.trainingSessions),
      })
      setMessage(t('activityGroups.created'))
      resetCreateForm()
      setCreating(false)
      await loadRows()
    } catch (err) {
      setFormErrors({ general: formatApiError(err) })
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-page admin-page--wide groups-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('activityGroups.title')}</h1>
          <p className="admin-page__lede">{t('activityGroups.intro')}</p>
        </div>
        <button
          type="button"
          className="reg-action reg-action--approve"
          onClick={() => {
            setCreating((open) => !open)
            setMessage(null)
            if (!creating) {
              setFormErrors(emptyGroupFormErrors())
            }
          }}
        >
          {creating ? t('activityGroups.closeCreate') : t('activityGroups.newGroup')}
        </button>
      </header>

      {message && <p className="admin-page__ok">{message}</p>}
      {listError && <p className="admin-page__error">{listError}</p>}

      {creating && (
        <form
          ref={formRef}
          className="admin-form groups-form"
          onSubmit={handleCreate}
        >
          <div className="groups-form__head">
            <h2>{t('activityGroups.createTitle')}</h2>
          </div>
          <GroupFormFields
            values={createForm}
            errors={formErrors}
            onChange={(next) => {
              setCreateForm(next)
              setFormErrors(emptyGroupFormErrors())
            }}
            disabled={saving || !filtersReady}
            seasons={seasons}
          />
          <div className="admin-form__actions">
            <button type="submit" disabled={saving || !filtersReady}>
              {saving ? t('common.saving') : t('common.create')}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={resetCreateForm}
              disabled={saving}
            >
              {t('activityGroups.clearForm')}
            </button>
          </div>
        </form>
      )}

      <div className="admin-filters groups-filters">
        <label className="admin-form__field groups-filters__search">
          <span>{t('common.name')}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('activityGroups.searchPlaceholder')}
          />
        </label>

        <label className="admin-form__field groups-filters__type">
          <span>{t('activityGroups.filterActivityType')}</span>
          <select
            value={activityTypeFilter}
            onChange={(event) =>
              handleActivityTypeFilterChange(event.target.value)
            }
            disabled={!filtersReady}
          >
            <option value="">{t('activityGroups.allActivityTypes')}</option>
            {ACTIVITY_TYPES.map((value) => (
              <option key={value} value={value}>
                {activityTypeLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field groups-filters__season">
          <span>{t('activityGroups.filterSeason')}</span>
          <select
            value={seasonId}
            onChange={(event) => setFilter('seasonId', event.target.value)}
            disabled={!filtersReady}
          >
            {seasonsForFilter.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} · {activityTypeLabel(season.activityType)}
                {season.isActive ? ` (${t('common.active')})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field groups-filters__activity">
          <span>{t('activityGroups.filterActivity')}</span>
          <select
            value={activityFilterId}
            onChange={(event) => setFilter('activityId', event.target.value)}
            disabled={!filtersReady}
          >
            <option value="">{t('activityGroups.allActivities')}</option>
            {activitiesForFilter.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activityTypeLabel(activity.activityType)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__checkbox groups-filters__active">
          <input
            type="checkbox"
            checked={activeOnly === '1'}
            onChange={(event) =>
              setFilter('activeOnly', event.target.checked ? '1' : '')
            }
            disabled={!filtersReady}
          />
          <span>{t('activityGroups.activeOnly')}</span>
        </label>

        <button
          type="button"
          className="btn btn--secondary groups-filters__reset"
          onClick={resetFilters}
        >
          {t('activityGroups.resetFilters')}
        </button>
      </div>

      <div className="admin-table-wrap">
        <h2>{t('activityGroups.listTitle')}</h2>
        <p className="admin-form__hint">{t('activityGroups.listHint')}</p>
        {!seasonId ? (
          <p className="dashboard-empty">{t('activityGroups.selectSeasonFirst')}</p>
        ) : loading ? (
          <p className="admin-page__loading">{t('common.loading')}</p>
        ) : visibleRows.length === 0 ? (
          <p className="dashboard-empty">{t('activityGroups.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('common.name')}</th>
                <th>{t('activityGroups.activityType')}</th>
                <th>{t('activityGroups.attributes')}</th>
                <th>{t('activityGroups.members')}</th>
                <th>{t('common.status')}</th>
                <th>{t('activityGroups.sessionsColumn')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{activityTypeLabel(row.activityType)}</td>
                  <td>{formatAttributes(row)}</td>
                  <td>
                    {row.maxCapacity != null
                      ? `${row.memberCount}/${row.maxCapacity}`
                      : row.memberCount}
                  </td>
                  <td>
                    <StatusBadge tone={row.isActive ? 'success' : 'neutral'}>
                      {row.isActive ? t('common.active') : t('common.inactive')}
                    </StatusBadge>
                  </td>
                  <td>{formatSessions(row)}</td>
                  <td className="admin-table__actions">
                    <Link
                      to={`/admin/activity-groups/${row.id}`}
                      className="reg-action reg-action--view"
                    >
                      {t('activityGroups.view')}
                    </Link>
                    <Link
                      to={`/admin/activity-groups/${row.id}?edit=1`}
                      className="reg-action reg-action--edit"
                    >
                      {t('activityGroups.edit')}
                    </Link>
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

function formatAttributes(row: ActivityGroupResponse): string {
  const parts: string[] = []
  const isFootball = row.activityType === 'FOOTBALL'

  if (!isFootball && row.ageGroups?.length) {
    parts.push(row.ageGroups.map((value) => ageGroupLabel(value)).join(', '))
  }

  const weeklySessions = isFootball
    ? (row.trainingSessions?.filter((session) => session.isActive).length ||
        row.weeklySessions)
    : row.weeklySessions
  if (weeklySessions != null) {
    parts.push(`${t('activityGroups.weeklySessionsShort')}: ${weeklySessions}`)
  }

  if (row.swimmingLessonType) {
    parts.push(swimmingLessonTypeLabel(row.swimmingLessonType))
  }
  if (row.waterAdaptationLevel) {
    parts.push(waterAdaptationLevelLabel(row.waterAdaptationLevel))
  }
  return parts.length > 0 ? parts.join(' · ') : '—'
}
