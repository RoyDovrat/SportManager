import {
  AGE_GROUPS,
  GENDERS,
  type AgeGroup,
  type Gender,
} from '../../types/enums'
import { ageGroupLabel, genderLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import type { RegistrationCommonForm } from './registrationForm'

type RegistrationCommonFieldsProps = {
  form: RegistrationCommonForm
  onChange: (next: RegistrationCommonForm) => void
  disabled?: boolean
}

export function RegistrationCommonFields({
  form,
  onChange,
  disabled = false,
}: RegistrationCommonFieldsProps) {
  function update<K extends keyof RegistrationCommonForm>(
    key: K,
    value: RegistrationCommonForm[K],
  ) {
    onChange({ ...form, [key]: value })
  }

  return (
    <div className="registration-fields">
      <fieldset className="registration-fieldset" disabled={disabled}>
        <legend>{t('registration.parent')}</legend>

        <label className="admin-form__field">
          <span>{t('registration.firstName')}</span>
          <input
            value={form.parentFirstName}
            onChange={(event) => update('parentFirstName', event.target.value)}
            required
          />
        </label>

        <label className="admin-form__field">
          <span>{t('registration.lastName')}</span>
          <input
            value={form.parentLastName}
            onChange={(event) => update('parentLastName', event.target.value)}
            required
          />
        </label>

        <label className="admin-form__field">
          <span>{t('registration.phone')}</span>
          <input
            value={form.phoneNumber}
            onChange={(event) => update('phoneNumber', event.target.value)}
            required
          />
        </label>

        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={form.isKibbutzMember}
            onChange={(event) => {
              const isKibbutzMember = event.target.checked
              onChange({
                ...form,
                isKibbutzMember,
                budgetNumber: isKibbutzMember ? form.budgetNumber : '',
              })
            }}
          />
          <span>{t('registration.kibbutzMember')}</span>
        </label>

        {form.isKibbutzMember && (
          <label className="admin-form__field">
            <span>{t('registration.budgetNumber')}</span>
            <input
              value={form.budgetNumber}
              onChange={(event) => update('budgetNumber', event.target.value)}
              required
            />
          </label>
        )}
      </fieldset>

      <fieldset className="registration-fieldset" disabled={disabled}>
        <legend>{t('registration.student')}</legend>

        <label className="admin-form__field">
          <span>{t('registration.firstName')}</span>
          <input
            value={form.studentFirstName}
            onChange={(event) => update('studentFirstName', event.target.value)}
            required
          />
        </label>

        <label className="admin-form__field">
          <span>{t('registration.lastName')}</span>
          <input
            value={form.studentLastName}
            onChange={(event) => update('studentLastName', event.target.value)}
            required
          />
        </label>

        <label className="admin-form__field">
          <span>{t('registration.identityNumber')}</span>
          <input
            value={form.studentIdentityNumber}
            onChange={(event) => update('studentIdentityNumber', event.target.value)}
            required
          />
        </label>

        <label className="admin-form__field">
          <span>{t('registration.age')}</span>
          <input
            type="number"
            min={1}
            value={form.age}
            onChange={(event) => update('age', event.target.value)}
            required
          />
        </label>

        <label className="admin-form__field">
          <span>{t('registration.ageGroup')}</span>
          <select
            value={form.ageGroup}
            onChange={(event) => update('ageGroup', event.target.value as AgeGroup)}
            required
          >
            {AGE_GROUPS.map((group) => (
              <option key={group} value={group}>
                {ageGroupLabel(group)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('registration.gender')}</span>
          <select
            value={form.gender}
            onChange={(event) => update('gender', event.target.value as Gender)}
            required
          >
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {genderLabel(gender)}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="registration-fieldset" disabled={disabled}>
        <legend>{t('registration.healthNotes')}</legend>

        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={form.hasMedicalLimitation}
            onChange={(event) => update('hasMedicalLimitation', event.target.checked)}
          />
          <span>{t('registration.hasMedicalLimitation')}</span>
        </label>

        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={form.healthDeclarationApproved}
            onChange={(event) => update('healthDeclarationApproved', event.target.checked)}
            required
          />
          <span>{t('registration.healthDeclaration')}</span>
        </label>

        <label className="admin-form__field">
          <span>{t('registration.medicalNotes')}</span>
          <textarea
            rows={3}
            value={form.medicalNotes}
            onChange={(event) => update('medicalNotes', event.target.value)}
          />
        </label>

        <label className="admin-form__field">
          <span>{t('registration.specialRequests')}</span>
          <textarea
            rows={3}
            value={form.specialRequests}
            onChange={(event) => update('specialRequests', event.target.value)}
          />
        </label>
      </fieldset>
    </div>
  )
}
