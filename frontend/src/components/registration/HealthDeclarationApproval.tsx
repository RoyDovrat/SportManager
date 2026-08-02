import { Link } from 'react-router-dom'
import { t } from '../../i18n/t'

type HealthDeclarationApprovalProps = {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export function HealthDeclarationApproval({
  checked,
  disabled = false,
  onChange,
}: HealthDeclarationApprovalProps) {
  return (
    <div className="health-declaration-approval">
      <p className="health-declaration-approval__link-row">
        <Link
          to="/register/health-declaration"
          target="_blank"
          rel="noopener noreferrer"
          className="health-declaration-approval__link"
        >
          {t('registration.healthDeclarationLink')}
        </Link>
      </p>
      <label className="admin-form__checkbox admin-form__checkbox--emphasis">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          required
        />
        <span>{t('registration.healthDeclaration')}</span>
      </label>
    </div>
  )
}
