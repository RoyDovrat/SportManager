import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  getDashboard,
  type DashboardResponse,
} from '../../api/dashboard'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import { NavIcon } from '../../components/ui/NavIcon'
import { DateText } from '../../components/ui/DateText'
import { PaymentSummaryCard } from '../../components/ui/PaymentSummaryCard'
import {
  StatusBadge,
  registrationStatusTone,
} from '../../components/ui/StatusBadge'
import { formatIsoDate } from '../../utils/formatDate'
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

function currentMonthValue(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
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

function paymentsLink(monthValue?: string): string {
  const params = new URLSearchParams()
  params.set('status', '')
  if (monthValue) {
    params.set('chargeMonth', monthValue)
  }
  return `/admin/payments?${params.toString()}`
}

function groupsLink(seasonId: string): string {
  if (seasonId === '') {
    return '/admin/activity-groups'
  }
  return `/admin/activity-groups?seasonId=${encodeURIComponent(seasonId)}`
}

function MiniIcon({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <svg
      className="dashboard-mini-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{label}</title>
      {children}
    </svg>
  )
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

  const selectedSeason = seasons.find((season) => String(season.id) === seasonId)

  const emptyPaymentSummary = {
    pendingCount: 0,
    paidCount: 0,
    cancelledCount: 0,
    pendingAmount: 0,
    paidAmount: 0,
    cancelledAmount: 0,
  }

  return (
    <section className="admin-page admin-page--wide dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <h1>{t('dashboard.title')}</h1>
          <p className="admin-page__lede">{t('dashboard.welcomeLede')}</p>
        </div>

        <div className="seasons-hero-meta">
          <label
            className={
              selectedSeason?.isActive
                ? 'seasons-active-chip seasons-active-chip--on pricing-season-picker'
                : 'seasons-active-chip pricing-season-picker'
            }
          >
            <span className="seasons-active-chip__label">
              <NavIcon name="seasons" />
              {t('dashboard.season')}
            </span>
            <div className="seasons-active-chip__row">
              <select
                className="pricing-season-picker__select"
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
                      {season.isActive ? ` · ${t('common.active')}` : ''}
                    </option>
                  ))
                )}
              </select>
              {selectedSeason?.isActive && (
                <StatusBadge tone="success">{t('common.active')}</StatusBadge>
              )}
            </div>
          </label>
        </div>
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
                endDate: formatIsoDate(season.endDate),
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
          <section
            className="dashboard-attention"
            aria-label={t('dashboard.attentionTitle')}
          >
            <div className="dashboard-attention__head">
              <h2>{t('dashboard.attentionTitle')}</h2>
            </div>
            <div className="dashboard-attention__grid">
              <Link
                to={registrationsLink(seasonId, 'PENDING')}
                className="dashboard-attention__card dashboard-attention__card--pending"
              >
                <span className="dashboard-attention__icon" aria-hidden="true">
                  <MiniIcon label={t('dashboard.pendingRegistrations')}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </MiniIcon>
                </span>
                <span className="dashboard-attention__label">
                  {t('dashboard.pendingRegistrations')}
                </span>
                <strong className="dashboard-attention__value">
                  {dashboard.pendingRegistrations}
                </strong>
                <span className="dashboard-attention__cta">
                  {t('dashboard.viewAction')}
                </span>
              </Link>

              <Link
                to="/admin/payments?status=PENDING"
                className="dashboard-attention__card dashboard-attention__card--charges"
              >
                <span className="dashboard-attention__icon" aria-hidden="true">
                  <MiniIcon label={t('dashboard.openCharges')}>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 10h18" />
                    <path d="M7 15h4" />
                  </MiniIcon>
                </span>
                <span className="dashboard-attention__label">
                  {t('dashboard.openCharges')}
                </span>
                <strong className="dashboard-attention__value">
                  {formatAmount(dashboard.openChargesAmount)}
                </strong>
                <span className="dashboard-attention__cta">
                  {t('dashboard.viewAction')}
                </span>
              </Link>

              <Link
                to={groupsLink(seasonId)}
                className="dashboard-attention__card dashboard-attention__card--ungrouped"
              >
                <span className="dashboard-attention__icon" aria-hidden="true">
                  <MiniIcon label={t('dashboard.studentsWithoutGroup')}>
                    <path d="M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm9 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM3 19a5 5 0 0 1 10 0M14 19a5 5 0 0 1 7 0" />
                  </MiniIcon>
                </span>
                <span className="dashboard-attention__label">
                  {t('dashboard.studentsWithoutGroup')}
                </span>
                <strong className="dashboard-attention__value">
                  {dashboard.studentsWithoutGroup ?? 0}
                </strong>
                <span className="dashboard-attention__cta">
                  {t('dashboard.viewAction')}
                </span>
              </Link>
            </div>
          </section>

          <section
            className="dashboard-section"
            aria-label={t('dashboard.overviewTitle')}
          >
            <div className="dashboard-section__head">
              <h2>{t('dashboard.overviewTitle')}</h2>
            </div>
            <div className="dashboard-stats">
              <article className="dashboard-stat dashboard-stat--total">
                <span className="dashboard-stat__icon" aria-hidden="true">
                  <MiniIcon label={t('dashboard.totalRegistrations')}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </MiniIcon>
                </span>
                <span className="dashboard-stat__label">
                  {t('dashboard.totalRegistrations')}
                </span>
                <strong className="dashboard-stat__value">
                  {dashboard.totalRegistrations}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--success">
                <span className="dashboard-stat__icon" aria-hidden="true">
                  <MiniIcon label={t('dashboard.approvedRegistrations')}>
                    <path d="M20 6 9 17l-5-5" />
                  </MiniIcon>
                </span>
                <span className="dashboard-stat__label">
                  {t('dashboard.approvedRegistrations')}
                </span>
                <strong className="dashboard-stat__value">
                  {dashboard.approvedRegistrations}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--students">
                <span className="dashboard-stat__icon" aria-hidden="true">
                  <MiniIcon label={t('dashboard.activeStudents')}>
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </MiniIcon>
                </span>
                <span className="dashboard-stat__label">
                  {t('dashboard.activeStudents')}
                </span>
                <strong className="dashboard-stat__value">
                  {dashboard.activeStudents}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--muted">
                <span className="dashboard-stat__icon" aria-hidden="true">
                  <MiniIcon label={t('dashboard.cancelledRegistrations')}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="m15 9-6 6M9 9l6 6" />
                  </MiniIcon>
                </span>
                <span className="dashboard-stat__label">
                  {t('dashboard.cancelledRegistrations')}
                </span>
                <strong className="dashboard-stat__value">
                  {dashboard.cancelledRegistrations}
                </strong>
              </article>
            </div>
          </section>

          <section
            className="dashboard-payment-grid"
            aria-label={t('dashboard.paymentSummary')}
          >
            <PaymentSummaryCard
              title={t('dashboard.monthlyPaymentSummary')}
              summary={dashboard.monthlyPaymentSummary ?? emptyPaymentSummary}
              viewTo={paymentsLink(currentMonthValue())}
            />
            <PaymentSummaryCard
              title={t('dashboard.yearlyPaymentSummary')}
              summary={dashboard.yearlyPaymentSummary ?? emptyPaymentSummary}
              viewTo={paymentsLink()}
            />
          </section>

          <section
            className="dashboard-panel"
            aria-label={t('dashboard.recentRegistrations')}
          >
            <div className="dashboard-section__head dashboard-section__head--row">
              <div>
                <h2>{t('dashboard.recentRegistrations')}</h2>
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
              <div className="admin-table-wrap">
                <table className="admin-table dashboard-recent-table">
                  <thead>
                    <tr>
                      <th>{t('common.status')}</th>
                      <th>{t('dashboard.activity')}</th>
                      <th>{t('dashboard.student')}</th>
                      <th>{t('dashboard.dateAndTime')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentRegistrations.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <StatusBadge tone={registrationStatusTone(row.status)}>
                            {registrationStatusLabel(row.status)}
                          </StatusBadge>
                        </td>
                        <td>
                          <span className="dashboard-recent-table__activity">
                            <MiniIcon label={activityTypeLabel(row.activityType)}>
                              {row.activityType === 'SWIMMING' ? (
                                <path d="M2 16c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 7 0M2 12c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 7 0" />
                              ) : (
                                <circle cx="12" cy="12" r="9" />
                              )}
                            </MiniIcon>
                            {activityTypeLabel(row.activityType)}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/admin/registrations/${row.id}`}
                            className="dashboard-recent-table__student"
                          >
                            {row.studentFirstName} {row.studentLastName}
                          </Link>
                        </td>
                        <td className="dashboard-recent-table__datetime">
                          <DateText
                            value={row.registrationDate}
                            createdAt={row.createdAt ?? null}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}
