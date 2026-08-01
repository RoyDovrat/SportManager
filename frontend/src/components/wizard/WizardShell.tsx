import type { ReactNode } from 'react'
import { WizardStepper } from './WizardStepper'

type WizardShellProps = {
  title: string
  subtitle?: string | null
  steps: { id: string; label: string }[]
  currentIndex: number
  showStepper?: boolean
  error?: string | null
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
  children,
  footer,
}: WizardShellProps) {
  return (
    <section className="wizard-page">
      <div className="wizard-card">
        <header className="wizard-card__header">
          <h1>{title}</h1>
          {subtitle && <p className="wizard-card__subtitle">{subtitle}</p>}
          {showStepper && (
            <WizardStepper steps={steps} currentIndex={currentIndex} />
          )}
        </header>

        {error && <p className="wizard-card__error">{error}</p>}

        <div className="wizard-card__body">{children}</div>

        <footer className="wizard-card__footer">{footer}</footer>
      </div>
    </section>
  )
}
