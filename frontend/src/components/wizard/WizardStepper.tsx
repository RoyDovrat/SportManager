type WizardStep = {
  id: string
  label: string
}

type WizardStepperProps = {
  steps: WizardStep[]
  currentIndex: number
}

export function WizardStepper({ steps, currentIndex }: WizardStepperProps) {
  return (
    <ol
      className="wizard-stepper"
      aria-label="progress"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, index) => {
        const state =
          index < currentIndex
            ? 'done'
            : index === currentIndex
              ? 'active'
              : 'todo'
        return (
          <li key={step.id} className={`wizard-stepper__item wizard-stepper__item--${state}`}>
            <span className="wizard-stepper__dot" aria-hidden="true">
              {index + 1}
            </span>
            <span className="wizard-stepper__label">{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
