import type { ReactNode } from 'react'
import { WizardStepper } from './WizardStepper'

type WizardShellProps = {
  title: string
  subtitle?: string | null
  steps: { id: string; label: string }[]
  currentIndex: number
  showStepper?: boolean
  error?: string | null
  bodyClassName?: string
  headerBrand?: ReactNode
  children: ReactNode
  footer: ReactNode
}

export function WizardShell({
  title,
  subtitle,
  steps,
  currentIndex,
  showStepper = true,
  error,
  bodyClassName,
  headerBrand,
  children,
  footer,
}: WizardShellProps) {
  const bodyClass = ['wizard-card__body', bodyClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="wizard-page">
      <div className="wizard-card">
        <header className="wizard-card__header">
          <div className="wizard-card__title-row">
            <div className="wizard-card__titles">
              <h1>{title}</h1>
              {subtitle && <p className="wizard-card__subtitle">{subtitle}</p>}
            </div>
            {headerBrand}
          </div>
          {showStepper && (
            <WizardStepper steps={steps} currentIndex={currentIndex} />
          )}
        </header>

        {error && (
          <p className="wizard-card__error" role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        <div className={bodyClass}>{children}</div>

        <footer className="wizard-card__footer">{footer}</footer>
      </div>
    </section>
  )
}
