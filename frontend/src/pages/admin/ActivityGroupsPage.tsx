import { useEffect, useState, type FormEvent } from 'react'
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
  TrainingSessionsEditor,
  draftsToRequest,
  newTrainingSessionDraft,
  type TrainingSessionDraft,
} from '../../components/admin/TrainingSessionsEditor'
import {
  activityTypeLabel,
  ageGroupLabel,
  swimmingLessonTypeLabel,
  waterAdaptationLevelLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import {
  ACTIVITY_TYPES,
  AGE_GROUPS,
  SWIMMING_LESSON_TYPES,
  WATER_ADAPTATION_LEVELS,
  type ActivityType,
  type AgeGroup,
  type SwimmingLessonType,
  type WaterAdaptationLevel,
} from '../../types/enums'

const SWIMMING_WEEKLY_OPTIONS = [1, 2, 3, 4, 5, 6] as const

type CreateForm = {
  name: string
  seasonId: string
  activityType: ActivityType
  ageGroups: AgeGroup[]
  weeklySessions: string
  swimmingLessonType: string
  waterAdaptationLevel: string
  isActive: boolean
  trainingSessions: TrainingSessionDraft[]
}

const emptyCreateForm: CreateForm = {
  name: '',
  seasonId: '',
  activityType: 'FOOTBALL',
  ageGroups: [],
  weeklySessions: '1',
  swimmingLessonType: '',
  waterAdaptationLevel: '',
  isActive: true,
  trainingSessions: [newTrainingSessionDraft()],
}

export function ActivityGroupsPage() {
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [activities, setActivities] = useState<ActivityResponse[]>([])
  const [seasonId, setSeasonId] = useState('')
  const [activityFilterId, setActivityFilterId] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [rows, setRows] = useState<ActivityGroupResponse[]>([])
  const [filtersReady, setFiltersReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm)

  useEffect(() => {
    async function loadCatalog() {
      setError(null)

      try {
        const [seasonData, activityData] = await Promise.all([
          listSeasons(),
          listActivities(),
        ])
        setSeasons(seasonData)
        setActivities(activityData)

        const active = seasonData.find((season) => season.isActive)
        const defaultSeasonId = active?.id ?? seasonData[0]?.id
        if (defaultSeasonId != null) {
          setSeasonId(String(defaultSeasonId))
          setCreateForm((prev) => ({
            ...prev,
            seasonId: String(defaultSeasonId),
          }))
        }
        setFiltersReady(true)
      } catch (err) {
        setError(formatApiError(err))
        setLoading(false)
      }
    }

    void loadCatalog()
  }, [])

  async function loadRows() {
    if (!seasonId) {
      setRows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await listActivityGroups({
        seasonId: Number(seasonId),
        activityId:
          activityFilterId === '' ? null : Number(activityFilterId),
        activeOnly: activeOnly ? true : null,
      })
      setRows(data)
    } catch (err) {
      setError(formatApiError(err))
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
    setCreateForm({
      ...emptyCreateForm,
      seasonId: seasonId || createForm.seasonId,
      trainingSessions: [newTrainingSessionDraft()],
    })
  }

  function toggleAgeGroup(value: AgeGroup) {
    setCreateForm((prev) => {
      const exists = prev.ageGroups.includes(value)
      return {
        ...prev,
        ageGroups: exists
          ? prev.ageGroups.filter((item) => item !== value)
          : [...prev.ageGroups, value],
      }
    })
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const isFootball = createForm.activityType === 'FOOTBALL'
      if (createForm.ageGroups.length === 0) {
        setError(t('activityGroups.ageGroupsRequired'))
        setSaving(false)
        return
      }
      if (!isFootball && createForm.swimmingLessonType === '') {
        setError(t('activityGroups.lessonTypeRequired'))
        setSaving(false)
        return
      }
      if (!isFootball && createForm.waterAdaptationLevel === '') {
        setError(t('activityGroups.waterLevelRequired'))
        setSaving(false)
        return
      }
      let weeklySessions = Number(createForm.weeklySessions)
      if (isFootball) {
        const activeSessions = createForm.trainingSessions.filter(
          (session) => session.isActive,
        )
        if (activeSessions.length !== 1 && activeSessions.length !== 2) {
          setError(t('activityGroups.trainingSessionsExactlyOneOrTwo'))
          setSaving(false)
          return
        }
        weeklySessions = activeSessions.length
      }

      await createActivityGroup({
        name: createForm.name.trim(),
        seasonId: Number(createForm.seasonId),
        activityType: createForm.activityType,
        ageGroups: createForm.ageGroups,
        weeklySessions,
        swimmingLessonType: isFootball
          ? null
          : (createForm.swimmingLessonType as SwimmingLessonType),
        waterAdaptationLevel: isFootball
          ? null
          : (createForm.waterAdaptationLevel as WaterAdaptationLevel),
        isActive: createForm.isActive,
        trainingSessions: isFootball
          ? draftsToRequest(createForm.trainingSessions)
          : undefined,
      })
      setMessage(t('activityGroups.created'))
      resetCreateForm()
      if (createForm.seasonId === seasonId) {
        await loadRows()
      } else {
        setSeasonId(createForm.seasonId)
      }
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-page admin-page--wide">
      <h1>{t('activityGroups.title')}</h1>
      <p>{t('activityGroups.intro')}</p>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <form className="admin-form" onSubmit={handleCreate}>
        <h2>{t('activityGroups.createTitle')}</h2>

        <label className="admin-form__field">
          <span>{t('common.name')}</span>
          <input
            value={createForm.name}
            onChange={(event) =>
              setCreateForm({ ...createForm, name: event.target.value })
            }
            required
            disabled={saving || !filtersReady}
          />
        </label>

        <label className="admin-form__field">
          <span>{t('activityGroups.season')}</span>
          <select
            value={createForm.seasonId}
            onChange={(event) =>
              setCreateForm({ ...createForm, seasonId: event.target.value })
            }
            required
            disabled={saving || !filtersReady}
          >
            <option value="" disabled>
              {t('activityGroups.selectSeason')}
            </option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
                {season.isActive ? ` (${t('common.active')})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('activityGroups.activityType')}</span>
          <select
            value={createForm.activityType}
            onChange={(event) => {
              const nextType = event.target.value as ActivityType
              setCreateForm({
                ...createForm,
                activityType: nextType,
                ageGroups: [],
                weeklySessions: '1',
                swimmingLessonType: '',
                waterAdaptationLevel: '',
                trainingSessions:
                  nextType === 'FOOTBALL'
                    ? [newTrainingSessionDraft()]
                    : [],
              })
            }}
            disabled={saving || !filtersReady}
          >
            {ACTIVITY_TYPES.map((value) => (
              <option key={value} value={value}>
                {activityTypeLabel(value)}
              </option>
            ))}
          </select>
        </label>

        {createForm.activityType === 'FOOTBALL' ? (
          <>
            <fieldset className="admin-form__checkbox-group">
              <legend>{t('activityGroups.ageGroups')}</legend>
              <p className="clothing-order-form__hint">
                {t('activityGroups.ageGroupsHint')}
              </p>
              {AGE_GROUPS.map((value) => (
                <label key={value} className="admin-form__checkbox">
                  <input
                    type="checkbox"
                    checked={createForm.ageGroups.includes(value)}
                    onChange={() => toggleAgeGroup(value)}
                    disabled={saving}
                  />
                  <span>{ageGroupLabel(value)}</span>
                </label>
              ))}
            </fieldset>

            <TrainingSessionsEditor
              sessions={createForm.trainingSessions}
              onChange={(trainingSessions) => {
                const activeCount = trainingSessions.filter(
                  (session) => session.isActive,
                ).length
                setCreateForm({
                  ...createForm,
                  trainingSessions,
                  weeklySessions:
                    activeCount === 1 || activeCount === 2
                      ? String(activeCount)
                      : createForm.weeklySessions,
                })
              }}
              disabled={saving}
            />
            <p className="clothing-order-form__hint">
              {t('activityGroups.weeklySessionsFromSchedule', {
                count: createForm.trainingSessions.filter(
                  (session) => session.isActive,
                ).length,
              })}
            </p>
          </>
        ) : (
          <>
            <label className="admin-form__field">
              <span>{t('activityGroups.lessonType')}</span>
              <select
                value={createForm.swimmingLessonType}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    swimmingLessonType: event.target.value,
                  })
                }
                required
                disabled={saving}
              >
                <option value="">{t('activityGroups.selectLessonType')}</option>
                {SWIMMING_LESSON_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {swimmingLessonTypeLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <p className="clothing-order-form__hint">
              {t('activityGroups.lessonCapacityHint')}
            </p>

            <fieldset className="admin-form__checkbox-group">
              <legend>{t('activityGroups.ageGroups')}</legend>
              <p className="clothing-order-form__hint">
                {t('activityGroups.ageGroupsHintSwimming')}
              </p>
              {AGE_GROUPS.map((value) => (
                <label key={value} className="admin-form__checkbox">
                  <input
                    type="checkbox"
                    checked={createForm.ageGroups.includes(value)}
                    onChange={() => toggleAgeGroup(value)}
                    disabled={saving}
                  />
                  <span>{ageGroupLabel(value)}</span>
                </label>
              ))}
            </fieldset>

            <label className="admin-form__field">
              <span>{t('activityGroups.waterLevel')}</span>
              <select
                value={createForm.waterAdaptationLevel}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    waterAdaptationLevel: event.target.value,
                  })
                }
                required
                disabled={saving}
              >
                <option value="">{t('activityGroups.selectWaterLevel')}</option>
                {WATER_ADAPTATION_LEVELS.map((value) => (
                  <option key={value} value={value}>
                    {waterAdaptationLevelLabel(value)}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form__field">
              <span>{t('activityGroups.weeklySessionsSwimming')}</span>
              <select
                value={createForm.weeklySessions}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    weeklySessions: event.target.value,
                  })
                }
                required
                disabled={saving}
              >
                {SWIMMING_WEEKLY_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={createForm.isActive}
            onChange={(event) =>
              setCreateForm({ ...createForm, isActive: event.target.checked })
            }
            disabled={saving}
          />
          <span>{t('common.active')}</span>
        </label>

        <div className="admin-form__actions">
          <button type="submit" disabled={saving || !filtersReady}>
            {saving ? t('common.saving') : t('common.create')}
          </button>
        </div>
      </form>

      <div className="admin-filters">
        <label className="admin-form__field">
          <span>{t('activityGroups.filterSeason')}</span>
          <select
            value={seasonId}
            onChange={(event) => setSeasonId(event.target.value)}
            disabled={!filtersReady}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
                {season.isActive ? ` (${t('common.active')})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('activityGroups.filterActivity')}</span>
          <select
            value={activityFilterId}
            onChange={(event) => setActivityFilterId(event.target.value)}
            disabled={!filtersReady}
          >
            <option value="">{t('activityGroups.allActivities')}</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activityTypeLabel(activity.activityType)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
            disabled={!filtersReady}
          />
          <span>{t('activityGroups.activeOnly')}</span>
        </label>
      </div>

      <div className="admin-table-wrap">
        <h2>{t('activityGroups.listTitle')}</h2>
        <p className="clothing-order-form__hint">
          {t('activityGroups.listHint')}
        </p>
        {!seasonId ? (
          <p>{t('activityGroups.selectSeasonFirst')}</p>
        ) : loading ? (
          <p>{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <p>{t('activityGroups.empty')}</p>
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
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
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
                    {row.isActive ? t('common.active') : t('common.inactive')}
                  </td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/activity-groups/${row.id}`}>
                      {t('activityGroups.viewDetails')}
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
