import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  getSeasonReport,
  type SeasonReportResponse,
} from '../../api/reports'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import { BreakdownChart } from '../../components/ui/BreakdownChart'
import {
  StatusBadge,
  paymentStatusTone,
  registrationStatusTone,
} from '../../components/ui/StatusBadge'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import {
  activityTypeLabel,
  paymentStatusLabel,
  paymentTypeLabel,
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

function countByActivity(report: SeasonReportResponse): {
  football: number
  swimming: number
} {
  let football = 0
  let swimming = 0
  for (const row of report.registrations.items) {
    if (row.activityType === 'FOOTBALL') {
      football += 1
    } else if (row.activityType === 'SWIMMING') {
      swimming += 1
    }
  }
  return { football, swimming }
}

export function ReportsPage() {
  const { filters, setFilter, hasParam } = useUrlFilters(FILTER_DEFAULTS)
  const { seasonId } = filters

  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [catalogReady, setCatalogReady] = useState(false)
  const [report, setReport] = useState<SeasonReportResponse | null>(null)
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
    if (!catalogReady || seasonId === '') {
      if (catalogReady && seasonId === '') {
        setReport(null)
        setLoading(false)
      }
      return
    }

    async function loadReport() {
      setLoading(true)
      setError(null)
      try {
        const data = await getSeasonReport(Number(seasonId))
        setReport(data)
      } catch (err) {
        setError(formatApiError(err))
        setReport(null)
      } finally {
        setLoading(false)
      }
    }

    void loadReport()
  }, [catalogReady, seasonId])

  const activitySplit = useMemo(
    () => (report ? countByActivity(report) : { football: 0, swimming: 0 }),
    [report],
  )

  return (
    <section className="admin-page admin-page--wide reports-page">
      <header className="reports-hero">
        <div className="reports-hero__copy">
          <p className="reports-hero__eyebrow">{t('reports.eyebrow')}</p>
          <h1>{t('reports.title')}</h1>
          <p className="admin-page__lede">{t('reports.intro')}</p>
        </div>

        <label className="reports-hero__season">
          <span>{t('reports.season')}</span>
          <select
            value={seasonId}
            onChange={(event) => setFilter('seasonId', event.target.value)}
            disabled={!catalogReady || seasons.length === 0}
          >
            {seasons.length === 0 ? (
              <option value="">{t('reports.noSeasons')}</option>
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
      </header>

      {error && <p className="admin-page__error">{error}</p>}

      {loading ? (
        <p className="reports-loading">{t('common.loading')}</p>
      ) : report === null ? (
        <p>{t('reports.loadFailed')}</p>
      ) : (
        <>
          <p className="reports-season-line">
            {t('reports.showingSeason')}: <strong>{report.seasonName}</strong>
          </p>

          <nav className="reports-jump" aria-label={t('reports.jumpNav')}>
            <a href="#report-overview">{t('reports.overviewTitle')}</a>
            <a href="#report-registrations">{t('reports.registrationsTitle')}</a>
            <a href="#report-payments">{t('reports.paymentsTitle')}</a>
            <a href="#report-clothing">{t('reports.clothingTitle')}</a>
          </nav>

          <section
            id="report-overview"
            className="reports-panel reports-panel--overview"
            aria-label={t('reports.overviewTitle')}
          >
            <div className="reports-panel__head">
              <h2>{t('reports.overviewTitle')}</h2>
              <p>{t('reports.overviewHint')}</p>
            </div>

            <div className="reports-kpi-grid">
              <article className="reports-kpi reports-kpi--blue">
                <span>{t('reports.total')}</span>
                <strong>{report.registrations.total}</strong>
                <small>{t('reports.registrationsTitle')}</small>
              </article>
              <article className="reports-kpi reports-kpi--green">
                <span>{t('reports.activeStudents')}</span>
                <strong>{report.registrations.activeStudents}</strong>
                <small>{t('reports.approved')}</small>
              </article>
              <article className="reports-kpi reports-kpi--pending">
                <span>{t('reports.pending')}</span>
                <strong>
                  {report.payments.pendingCount}
                </strong>
                <small>{formatAmount(report.payments.pendingAmount)}</small>
              </article>
              <article className="reports-kpi reports-kpi--blue">
                <span>{t('reports.totalOrders')}</span>
                <strong>{report.clothing.totalOrders}</strong>
                <small>{t('reports.clothingTitle')}</small>
              </article>
            </div>

            <div className="reports-charts">
              <BreakdownChart
                title={t('reports.chartRegistrations')}
                emptyLabel={t('reports.chartEmpty')}
                description={t('reports.chartRegistrationsDesc')}
                items={[
                  {
                    key: 'pending',
                    label: t('reports.pending'),
                    value: report.registrations.pending,
                    tone: 'pending',
                  },
                  {
                    key: 'approved',
                    label: t('reports.approved'),
                    value: report.registrations.approved,
                    tone: 'green',
                  },
                  {
                    key: 'cancelled',
                    label: t('reports.cancelled'),
                    value: report.registrations.cancelled,
                    tone: 'danger',
                  },
                ]}
              />
              <BreakdownChart
                title={t('reports.chartPayments')}
                emptyLabel={t('reports.chartEmpty')}
                description={t('reports.chartPaymentsDesc')}
                items={[
                  {
                    key: 'pending',
                    label: t('reports.pending'),
                    value: report.payments.pendingAmount,
                    tone: 'pending',
                    detail: formatAmount(report.payments.pendingAmount),
                  },
                  {
                    key: 'paid',
                    label: t('reports.paid'),
                    value: report.payments.paidAmount,
                    tone: 'green',
                    detail: formatAmount(report.payments.paidAmount),
                  },
                  {
                    key: 'cancelled',
                    label: t('reports.cancelled'),
                    value: report.payments.cancelledAmount,
                    tone: 'danger',
                    detail: formatAmount(report.payments.cancelledAmount),
                  },
                ]}
              />
              <BreakdownChart
                title={t('reports.chartActivities')}
                emptyLabel={t('reports.chartEmpty')}
                description={t('reports.chartActivitiesDesc')}
                items={[
                  {
                    key: 'football',
                    label: activityTypeLabel('FOOTBALL'),
                    value: activitySplit.football,
                    tone: 'green',
                  },
                  {
                    key: 'swimming',
                    label: activityTypeLabel('SWIMMING'),
                    value: activitySplit.swimming,
                    tone: 'blue',
                  },
                ]}
              />
              <BreakdownChart
                title={t('reports.chartClothing')}
                emptyLabel={t('reports.chartEmpty')}
                description={t('reports.chartClothingDesc')}
                items={[
                  {
                    key: 'pay',
                    label: t('reports.ordersRequiringPayment'),
                    value: report.clothing.ordersRequiringPayment,
                    tone: 'pending',
                  },
                  {
                    key: 'skip',
                    label: t('reports.alreadyHasClothing'),
                    value: report.clothing.alreadyHasClothingCount,
                    tone: 'muted',
                  },
                ]}
              />
            </div>
          </section>

          <section
            id="report-registrations"
            className="reports-panel"
            aria-label={t('reports.registrationsTitle')}
          >
            <div className="reports-panel__head reports-panel__head--row">
              <div>
                <h2>{t('reports.registrationsTitle')}</h2>
                <p>{t('reports.registrationsHint')}</p>
              </div>
              <Link
                to={`/admin/registrations?seasonId=${encodeURIComponent(seasonId)}`}
                className="btn btn--secondary"
              >
                {t('reports.openRegistrations')}
              </Link>
            </div>

            <div className="dashboard-stats">
              <article className="dashboard-stat dashboard-stat--total">
                <span className="dashboard-stat__label">{t('reports.total')}</span>
                <strong className="dashboard-stat__value">
                  {report.registrations.total}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--pending">
                <span className="dashboard-stat__label">
                  {t('reports.pending')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.registrations.pending}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--success">
                <span className="dashboard-stat__label">
                  {t('reports.approved')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.registrations.approved}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--muted">
                <span className="dashboard-stat__label">
                  {t('reports.cancelled')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.registrations.cancelled}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--success">
                <span className="dashboard-stat__label">
                  {t('reports.activeStudents')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.registrations.activeStudents}
                </strong>
              </article>
            </div>

            <div className="admin-table-wrap admin-table-wrap--scroll">
              {report.registrations.items.length === 0 ? (
                <p className="dashboard-empty">{t('reports.registrationsEmpty')}</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('common.id')}</th>
                      <th>{t('reports.student')}</th>
                      <th>{t('reports.activity')}</th>
                      <th>{t('common.status')}</th>
                      <th>{t('reports.date')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.registrations.items.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>
                          {row.studentFirstName} {row.studentLastName}
                        </td>
                        <td>{activityTypeLabel(row.activityType)}</td>
                        <td>
                          <StatusBadge
                            tone={registrationStatusTone(row.status)}
                          >
                            {registrationStatusLabel(row.status)}
                          </StatusBadge>
                        </td>
                        <td>{row.registrationDate}</td>
                        <td className="admin-table__actions">
                          <Link
                            to={`/admin/registrations/${row.id}`}
                            className="reg-action reg-action--view"
                          >
                            {t('reports.view')}
                          </Link>
                          <Link
                            to={`/admin/registrations/${row.id}?edit=1`}
                            className="reg-action reg-action--edit"
                          >
                            {t('reports.edit')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section
            id="report-payments"
            className="reports-panel"
            aria-label={t('reports.paymentsTitle')}
          >
            <div className="reports-panel__head reports-panel__head--row">
              <div>
                <h2>{t('reports.paymentsTitle')}</h2>
                <p>{t('reports.paymentsHint')}</p>
              </div>
              <Link to="/admin/payments" className="btn btn--secondary">
                {t('reports.openPayments')}
              </Link>
            </div>

            <div className="dashboard-payment-row">
              <div className="dashboard-payment-pill dashboard-payment-pill--pending">
                <span>{t('reports.pending')}</span>
                <strong>
                  {report.payments.pendingCount}
                  <small>{formatAmount(report.payments.pendingAmount)}</small>
                </strong>
              </div>
              <div className="dashboard-payment-pill dashboard-payment-pill--paid">
                <span>{t('reports.paid')}</span>
                <strong>
                  {report.payments.paidCount}
                  <small>{formatAmount(report.payments.paidAmount)}</small>
                </strong>
              </div>
              <div className="dashboard-payment-pill dashboard-payment-pill--cancelled">
                <span>{t('reports.cancelled')}</span>
                <strong>
                  {report.payments.cancelledCount}
                  <small>
                    {formatAmount(report.payments.cancelledAmount)}
                  </small>
                </strong>
              </div>
            </div>

            <div className="admin-table-wrap admin-table-wrap--scroll">
              {report.payments.items.length === 0 ? (
                <p className="dashboard-empty">{t('reports.paymentsEmpty')}</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('common.id')}</th>
                      <th>{t('reports.student')}</th>
                      <th>{t('reports.amount')}</th>
                      <th>{t('reports.type')}</th>
                      <th>{t('common.status')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.payments.items.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>
                          {row.studentFirstName} {row.studentLastName}
                        </td>
                        <td>{formatAmount(row.amount)}</td>
                        <td>{paymentTypeLabel(row.paymentType)}</td>
                        <td>
                          <StatusBadge tone={paymentStatusTone(row.status)}>
                            {paymentStatusLabel(row.status)}
                          </StatusBadge>
                        </td>
                        <td className="admin-table__actions">
                          <Link
                            to={`/admin/payments/${row.id}`}
                            className="reg-action reg-action--view"
                          >
                            {t('reports.view')}
                          </Link>
                          <Link
                            to={`/admin/payments/${row.id}?edit=1`}
                            className="reg-action reg-action--edit"
                          >
                            {t('reports.edit')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section
            id="report-clothing"
            className="reports-panel"
            aria-label={t('reports.clothingTitle')}
          >
            <div className="reports-panel__head reports-panel__head--row">
              <div>
                <h2>{t('reports.clothingTitle')}</h2>
                <p>{t('reports.clothingHint')}</p>
              </div>
              <Link to="/admin/clothing-orders" className="btn btn--secondary">
                {t('reports.openClothing')}
              </Link>
            </div>

            <div className="dashboard-stats">
              <article className="dashboard-stat dashboard-stat--total">
                <span className="dashboard-stat__label">
                  {t('reports.totalOrders')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.clothing.totalOrders}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--pending">
                <span className="dashboard-stat__label">
                  {t('reports.ordersRequiringPayment')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.clothing.ordersRequiringPayment}
                </strong>
              </article>
              <article className="dashboard-stat dashboard-stat--muted">
                <span className="dashboard-stat__label">
                  {t('reports.alreadyHasClothing')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.clothing.alreadyHasClothingCount}
                </strong>
              </article>
            </div>

            <div className="admin-table-wrap admin-table-wrap--scroll">
              {report.clothing.items.length === 0 ? (
                <p className="dashboard-empty">{t('reports.clothingEmpty')}</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('common.id')}</th>
                      <th>{t('reports.student')}</th>
                      <th>{t('reports.alreadyHas')}</th>
                      <th>{t('reports.paymentRequired')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.clothing.items.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>
                          {row.studentFirstName} {row.studentLastName}
                        </td>
                        <td>
                          {row.alreadyHasClothing
                            ? t('common.yes')
                            : t('common.no')}
                        </td>
                        <td>
                          {row.clothingPaymentRequired
                            ? t('common.yes')
                            : t('common.no')}
                        </td>
                        <td className="admin-table__actions">
                          <Link
                            to={`/admin/clothing-orders/${row.id}`}
                            className="reg-action reg-action--view"
                          >
                            {t('reports.view')}
                          </Link>
                          <Link
                            to={`/admin/clothing-orders/${row.id}?edit=1`}
                            className="reg-action reg-action--edit"
                          >
                            {t('reports.edit')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  )
}
