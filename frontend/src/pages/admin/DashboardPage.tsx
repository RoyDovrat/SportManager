import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getDashboard,
  type DashboardResponse,
} from '../../api/dashboard'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import {
  StatusBadge,
  registrationStatusTone,
} from '../../components/ui/StatusBadge'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import {
  activityTypeLabel,
  registrationStatusLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'

const FILTER_DEFAULTS = {
  seasonId: '',
}

function formatAmount(amount: number): string {
  return `₪${amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function registrationsLink(seasonId: string, status?: string): string {
  const params = new URLSearchParams()
  if (status) {
    params.set('status', status)
  }
  if (seasonId !== '') {
    params.set('seasonId', seasonId)
  }
  const query = params.toString()
  return query ? `/admin/registrations?${query}` : '/admin/registrations'
}

export function DashboardPage() {
  const { filters, setFilter, hasParam } = useUrlFilters(FILTER_DEFAULTS)
  const { seasonId } = filters

  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [catalogReady, setCatalogReady] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSeasons() {
      setError(null)
      try {
        const data = await listSeasons()
        setSeasons(data)
        if (!hasParam('seasonId')) {
          const active = data.find((season) => season.isActive)
          const defaultId = active?.id ?? data[0]?.id
          if (defaultId != null) {
            setFilter('seasonId', String(defaultId))
          }
        }
        setCatalogReady(true)
      } catch (err) {
        setError(formatApiError(err))
        setLoading(false)
      }
    }

    void loadSeasons()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load seasons once on mount
  }, [])

  useEffect(() => {
    if (!catalogReady) {
      return
    }

    async function loadDashboard() {
      setLoading(true)
      setError(null)
      try {
        const data = await getDashboard(
          seasonId === '' ? null : Number(seasonId),
        )
        setDashboard(data)
      } catch (err) {
        setError(formatApiError(err))
        setDashboard(null)
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [catalogReady, seasonId])

  const summary = dashboard?.paymentStatusSummary
  const hasAttention =
    dashboard != null &&
    (dashboard.pendingRegistrations > 0 || dashboard.openChargesCount > 0)

  return (
    <section className="admin-page admin-page--wide dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <h1>{t('dashboard.title')}</h1>
          <p className="admin-page__lede">{t('dashboard.welcomeLede')}</p>
        </div>

        <label className="dashboard-hero__season">
          <span>{t('dashboard.season')}</span>
          <select
            value={seasonId}
            onChange={(event) => setFilter('seasonId', event.target.value)}
            disabled={!catalogReady || seasons.length === 0}
          >
            {seasons.length === 0 ? (
              <option value="">{t('dashboard.noSeasons')}</option>
            ) : (
              seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} · {activityTypeLabel(season.activityType)}
                  {season.isActive ? ` (${t('common.active')})` : ''}
                </option>
              ))
            )}
          </select>
        </label>
      </header>

      {error && <p className="admin-page__error">{error}</p>}

      {dashboard?.seasonsNearingEnd && dashboard.seasonsNearingEnd.length > 0 && (
        <div className="admin-page__error" role="status">
          <h2>{t('dashboard.seasonEndAlertTitle')}</h2>
          {dashboard.seasonsNearingEnd.map((season) => (
            <p key={season.id}>
              {t('dashboard.seasonEndAlertBody', {
                name: season.name,
                sport: activityTypeLabel(season.activityType as 'FOOTBALL' | 'SWIMMING'),
                endDate: season.endDate,
              })}
            </p>
          ))}
          <p>
            <Link to="/admin/seasons">{t('dashboard.seasonEndAlertCta')}</Link>
          </p>
        </div>
      )}

      {loading ? (
        <p className="dashboard-loading">{t('common.loading')}</p>
      ) : dashboard === null ? (
        <p>{t('dashboard.loadFailed')}</p>
      ) : (
        <>
          {dashboard.seasonName && (
            <p className="dashboard-season-line">
              {t('dashboard.showingSeason')}:{' '}
              <strong>{dashboard.seasonName}</strong>
            </p>
          )}

          {hasAttention && (
            <section
              className="dashboard-attention"
              aria-label={t('dashboard.attentionTitle')}
            >
              <div className="dashboard-attention__head">
                <h2>{t('dashboard.attentionTitle')}</h2>
                <p>{t('dashboard.attentionHint')}</p>
              </div>
              <div className="dashboard-attention__grid">
                {dashboard.pendingRegistrations > 0 && (
                  <Link
                    to={registrationsLink(seasonId, 'PENDING')}
                    className="dashboard-attention__card dashboard-attention__card--pending"
                  >
                    <span className="dashboard-attention__label">
                      {t('dashboard.pendingRegistrations')}
                    </span>
                    <strong className="dashboard-attention__value">
                      {dashboard.pendingRegistrations}
                    </strong>
                    <span className="dashboard-attention__cta">
                      {t('dashboard.reviewPending')}
                    </span>
                  </Link>
                )}
                {dashboard.openChargesCount > 0 && (
                  <Link
                    to="/admin/payments?status=PENDING"
                    className="dashboard-attention__card dashboard-attention__card--charges"
                  >
                    <span className="dashboard-attention__label">
                      {t('dashboard.openCharges')}
                    </span>
                    <strong className="dashboard-attention__value">
                      {dashboard.openChargesCount}
                    </strong>
                    <span className="dashboard-attention__meta">
                      {formatAmount(dashboard.openChargesAmount)}
                    </span>
                    <span className="dashboard-attention__cta">
                      {t('dashboard.reviewCharges')}
                    </span>
                  </Link>
                )}
              </div>
            </section>
          )}

          <section
            className="dashboard-section"
            aria-label={t('dashboard.overviewTitle')}
          >
            <div className="dashboard-section__head">
              <h2>{t('dashboard.overviewTitle')}</h2>
              <p>{t('dashboard.overviewHint')}</p>
            </div>
            <div className="dashboard-stats">
              <article className="dashboard-stat dashboard-stat--total">
                <span className="dashboard-stat__label">
                  {t('dashboard.totalRegistrations')}
                </span>
                <strong className="dashboard-stat__value">
                  {dashboard.totalRegistrations}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--success">
                <span className="dashboard-stat__label">
                  {t('dashboard.approvedRegistrations')}
                </span>
                <strong className="dashboard-stat__value">
                  {dashboard.approvedRegistrations}
                </strong>
              </article>
              <article className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('dashboard.activeStudents')}
                </span>
                <strong className="dashboard-stat__value">
                  {dashboard.activeStudents}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--muted">
                <span className="dashboard-stat__label">
                  {t('dashboard.cancelledRegistrations')}
                </span>
                <strong className="dashboard-stat__value">
                  {dashboard.cancelledRegistrations}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--income">
                <span className="dashboard-stat__label">
                  {t('dashboard.monthlyIncome')}
                </span>
                <strong className="dashboard-stat__value">
                  {formatAmount(dashboard.monthlyIncome)}
                </strong>
                <span className="dashboard-stat__hint">
                  {t('dashboard.monthlyIncomeHint')}
                </span>
              </article>
              {!hasAttention && (
                <>
                  <article className="dashboard-stat dashboard-stat--pending">
                    <span className="dashboard-stat__label">
                      {t('dashboard.pendingRegistrations')}
                    </span>
                    <strong className="dashboard-stat__value">
                      <Link to={registrationsLink(seasonId, 'PENDING')}>
                        {dashboard.pendingRegistrations}
                      </Link>
                    </strong>
                  </article>
                  <article className="dashboard-stat dashboard-stat--pending">
                    <span className="dashboard-stat__label">
                      {t('dashboard.openCharges')}
                    </span>
                    <strong className="dashboard-stat__value">
                      <Link to="/admin/payments?status=PENDING">
                        {dashboard.openChargesCount} ·{' '}
                        {formatAmount(dashboard.openChargesAmount)}
                      </Link>
                    </strong>
                  </article>
                </>
              )}
            </div>
          </section>

          {summary && (
            <section
              className="dashboard-panel dashboard-panel--payments"
              aria-label={t('dashboard.paymentSummary')}
            >
              <div className="dashboard-section__head">
                <h2>{t('dashboard.paymentSummary')}</h2>
                <p>{t('dashboard.paymentSummaryHint')}</p>
              </div>
              <div className="dashboard-payment-row">
                <div className="dashboard-payment-pill dashboard-payment-pill--pending">
                  <span>{t('dashboard.pendingPayments')}</span>
                  <strong>
                    {summary.pendingCount}
                    <small>{formatAmount(summary.pendingAmount)}</small>
                  </strong>
                </div>
                <div className="dashboard-payment-pill dashboard-payment-pill--paid">
                  <span>{t('dashboard.paidPayments')}</span>
                  <strong>
                    {summary.paidCount}
                    <small>{formatAmount(summary.paidAmount)}</small>
                  </strong>
                </div>
                <div className="dashboard-payment-pill dashboard-payment-pill--cancelled">
                  <span>{t('dashboard.cancelledPayments')}</span>
                  <strong>
                    {summary.cancelledCount}
                    <small>{formatAmount(summary.cancelledAmount)}</small>
                  </strong>
                </div>
              </div>
            </section>
          )}

          <section
            className="dashboard-panel"
            aria-label={t('dashboard.recentRegistrations')}
          >
            <div className="dashboard-section__head dashboard-section__head--row">
              <div>
                <h2>{t('dashboard.recentRegistrations')}</h2>
                <p>{t('dashboard.recentHint')}</p>
              </div>
              <Link
                to={registrationsLink(seasonId)}
                className="btn btn--secondary dashboard-panel__link"
              >
                {t('dashboard.viewAllRegistrations')}
              </Link>
            </div>

            {dashboard.recentRegistrations.length === 0 ? (
              <p className="dashboard-empty">{t('dashboard.recentEmpty')}</p>
            ) : (
              <ul className="dashboard-recent">
                {dashboard.recentRegistrations.map((row) => (
                  <li key={row.id} className="dashboard-recent__item">
                    <div className="dashboard-recent__main">
                      <strong>
                        {row.studentFirstName} {row.studentLastName}
                      </strong>
                      <span className="dashboard-recent__meta">
                        {activityTypeLabel(row.activityType)} ·{' '}
                        {row.registrationDate}
                      </span>
                    </div>
                    <StatusBadge tone={registrationStatusTone(row.status)}>
                      {registrationStatusLabel(row.status)}
                    </StatusBadge>
                    <div className="dashboard-recent__actions">
                      <Link
                        to={`/admin/registrations/${row.id}`}
                        className="reg-action reg-action--view"
                      >
                        {t('common.view')}
                      </Link>
                      <Link
                        to={`/admin/registrations/${row.id}?edit=1`}
                        className="reg-action reg-action--edit"
                      >
                        {t('common.edit')}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </>
      )}
    </section>
  )
}
