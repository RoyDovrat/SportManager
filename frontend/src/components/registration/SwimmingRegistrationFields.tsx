import {
  SWIMMING_LESSON_TYPES,
  WATER_ADAPTATION_LEVELS,
  type SwimmingLessonType,
  type WaterAdaptationLevel,
} from '../../types/enums'
import {
  swimmingLessonTypeLabel,
  waterAdaptationLevelLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import type { SwimmingFormExtras } from './registrationForm'

type SwimmingRegistrationFieldsProps = {
  form: SwimmingFormExtras
  onChange: (next: SwimmingFormExtras) => void
  disabled?: boolean
}

export function SwimmingRegistrationFields({
  form,
  onChange,
  disabled = false,
}: SwimmingRegistrationFieldsProps) {
  function update<K extends keyof SwimmingFormExtras>(
    key: K,
    value: SwimmingFormExtras[K],
  ) {
    onChange({ ...form, [key]: value })
  }

  return (
    <fieldset className="registration-fieldset" disabled={disabled}>
      <legend>{t('registration.swimmingDetails')}</legend>

      <label className="admin-form__field">
        <span>{t('registration.lessonType')}</span>
        <select
          value={form.swimmingLessonType}
          onChange={(event) =>
            update('swimmingLessonType', event.target.value as SwimmingLessonType)
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
          value={form.waterAdaptationLevel}
          onChange={(event) =>
            update('waterAdaptationLevel', event.target.value as WaterAdaptationLevel)
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
        <input
          type="number"
          min={1}
          value={form.weeklySessions}
          onChange={(event) => update('weeklySessions', event.target.value)}
          required
        />
      </label>
    </fieldset>
  )
}
