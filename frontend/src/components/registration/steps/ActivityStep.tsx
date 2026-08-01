import {
  SWIMMING_LESSON_TYPES,
  WATER_ADAPTATION_LEVELS,
  type SwimmingLessonType,
  type WaterAdaptationLevel,
} from '../../../types/enums'
import {
  swimmingLessonTypeLabel,
  waterAdaptationLevelLabel,
} from '../../../i18n/labels'
import { t } from '../../../i18n/t'
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
  disabled?: boolean
}

export function ActivityStep({
  activityLabel,
  seasonName,
  form,
  onChange,
  swimming,
  onSwimmingChange,
  disabled = false,
}: ActivityStepProps) {
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

      {swimming && onSwimmingChange && (
        <>
          <label className="admin-form__field">
            <span>{t('registration.lessonType')}</span>
            <select
              value={swimming.swimmingLessonType}
              disabled={disabled}
              onChange={(event) =>
                onSwimmingChange({
                  ...swimming,
                  swimmingLessonType: event.target
                    .value as SwimmingLessonType,
                })
              }
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
            <select
              value={swimming.weeklySessions}
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
