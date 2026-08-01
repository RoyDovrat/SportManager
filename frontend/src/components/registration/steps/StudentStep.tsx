import {
  AGE_GROUPS,
  GENDERS,
  type AgeGroup,
  type Gender,
} from '../../../types/enums'
import { ageGroupLabel, genderLabel } from '../../../i18n/labels'
import { t } from '../../../i18n/t'
import type { RegistrationCommonForm } from '../registrationForm'

type StudentStepProps = {
  form: RegistrationCommonForm
  onChange: (next: RegistrationCommonForm) => void
  disabled?: boolean
}

export function StudentStep({
  form,
  onChange,
  disabled = false,
}: StudentStepProps) {
  function update<K extends keyof RegistrationCommonForm>(
    key: K,
    value: RegistrationCommonForm[K],
  ) {
    onChange({ ...form, [key]: value })
  }

  return (
    <div className="wizard-fields">
      <div className="wizard-fields__row">
        <label className="admin-form__field">
          <span>{t('registration.firstName')}</span>
          <input
            value={form.studentFirstName}
            onChange={(event) => update('studentFirstName', event.target.value)}
            required
            disabled={disabled}
            autoFocus
          />
        </label>
        <label className="admin-form__field">
          <span>{t('registration.lastName')}</span>
          <input
            value={form.studentLastName}
            onChange={(event) => update('studentLastName', event.target.value)}
            required
            disabled={disabled}
          />
        </label>
      </div>

      <label className="admin-form__field">
        <span>{t('registration.identityNumber')}</span>
        <input
          value={form.studentIdentityNumber}
          onChange={(event) =>
            update('studentIdentityNumber', event.target.value)
          }
          required
          disabled={disabled}
          inputMode="numeric"
          autoComplete="off"
          maxLength={12}
        />
      </label>

      <div className="wizard-fields__row">
        <label className="admin-form__field">
          <span>{t('registration.age')}</span>
          <input
            type="number"
            min={1}
            value={form.age}
            onChange={(event) => update('age', event.target.value)}
            required
            disabled={disabled}
          />
        </label>
        <label className="admin-form__field">
          <span>{t('registration.ageGroup')}</span>
          <select
            value={form.ageGroup}
            onChange={(event) =>
              update('ageGroup', event.target.value as AgeGroup)
            }
            required
            disabled={disabled}
          >
            {AGE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {ageGroupLabel(group)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="wizard-radio-group" disabled={disabled}>
        <legend>{t('registration.gender')}</legend>
        <div className="wizard-radio-group__options">
          {GENDERS.map((gender) => (
            <label key={gender} className="wizard-radio">
              <input
                type="radio"
                name="gender"
                value={gender}
                checked={form.gender === gender}
                onChange={() => update('gender', gender as Gender)}
              />
              <span>{genderLabel(gender)}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
