type BreakdownItem = {
  key: string
  label: string
  value: number
  tone?: 'blue' | 'green' | 'pending' | 'danger' | 'muted'
  detail?: string
}

type BreakdownChartProps = {
  title: string
  items: BreakdownItem[]
  emptyLabel: string
  /** Shown in a live region for screen readers */
  description?: string
}

function toneClass(tone: BreakdownItem['tone']): string {
  switch (tone) {
    case 'green':
      return 'breakdown-chart__fill--green'
    case 'pending':
      return 'breakdown-chart__fill--pending'
    case 'danger':
      return 'breakdown-chart__fill--danger'
    case 'muted':
      return 'breakdown-chart__fill--muted'
    default:
      return 'breakdown-chart__fill--blue'
  }
}

export function BreakdownChart({
  title,
  items,
  emptyLabel,
  description,
}: BreakdownChartProps) {
  const max = Math.max(...items.map((item) => item.value), 0)
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <figure className="breakdown-chart" aria-label={title}>
      <figcaption className="breakdown-chart__caption">{title}</figcaption>
      {description && (
        <p className="visually-hidden">{description}</p>
      )}
      {total === 0 || max === 0 ? (
        <p className="breakdown-chart__empty">{emptyLabel}</p>
      ) : (
        <ul className="breakdown-chart__list">
          {items.map((item) => {
            const pct = max > 0 ? Math.round((item.value / max) * 100) : 0
            const share = total > 0 ? Math.round((item.value / total) * 100) : 0
            return (
              <li key={item.key} className="breakdown-chart__row">
                <div className="breakdown-chart__meta">
                  <span className="breakdown-chart__label">{item.label}</span>
                  <span className="breakdown-chart__value">
                    {item.detail ?? item.value}
                    <small>{share}%</small>
                  </span>
                </div>
                <div
                  className="breakdown-chart__track"
                  role="img"
                  aria-label={`${item.label}: ${item.value}${item.detail ? ` (${item.detail})` : ''}, ${share}%`}
                >
                  <div
                    className={`breakdown-chart__fill ${toneClass(item.tone)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </figure>
  )
}
