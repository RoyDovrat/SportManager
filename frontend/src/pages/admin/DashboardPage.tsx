import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getDashboard,
  type DashboardResponse,
} from '../../api/dashboard'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import { useAuth } from '../../auth/AuthContext'
import {
  StatusBadge,
  registrationStatusTone,
} from '../../components/ui/StatusBadge'
import {
  activityTypeLabel,
  registrationStatusLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'

const quickLinks = [
  {
    to: '/admin/seasons',
    labelKey: 'nav.seasons',
    descriptionKey: 'adminHome.seasonsDesc',
  },
  {
    to: '/admin/activities',
    labelKey: 'nav.activities',
    descriptionKey: 'adminHome.activitiesDesc',
  },
  {
    to: '/admin/activity-pricing',
    labelKey: 'nav.activityPricing',
    descriptionKey: 'adminHome.activityPricingDesc',
  },
  {
    to: '/admin/clothing-pricing',
    labelKey: 'nav.clothingPricing',
    descriptionKey: 'adminHome.clothingPricingDesc',
  },
  {
    to: '/admin/registrations',
    labelKey: 'nav.registrations',
    descriptionKey: 'adminHome.registrationsDesc',
  },
  {
    to: '/admin/clothing-orders',
    labelKey: 'nav.clothingOrders',
    descriptionKey: 'adminHome.clothingOrdersDesc',
  },
  {
    to: '/admin/payments',
    labelKey: 'nav.payments',
    descriptionKey: 'adminHome.paymentsDesc',
  },
  {
    to: '/admin/activity-groups',
    labelKey: 'nav.activityGroups',
    descriptionKey: 'adminHome.activityGroupsDesc',
  },
  {
    to: '/admin/exports/kibbutz',
    labelKey: 'nav.kibbutzExport',
    descriptionKey: 'adminHome.kibbutzExportDesc',
  },
  {
    to: '/admin/reports',
    labelKey: 'nav.reports',
    descriptionKey: 'adminHome.reportsDesc',
  },
] as const

function formatAmount(amount: number): string {
  return amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function DashboardPage() {
  const { username } = useAuth()
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [seasonId, setSeasonId] = useState('')
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
        const active = data.find((season) => season.isActive)
        const defaultId = active?.id ?? data[0]?.id
        if (defaultId != null) {
          setSeasonId(String(defaultId))
        }
        setCatalogReady(true)
      } catch (err) {
        setError(formatApiError(err))
        setLoading(false)
      }
    }

    void loadSeasons()
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

  return (
    <section className="admin-page admin-page--wide">
      <h1>{t('dashboard.title')}</h1>
      <p>
        {t('dashboard.signedIn')} <strong>{username}</strong>.
      </p>
      <p>{t('dashboard.intro')}</p>

      {error && <p className="admin-page__error">{error}</p>}

      <div className="admin-filters">
        <label className="admin-form__field">
          <span>{t('dashboard.season')}</span>
          <select
            value={seasonId}
            onChange={(event) => setSeasonId(event.target.value)}
            disabled={!catalogReady || seasons.length === 0}
          >
            {seasons.length === 0 ? (
              <option value="">{t('dashboard.noSeasons')}</option>
            ) : (
              seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                  {season.isActive ? ` (${t('common.active')})` : ''}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : dashboard === null ? (
        <p>{t('dashboard.loadFailed')}</p>
      ) : (
        <>
          {dashboard.seasonName && (
            <p>
              {t('dashboard.showingSeason')}:{' '}
              <strong>{dashboard.seasonName}</strong>
            </p>
          )}

          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">
                {t('dashboard.totalRegistrations')}
              </span>
              <strong className="dashboard-stat__value">
                {dashboard.totalRegistrations}
              </strong>
            </div>
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">
                {t('dashboard.pendingRegistrations')}
              </span>
              <strong className="dashboard-stat__value">
                <Link
                  to={
                    seasonId === ''
                      ? '/admin/registrations?status=PENDING'
                      : `/admin/registrations?status=PENDING&seasonId=${encodeURIComponent(seasonId)}`
                  }
                >
                  {dashboard.pendingRegistrations}
                </Link>
              </strong>
            </div>
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">
                {t('dashboard.approvedRegistrations')}
              </span>
              <strong className="dashboard-stat__value">
                {dashboard.approvedRegistrations}
              </strong>
            </div>
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">
                {t('dashboard.cancelledRegistrations')}
              </span>
              <strong className="dashboard-stat__value">
                {dashboard.cancelledRegistrations}
              </strong>
            </div>
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">
                {t('dashboard.activeStudents')}
              </span>
              <strong className="dashboard-stat__value">
                {dashboard.activeStudents}
              </strong>
            </div>
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">
                {t('dashboard.openCharges')}
              </span>
              <strong className="dashboard-stat__value">
                <Link to="/admin/payments?status=PENDING">
                  {dashboard.openChargesCount} ·{' '}
                  {formatAmount(dashboard.openChargesAmount)}
                </Link>
              </strong>
            </div>
            <div className="dashboard-stat">
              <span className="dashboard-stat__label">
                {t('dashboard.monthlyIncome')}
              </span>
              <strong className="dashboard-stat__value">
                {formatAmount(dashboard.monthlyIncome)}
              </strong>
              <span className="dashboard-stat__hint">
                {t('dashboard.monthlyIncomeHint')}
              </span>
            </div>
          </div>

          {summary && (
            <div className="dashboard-panel">
              <h2>{t('dashboard.paymentSummary')}</h2>
              <div className="dashboard-stats">
                <div className="dashboard-stat">
                  <span className="dashboard-stat__label">
                    {t('dashboard.pendingPayments')}
                  </span>
                  <strong className="dashboard-stat__value">
                    {summary.pendingCount} ·{' '}
                    {formatAmount(summary.pendingAmount)}
                  </strong>
                </div>
                <div className="dashboard-stat">
                  <span className="dashboard-stat__label">
                    {t('dashboard.paidPayments')}
                  </span>
                  <strong className="dashboard-stat__value">
                    {summary.paidCount} · {formatAmount(summary.paidAmount)}
                  </strong>
                </div>
                <div className="dashboard-stat">
                  <span className="dashboard-stat__label">
                    {t('dashboard.cancelledPayments')}
                  </span>
                  <strong className="dashboard-stat__value">
                    {summary.cancelledCount} ·{' '}
                    {formatAmount(summary.cancelledAmount)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-panel">
            <h2>{t('dashboard.recentRegistrations')}</h2>
            {dashboard.recentRegistrations.length === 0 ? (
              <p>{t('dashboard.recentEmpty')}</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('common.id')}</th>
                      <th>{t('dashboard.student')}</th>
                      <th>{t('dashboard.activity')}</th>
                      <th>{t('common.status')}</th>
                      <th>{t('dashboard.registrationDate')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentRegistrations.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>
                          {row.studentFirstName} {row.studentLastName}
                        </td>
                        <td>{activityTypeLabel(row.activityType)}</td>
                        <td>
                          <StatusBadge tone={registrationStatusTone(row.status)}>
                            {registrationStatusLabel(row.status)}
                          </StatusBadge>
                        </td>
                        <td>{row.registrationDate}</td>
                        <td className="admin-table__actions">
                          <Link to={`/admin/registrations/${row.id}`}>
                            {t('dashboard.viewRegistration')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div className="dashboard-panel">
        <h2>{t('dashboard.quickLinks')}</h2>
        <ul className="admin-home__cards">
          {quickLinks.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="admin-home__card">
                <strong>{t(link.labelKey)}</strong>
                <span>{t(link.descriptionKey)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
