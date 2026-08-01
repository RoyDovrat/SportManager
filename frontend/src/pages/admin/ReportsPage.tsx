import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  getSeasonReport,
  type SeasonReportResponse,
} from '../../api/reports'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import {
  activityTypeLabel,
  paymentStatusLabel,
  paymentTypeLabel,
  registrationStatusLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'

function formatAmount(amount: number): string {
  return amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function ReportsPage() {
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [seasonId, setSeasonId] = useState('')
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

  return (
    <section className="admin-page admin-page--wide">
      <h1>{t('reports.title')}</h1>
      <p>{t('reports.intro')}</p>

      {error && <p className="admin-page__error">{error}</p>}

      <div className="admin-filters">
        <label className="admin-form__field">
          <span>{t('reports.season')}</span>
          <select
            value={seasonId}
            onChange={(event) => setSeasonId(event.target.value)}
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
      </div>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : report === null ? (
        <p>{t('reports.loadFailed')}</p>
      ) : (
        <>
          <p>
            {t('reports.showingSeason')}: <strong>{report.seasonName}</strong>
          </p>

          <section className="admin-detail__section">
            <h2>{t('reports.registrationsTitle')}</h2>
            <div className="dashboard-stats">
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.total')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.registrations.total}
                </strong>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.pending')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.registrations.pending}
                </strong>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.approved')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.registrations.approved}
                </strong>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.cancelled')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.registrations.cancelled}
                </strong>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.activeStudents')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.registrations.activeStudents}
                </strong>
              </div>
            </div>

            <div className="admin-table-wrap">
              {report.registrations.items.length === 0 ? (
                <p>{t('reports.registrationsEmpty')}</p>
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
                        <td>{registrationStatusLabel(row.status)}</td>
                        <td>{row.registrationDate}</td>
                        <td className="admin-table__actions">
                          <Link to={`/admin/registrations/${row.id}`}>
                            {t('reports.view')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="admin-detail__section">
            <h2>{t('reports.paymentsTitle')}</h2>
            <div className="dashboard-stats">
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.pending')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.payments.pendingCount} ·{' '}
                  {formatAmount(report.payments.pendingAmount)}
                </strong>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.paid')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.payments.paidCount} ·{' '}
                  {formatAmount(report.payments.paidAmount)}
                </strong>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.cancelled')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.payments.cancelledCount} ·{' '}
                  {formatAmount(report.payments.cancelledAmount)}
                </strong>
              </div>
            </div>

            <div className="admin-table-wrap">
              {report.payments.items.length === 0 ? (
                <p>{t('reports.paymentsEmpty')}</p>
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
                        <td>{paymentStatusLabel(row.status)}</td>
                        <td className="admin-table__actions">
                          <Link to={`/admin/payments/${row.id}`}>
                            {t('reports.view')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="admin-detail__section">
            <h2>{t('reports.clothingTitle')}</h2>
            <div className="dashboard-stats">
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.totalOrders')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.clothing.totalOrders}
                </strong>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.ordersRequiringPayment')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.clothing.ordersRequiringPayment}
                </strong>
              </div>
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">
                  {t('reports.alreadyHasClothing')}
                </span>
                <strong className="dashboard-stat__value">
                  {report.clothing.alreadyHasClothingCount}
                </strong>
              </div>
            </div>

            <div className="admin-table-wrap">
              {report.clothing.items.length === 0 ? (
                <p>{t('reports.clothingEmpty')}</p>
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
                          <Link to={`/admin/clothing-orders/${row.id}`}>
                            {t('reports.view')}
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
