import { Link } from 'react-router-dom'
import type { PaymentStatusSummary } from '../../api/dashboard'
import { t } from '../../i18n/t'

type Slice = {
  key: string
  label: string
  count: number
  amount: number
  color: string
}

type PaymentSummaryCardProps = {
  title: string
  summary: PaymentStatusSummary
  viewTo: string
}

function formatAmount(amount: number): string {
  return `₪${amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function wedgePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polar(cx, cy, r, endAngle)
  const end = polar(cx, cy, r, startAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`
}

function slicesFromSummary(summary: PaymentStatusSummary): Slice[] {
  return [
    {
      key: 'paid',
      label: t('dashboard.paidPayments'),
      count: summary.paidCount,
      amount: summary.paidAmount,
      color: 'var(--accent-green)',
    },
    {
      key: 'pending',
      label: t('dashboard.pendingPayments'),
      count: summary.pendingCount,
      amount: summary.pendingAmount,
      color: 'var(--pending)',
    },
    {
      key: 'cancelled',
      label: t('dashboard.cancelledPayments'),
      count: summary.cancelledCount,
      amount: summary.cancelledAmount,
      color: 'var(--danger)',
    },
  ]
}

export function PaymentSummaryCard({
  title,
  summary,
  viewTo,
}: PaymentSummaryCardProps) {
  const slices = slicesFromSummary(summary)
  const amountTotal = slices.reduce((sum, slice) => sum + slice.amount, 0)
  const countTotal = slices.reduce((sum, slice) => sum + slice.count, 0)
  const pieTotal = amountTotal > 0 ? amountTotal : countTotal

  const description = slices
    .map(
      (slice) =>
        `${slice.label}: ${slice.count}, ${formatAmount(slice.amount)}`,
    )
    .join('. ')

  let angle = 0
  const wedges = slices
    .filter((slice) => (amountTotal > 0 ? slice.amount : slice.count) > 0)
    .map((slice) => {
      const value = amountTotal > 0 ? slice.amount : slice.count
      const sweep = pieTotal > 0 ? (value / pieTotal) * 360 : 0
      const start = angle
      const end = angle + sweep
      angle = end
      return { ...slice, start, end, sweep }
    })

  return (
    <article className="payment-summary-card">
      <h2>{title}</h2>
      <div className="payment-summary-card__body">
        <ul className="payment-summary-card__legend">
          {slices.map((slice) => (
            <li key={slice.key}>
              <span
                className="payment-summary-card__swatch"
                style={{ background: slice.color }}
                aria-hidden="true"
              />
              <span className="payment-summary-card__name">{slice.label}</span>
              <span className="payment-summary-card__count">{slice.count}</span>
              <span className="payment-summary-card__amount">
                {formatAmount(slice.amount)}
              </span>
            </li>
          ))}
        </ul>

        <div className="payment-summary-card__chart">
          {pieTotal <= 0 ? (
            <p className="payment-summary-card__empty">
              {t('dashboard.paymentChartEmpty')}
            </p>
          ) : (
            <svg
              viewBox="0 0 120 120"
              role="img"
              aria-label={`${title}. ${description}`}
            >
              {wedges.length === 1 ? (
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill={wedges[0].color}
                />
              ) : (
                wedges.map((wedge) =>
                  wedge.sweep >= 359.9 ? (
                    <circle
                      key={wedge.key}
                      cx="60"
                      cy="60"
                      r="54"
                      fill={wedge.color}
                    />
                  ) : (
                    <path
                      key={wedge.key}
                      d={wedgePath(60, 60, 54, wedge.start, wedge.end)}
                      fill={wedge.color}
                    />
                  ),
                )
              )}
              <circle cx="60" cy="60" r="28" fill="#fff" />
            </svg>
          )}
        </div>
      </div>
      <Link to={viewTo} className="payment-summary-card__view">
        {t('dashboard.viewAction')}
      </Link>
    </article>
  )
}
