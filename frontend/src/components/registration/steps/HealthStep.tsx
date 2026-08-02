import { t } from '../../../i18n/t'
import type { RegistrationCommonForm } from '../registrationForm'
import { HealthDeclarationApproval } from '../HealthDeclarationApproval'

type HealthStepProps = {
  form: RegistrationCommonForm
  onChange: (next: RegistrationCommonForm) => void
  disabled?: boolean
}

export function HealthStep({ form, onChange, disabled = false }: HealthStepProps) {
  return (
    <div className="wizard-fields">
      <fieldset className="wizard-radio-group" disabled={disabled}>
        <legend>{t('registration.medicalLimitationTitle')}</legend>
        <div className="wizard-radio-group__options wizard-radio-group__options--stack">
          <label className="wizard-radio">
            <input
              type="radio"
              name="medicalLimitation"
              checked={!form.hasMedicalLimitation}
              onChange={() =>
                onChange({
                  ...form,
                  hasMedicalLimitation: false,
                  medicalNotes: '',
                })
              }
            />
            <span>{t('registration.noMedicalLimitation')}</span>
          </label>
          <label className="wizard-radio">
            <input
              type="radio"
              name="medicalLimitation"
              checked={form.hasMedicalLimitation}
              onChange={() =>
                onChange({ ...form, hasMedicalLimitation: true })
              }
            />
            <span>{t('registration.hasMedicalLimitation')}</span>
          </label>
        </div>
      </fieldset>

      {form.hasMedicalLimitation && (
        <label className="admin-form__field">
          <span>{t('registration.medicalNotes')}</span>
          <textarea
            rows={2}
            value={form.medicalNotes}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...form, medicalNotes: event.target.value })
            }
          />
        </label>
      )}

      <HealthDeclarationApproval
        checked={form.healthDeclarationApproved}
        disabled={disabled}
        onChange={(healthDeclarationApproved) =>
          onChange({ ...form, healthDeclarationApproved })
        }
      />
    </div>
  )
}
