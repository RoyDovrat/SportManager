import {
  TrainingSessionsEditor,
  newTrainingSessionDraft,
  type TrainingSessionDraft,
} from './TrainingSessionsEditor'
import type { SeasonResponse } from '../../api/seasons'
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

export type GroupFormValues = {
  name: string
  seasonId: string
  activityType: ActivityType
  ageGroups: AgeGroup[]
  weeklySessions: string
  swimmingLessonType: string
  waterAdaptationLevels: WaterAdaptationLevel[]
  isActive: boolean
  trainingSessions: TrainingSessionDraft[]
}

export type GroupFormErrors = {
  general?: string
  ageGroups?: string
  lessonType?: string
  waterLevel?: string
  trainingSessions?: string
}

export function emptyGroupFormErrors(): GroupFormErrors {
  return {}
}

export function hasGroupFormErrors(errors: GroupFormErrors): boolean {
  return Object.values(errors).some((value) => Boolean(value))
}

export function validateGroupForm(values: GroupFormValues): GroupFormErrors {
  const errors: GroupFormErrors = {}
  const isFootball = values.activityType === 'FOOTBALL'
  const activeSessions = values.trainingSessions.filter(
    (session) => session.isActive,
  )

  if (values.ageGroups.length === 0) {
    errors.ageGroups = t('activityGroups.ageGroupsRequired')
  }
  if (!isFootball && values.swimmingLessonType === '') {
    errors.lessonType = t('activityGroups.lessonTypeRequired')
  }
  if (!isFootball && (values.waterAdaptationLevels ?? []).length === 0) {
    errors.waterLevel = t('activityGroups.waterLevelRequired')
  }
  if (isFootball) {
    if (activeSessions.length !== 1 && activeSessions.length !== 2) {
      errors.trainingSessions = t(
        'activityGroups.trainingSessionsExactlyOneOrTwo',
      )
    }
  } else if (activeSessions.length < 1 || activeSessions.length > 6) {
    errors.trainingSessions = t('activityGroups.trainingSessionsSwimmingRange')
  }

  return errors
}

export function resolvedWeeklySessions(values: GroupFormValues): number {
  return values.trainingSessions.filter((session) => session.isActive).length
}

type GroupFormFieldsProps = {
  values: GroupFormValues
  errors: GroupFormErrors
  onChange: (next: GroupFormValues) => void
  disabled?: boolean
  seasons?: SeasonResponse[]
  showActivityType?: boolean
  showSeason?: boolean
}

export function GroupFormFields({
  values,
  errors,
  onChange,
  disabled = false,
  seasons,
  showActivityType = true,
  showSeason = true,
}: GroupFormFieldsProps) {
  const isFootball = values.activityType === 'FOOTBALL'
  const activeCount = resolvedWeeklySessions(values)

  function toggleAgeGroup(value: AgeGroup) {
    const exists = values.ageGroups.includes(value)
    onChange({
      ...values,
      ageGroups: exists
        ? values.ageGroups.filter((item) => item !== value)
        : [...values.ageGroups, value],
    })
  }

  function toggleWaterLevel(value: WaterAdaptationLevel) {
    const current = values.waterAdaptationLevels ?? []
    const exists = current.includes(value)
    onChange({
      ...values,
      waterAdaptationLevels: exists
        ? current.filter((item) => item !== value)
        : [...current, value],
    })
  }

  return (
    <div className="groups-form-grid">
      <section className="groups-card">
        <h3>{t('activityGroups.detailsCard')}</h3>
        {errors.general && (
          <p className="groups-inline-error" role="alert">
            {errors.general}
          </p>
        )}

        <label className="admin-form__field">
          <span>{t('common.name')}</span>
          <input
            value={values.name}
            onChange={(event) =>
              onChange({ ...values, name: event.target.value })
            }
            required
            disabled={disabled}
          />
        </label>

        {showActivityType && (
          <label className="admin-form__field">
            <span>{t('activityGroups.activityType')}</span>
            <select
              value={values.activityType}
              onChange={(event) => {
                const nextType = event.target.value as ActivityType
                const typedSeason = seasons?.find(
                  (season) =>
                    season.isActive && season.activityType === nextType,
                ) ?? seasons?.find((season) => season.activityType === nextType)
                onChange({
                  ...values,
                  activityType: nextType,
                  seasonId:
                    typedSeason != null
                      ? String(typedSeason.id)
                      : values.seasonId,
                  ageGroups: [],
                  weeklySessions: '1',
                  swimmingLessonType: '',
                  waterAdaptationLevels: [],
                  trainingSessions: [newTrainingSessionDraft()],
                })
              }}
              disabled={disabled}
            >
              {ACTIVITY_TYPES.map((value) => (
                <option key={value} value={value}>
                  {activityTypeLabel(value)}
                </option>
              ))}
            </select>
          </label>
        )}

        {showSeason && seasons && (
          <label className="admin-form__field">
            <span>{t('activityGroups.season')}</span>
            <select
              value={values.seasonId}
              onChange={(event) =>
                onChange({ ...values, seasonId: event.target.value })
              }
              required
              disabled={disabled}
            >
              <option value="" disabled>
                {t('activityGroups.selectSeason')}
              </option>
              {seasons
                .filter((season) => season.activityType === values.activityType)
                .map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                    {season.isActive ? ` (${t('common.active')})` : ''}
                  </option>
                ))}
            </select>
          </label>
        )}

        {!isFootball && (
          <>
            <label className="admin-form__field">
              <span>{t('activityGroups.lessonType')}</span>
              <select
                value={values.swimmingLessonType}
                onChange={(event) =>
                  onChange({
                    ...values,
                    swimmingLessonType: event.target.value,
                  })
                }
                required
                disabled={disabled}
                aria-invalid={Boolean(errors.lessonType)}
              >
                <option value="">{t('activityGroups.selectLessonType')}</option>
                {SWIMMING_LESSON_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {swimmingLessonTypeLabel(value as SwimmingLessonType)}
                  </option>
                ))}
              </select>
            </label>
            {errors.lessonType && (
              <p className="groups-inline-error" role="alert">
                {errors.lessonType}
              </p>
            )}
            <p className="admin-form__hint groups-capacity-hint">
              {t('activityGroups.lessonCapacityHint')}
            </p>

            <div
              className={
                errors.waterLevel
                  ? 'groups-water-levels groups-water-levels--error'
                  : 'groups-water-levels'
              }
            >
              <span>{t('activityGroups.waterLevel')}</span>
              <p className="admin-form__hint">{t('activityGroups.waterLevelHint')}</p>
              <div className="groups-age-grid">
                {WATER_ADAPTATION_LEVELS.map((value) => (
                  <label key={value} className="admin-form__checkbox">
                    <input
                      type="checkbox"
                      checked={(values.waterAdaptationLevels ?? []).includes(value)}
                      onChange={() => toggleWaterLevel(value)}
                      disabled={disabled}
                    />
                    <span>{waterAdaptationLevelLabel(value)}</span>
                  </label>
                ))}
              </div>
              {errors.waterLevel && (
                <p className="groups-inline-error" role="alert">
                  {errors.waterLevel}
                </p>
              )}
            </div>
          </>
        )}

        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) =>
              onChange({ ...values, isActive: event.target.checked })
            }
            disabled={disabled}
          />
          <span>{t('common.active')}</span>
        </label>
      </section>

      <section
        className={`groups-card${errors.ageGroups ? ' groups-card--error' : ''}`}
      >
        <h3>{t('activityGroups.ageGroups')}</h3>
        <p className="admin-form__hint">
          {isFootball
            ? t('activityGroups.ageGroupsHint')
            : t('activityGroups.ageGroupsHintSwimming')}
        </p>
        <div className="groups-age-grid">
          {AGE_GROUPS.map((value) => (
            <label key={value} className="admin-form__checkbox">
              <input
                type="checkbox"
                checked={values.ageGroups.includes(value)}
                onChange={() => toggleAgeGroup(value)}
                disabled={disabled}
              />
              <span>{ageGroupLabel(value)}</span>
            </label>
          ))}
        </div>
        {errors.ageGroups && (
          <p className="groups-inline-error" role="alert">
            {errors.ageGroups}
          </p>
        )}
      </section>

      <section
        className={`groups-card${errors.trainingSessions ? ' groups-card--error' : ''}`}
      >
        <TrainingSessionsEditor
          sessions={values.trainingSessions}
          onChange={(trainingSessions) => {
            const count = trainingSessions.filter((session) => session.isActive)
              .length
            onChange({
              ...values,
              trainingSessions,
              weeklySessions: String(count),
            })
          }}
          disabled={disabled}
          maxSessions={isFootball ? 2 : 6}
          hintKey={isFootball ? 'football' : 'swimming'}
          error={errors.trainingSessions}
        />
        <p className="admin-form__hint">
          {t('activityGroups.weeklySessionsFromSchedule', {
            count: activeCount,
          })}
        </p>
      </section>
    </div>
  )
}
