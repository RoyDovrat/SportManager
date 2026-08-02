import {
  SWIMMING_LESSON_TYPES,
  WATER_ADAPTATION_LEVELS,
  type SwimmingLessonType,
  type WaterAdaptationLevel,
} from '../../../types/enums'
import {
  dayOfWeekLabel,
  swimmingLessonTypeLabel,
  waterAdaptationLevelLabel,
} from '../../../i18n/labels'
import { t } from '../../../i18n/t'
import type { FootballCatalogResponse } from '../../../api/publicCatalog'
import type {
  RegistrationCommonForm,
  SwimmingFormExtras,
} from '../registrationForm'

type ActivityStepProps = {
  activityLabel: string
  seasonName: string
  form: RegistrationCommonForm
  onChange: (next: RegistrationCommonForm) => void
  swimming?: SwimmingFormExtras
  onSwimmingChange?: (next: SwimmingFormExtras) => void
  /** Fixed weekly sessions for GROUP swimming (from admin settings). */
  swimmingGroupWeeklySessions?: number
  footballMatchedGroup?: FootballCatalogResponse['groups'][number] | null
  disabled?: boolean
}

function formatTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value
}

export function ActivityStep({
  activityLabel,
  seasonName,
  form,
  onChange,
  swimming,
  onSwimmingChange,
  swimmingGroupWeeklySessions = 2,
  footballMatchedGroup,
  disabled = false,
}: ActivityStepProps) {
  const isGroupLesson = swimming?.swimmingLessonType === 'GROUP'
  const swimmingWeeklyValue = isGroupLesson
    ? String(swimmingGroupWeeklySessions)
    : (swimming?.weeklySessions ?? '1')

  return (
    <div className="wizard-fields">
      <div className="wizard-fields__row">
        <label className="admin-form__field">
          <span>{t('registration.activityLabel')}</span>
          <input value={activityLabel} disabled readOnly />
        </label>
        <label className="admin-form__field">
          <span>{t('registration.seasonLabel')}</span>
          <input value={seasonName} disabled readOnly />
        </label>
      </div>

      {footballMatchedGroup === null && (
        <p className="wizard-card__error" role="alert">
          {t('wizard.errors.footballNoGroup')}
        </p>
      )}

      {footballMatchedGroup != null && (
        <div className="football-catalog__group football-catalog__group--match football-activity-summary">
          <div className="football-catalog__group-head">
            <h3 className="football-catalog__group-name">
              {footballMatchedGroup.name}
            </h3>
            <span className="football-catalog__match-badge">
              {footballMatchedGroup.weeklySessions != null
                ? t('footballCatalog.priceBySessions', {
                    count: footballMatchedGroup.weeklySessions,
                  })
                : t('footballCatalog.weeklySessions')}
            </span>
          </div>
          <div className="football-catalog__sessions">
            <span className="football-catalog__label">
              {t('footballCatalog.schedule')}
            </span>
            <ul className="football-catalog__session-list">
              {footballMatchedGroup.trainingSessions
                .filter((session) => session.isActive)
                .map((session) => (
                  <li key={session.id}>
                    {dayOfWeekLabel(session.dayOfWeek)}{' '}
                    {formatTime(session.startTime)}
                    {session.endTime
                      ? `–${formatTime(session.endTime)}`
                      : ''}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {swimming && onSwimmingChange && (
        <>
          <label className="admin-form__field">
            <span>{t('registration.lessonType')}</span>
            <select
              value={swimming.swimmingLessonType}
              disabled={disabled}
              onChange={(event) => {
                const nextType = event.target.value as SwimmingLessonType
                onSwimmingChange({
                  ...swimming,
                  swimmingLessonType: nextType,
                  weeklySessions:
                    nextType === 'GROUP'
                      ? String(swimmingGroupWeeklySessions)
                      : swimming.weeklySessions === String(swimmingGroupWeeklySessions)
                        ? '1'
                        : swimming.weeklySessions,
                })
              }}
              required
            >
              {SWIMMING_LESSON_TYPES.map((type) => (
                <option key={type} value={type}>
                  {swimmingLessonTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-form__field">
            <span>{t('registration.waterAdaptationLevel')}</span>
            <select
              value={swimming.waterAdaptationLevel}
              disabled={disabled}
              onChange={(event) =>
                onSwimmingChange({
                  ...swimming,
                  waterAdaptationLevel: event.target
                    .value as WaterAdaptationLevel,
                })
              }
              required
            >
              {WATER_ADAPTATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {waterAdaptationLevelLabel(level)}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-form__field">
            <span>{t('registration.weeklySessions')}</span>
            {isGroupLesson ? (
              <>
                <input
                  value={swimmingWeeklyValue}
                  disabled
                  readOnly
                />
                <span className="admin-form__hint">
                  {t('registration.groupWeeklySessionsFixed', {
                    count: swimmingGroupWeeklySessions,
                  })}
                </span>
              </>
            ) : (
              <select
                value={swimmingWeeklyValue}
                disabled={disabled}
                onChange={(event) =>
                  onSwimmingChange({
                    ...swimming,
                    weeklySessions: event.target.value,
                  })
                }
                required
              >
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={String(value)}>
                    {value}
                  </option>
                ))}
              </select>
            )}
          </label>
        </>
      )}

      <label className="admin-form__field">
        <span>{t('registration.specialRequests')}</span>
        <textarea
          rows={2}
          value={form.specialRequests}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...form, specialRequests: event.target.value })
          }
        />
      </label>
    </div>
  )
}
