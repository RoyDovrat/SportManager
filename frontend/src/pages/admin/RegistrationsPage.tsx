import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  listRegistrations,
  type RegistrationResponse,
} from '../../api/registrations'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import {
  activityTypeLabel,
  registrationStatusLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import {
  REGISTRATION_STATUSES,
  type RegistrationStatus,
} from '../../types/enums'

const ALL = ''

export function RegistrationsPage() {
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [seasonId, setSeasonId] = useState<string>(ALL)
  const [status, setStatus] = useState<string>('PENDING')
  const [rows, setRows] = useState<RegistrationResponse[]>([])
  const [filtersReady, setFiltersReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSeasons() {
      setError(null)

      try {
        const data = await listSeasons()
        setSeasons(data)
        const active = data.find((season) => season.isActive)
        if (active) {
          setSeasonId(String(active.id))
        }
        setFiltersReady(true)
      } catch (err) {
        setError(formatApiError(err))
        setLoading(false)
      }
    }

    void loadSeasons()
  }, [])

  useEffect(() => {
    if (!filtersReady) {
      return
    }

    async function loadRows() {
      setLoading(true)
      setError(null)

      try {
        const data = await listRegistrations({
          seasonId: seasonId === ALL ? null : Number(seasonId),
          status:
            status === ALL ? null : (status as RegistrationStatus),
        })
        setRows(data)
      } catch (err) {
        setError(formatApiError(err))
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    void loadRows()
  }, [filtersReady, seasonId, status])

  return (
    <section className="admin-page admin-page--wide">
      <h1>{t('registrations.title')}</h1>
      <p>{t('registrations.intro')}</p>

      {error && <p className="admin-page__error">{error}</p>}

      <div className="admin-filters">
        <label className="admin-form__field">
          <span>{t('registrations.filterSeason')}</span>
          <select
            value={seasonId}
            onChange={(event) => setSeasonId(event.target.value)}
            disabled={!filtersReady}
          >
            <option value={ALL}>{t('registrations.allSeasons')}</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
                {season.isActive ? ` (${t('common.active')})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('registrations.filterStatus')}</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={!filtersReady}
          >
            <option value={ALL}>{t('registrations.allStatuses')}</option>
            {REGISTRATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {registrationStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <h2>{t('registrations.listTitle')}</h2>
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <p>{t('registrations.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('registrations.date')}</th>
                <th>{t('registrations.student')}</th>
                <th>{t('registrations.parent')}</th>
                <th>{t('registrations.phone')}</th>
                <th>{t('registrations.activity')}</th>
                <th>{t('registrations.season')}</th>
                <th>{t('common.status')}</th>
                <th>{t('registrations.kibbutz')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.registrationDate}</td>
                  <td>
                    {row.studentFirstName} {row.studentLastName}
                  </td>
                  <td>
                    {row.parentFirstName} {row.parentLastName}
                  </td>
                  <td>{row.phoneNumber}</td>
                  <td>{activityTypeLabel(row.activityType)}</td>
                  <td>{row.seasonName}</td>
                  <td>{registrationStatusLabel(row.status)}</td>
                  <td>
                    {row.isKibbutzMember ? t('common.yes') : t('common.no')}
                  </td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/registrations/${row.id}`}>
                      {t('registrations.viewDetails')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
