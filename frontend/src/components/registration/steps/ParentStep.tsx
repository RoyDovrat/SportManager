import { t } from '../../../i18n/t'
import type { RegistrationCommonForm } from '../registrationForm'

type ParentStepProps = {
  form: RegistrationCommonForm
  onChange: (next: RegistrationCommonForm) => void
  disabled?: boolean
}

export function ParentStep({ form, onChange, disabled = false }: ParentStepProps) {
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
            value={form.parentFirstName}
            onChange={(event) => update('parentFirstName', event.target.value)}
            required
            disabled={disabled}
            autoFocus
          />
        </label>
        <label className="admin-form__field">
          <span>{t('registration.lastName')}</span>
          <input
            value={form.parentLastName}
            onChange={(event) => update('parentLastName', event.target.value)}
            required
            disabled={disabled}
          />
        </label>
      </div>

      <label className="admin-form__field">
        <span>{t('registration.phone')}</span>
        <input
          value={form.phoneNumber}
          onChange={(event) => update('phoneNumber', event.target.value)}
          required
          disabled={disabled}
          inputMode="tel"
          autoComplete="tel"
          maxLength={15}
        />
      </label>

      <label className="admin-form__checkbox">
        <input
          type="checkbox"
          checked={form.isKibbutzMember}
          disabled={disabled}
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
            disabled={disabled}
          />
        </label>
      )}
    </div>
  )
}
