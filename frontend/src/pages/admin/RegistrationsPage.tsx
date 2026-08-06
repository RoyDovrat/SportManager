import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  approveRegistration,
  cancelRegistration,
  listRegistrations,
  type RegistrationResponse,
} from '../../api/registrations'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import {
  StatusBadge,
  registrationStatusTone,
} from '../../components/ui/StatusBadge'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import {
  activityTypeLabel,
  ageGroupLabel,
  registrationStatusLabel,
  swimmingLessonTypeLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import {
  ACTIVITY_TYPES,
  REGISTRATION_STATUSES,
  type RegistrationStatus,
} from '../../types/enums'

const ALL = ''

const FILTER_DEFAULTS = {
  seasonId: ALL,
  status: 'PENDING',
  activityType: ALL,
}

export function RegistrationsPage() {
  const { filters, setFilter, hasParam } = useUrlFilters(FILTER_DEFAULTS)
  const { seasonId, status, activityType } = filters

  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [rows, setRows] = useState<RegistrationResponse[]>([])
  const [filtersReady, setFiltersReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadSeasons() {
      setError(null)

      try {
        const data = await listSeasons()
        setSeasons(data)
        if (!hasParam('seasonId')) {
          const active = data.find((season) => season.isActive)
          if (active) {
            setFilter('seasonId', String(active.id))
          }
        }
        setFiltersReady(true)
      } catch (err) {
        setError(formatApiError(err))
        setLoading(false)
      }
    }

    void loadSeasons()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load seasons once on mount
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
          status: status === ALL ? null : (status as RegistrationStatus),
        })
        setRows(
          activityType === ALL
            ? data
            : data.filter((row) => row.activityType === activityType),
        )
      } catch (err) {
        setError(formatApiError(err))
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    void loadRows()
  }, [filtersReady, seasonId, status, activityType])

  function matchesFilters(row: RegistrationResponse) {
    if (status !== ALL && row.status !== status) {
      return false
    }
    if (activityType !== ALL && row.activityType !== activityType) {
      return false
    }
    return true
  }

  function replaceRow(updated: RegistrationResponse) {
    setRows((current) =>
      current
        .map((row) => (row.id === updated.id ? updated : row))
        .filter(matchesFilters),
    )
  }

  async function handleApprove(row: RegistrationResponse) {
    const confirmKey =
      row.status === 'CANCELLED'
        ? 'registrations.confirmRestore'
        : 'registrations.confirmApprove'
    if (!window.confirm(t(confirmKey))) {
      return
    }

    setActingId(row.id)
    setError(null)
    setMessage(null)
    try {
      const updated = await approveRegistration(row.id)
      replaceRow(updated)
      setMessage(
        row.status === 'CANCELLED'
          ? t('registrations.restored')
          : t('registrations.approved'),
      )
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setActingId(null)
    }
  }

  async function handleCancel(row: RegistrationResponse) {
    if (!window.confirm(t('registrations.confirmCancel'))) {
      return
    }

    setActingId(row.id)
    setError(null)
    setMessage(null)
    try {
      const updated = await cancelRegistration(row.id)
      replaceRow(updated)
      setMessage(t('registrations.cancelled'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setActingId(null)
    }
  }

  return (
    <section className="admin-page admin-page--wide registrations-page">
      <header className="registrations-hero">
        <div>
          <h1>{t('registrations.title')}</h1>
          <p className="admin-page__lede">{t('registrations.intro')}</p>
        </div>
        {!loading && (
          <p className="registrations-hero__count">
            {t('registrations.resultCount', { count: rows.length })}
          </p>
        )}
      </header>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <div className="admin-filters registrations-filters">
        <label className="admin-form__field">
          <span>{t('registrations.filterSeason')}</span>
          <select
            value={seasonId}
            onChange={(event) => setFilter('seasonId', event.target.value)}
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
          <span>{t('registrations.filterActivity')}</span>
          <select
            value={activityType}
            onChange={(event) => setFilter('activityType', event.target.value)}
            disabled={!filtersReady}
          >
            <option value={ALL}>{t('registrations.allActivities')}</option>
            {ACTIVITY_TYPES.map((value) => (
              <option key={value} value={value}>
                {activityTypeLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('registrations.filterStatus')}</span>
          <select
            value={status}
            onChange={(event) => setFilter('status', event.target.value)}
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

      <section className="registrations-list" aria-label={t('registrations.listTitle')}>
        <h2>{t('registrations.listTitle')}</h2>
        {loading ? (
          <p className="admin-page__loading">{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <p className="dashboard-empty">{t('registrations.empty')}</p>
        ) : (
          <ul className="registrations-cards">
            {rows.map((row) => {
              const busy = actingId === row.id
              const canApprove =
                row.status === 'PENDING' || row.status === 'CANCELLED'
              const canCancel = row.status === 'APPROVED'
              return (
                <li
                  key={row.id}
                  className={`registrations-card registrations-card--${row.activityType.toLowerCase()}`}
                >
                  <div className="registrations-card__body">
                    <header className="registrations-card__head">
                      <div className="registrations-card__identity">
                        <h3 className="registrations-card__name">
                          {row.studentFirstName} {row.studentLastName}
                        </h3>
                        <p className="registrations-card__context">
                          <span className="registrations-chip">
                            {activityTypeLabel(row.activityType)}
                          </span>
                          <span className="registrations-chip registrations-chip--muted">
                            {row.seasonName}
                          </span>
                          <span className="registrations-chip registrations-chip--muted">
                            {ageGroupLabel(row.studentAgeGroup)}
                          </span>
                        </p>
                      </div>
                      <StatusBadge tone={registrationStatusTone(row.status)}>
                        {registrationStatusLabel(row.status)}
                      </StatusBadge>
                    </header>

                    <div className="registrations-card__columns">
                      <section className="registrations-card__col">
                        <h4>{t('registrations.sectionRegistration')}</h4>
                        <dl>
                          <div>
                            <dt>{t('registrations.date')}</dt>
                            <dd>{row.registrationDate}</dd>
                          </div>
                          <div>
                            <dt>{t('registrations.identity')}</dt>
                            <dd dir="ltr">{row.studentIdentityNumber}</dd>
                          </div>
                          {row.activityGroupName && (
                            <div>
                              <dt>{t('registrations.group')}</dt>
                              <dd>{row.activityGroupName}</dd>
                            </div>
                          )}
                          {row.activityType === 'SWIMMING' &&
                            row.swimmingLessonType && (
                              <div>
                                <dt>{t('registrations.lessonType')}</dt>
                                <dd>
                                  {swimmingLessonTypeLabel(
                                    row.swimmingLessonType,
                                  )}
                                </dd>
                              </div>
                            )}
                          {row.activityType === 'SWIMMING' &&
                            row.weeklySessions != null && (
                              <div>
                                <dt>{t('registrations.weeklySessions')}</dt>
                                <dd>{row.weeklySessions}</dd>
                              </div>
                            )}
                          {row.hasMedicalLimitation && (
                            <div className="registrations-card__alert">
                              <dt>{t('registrations.medical')}</dt>
                              <dd>
                                {row.medicalNotes?.trim()
                                  ? row.medicalNotes
                                  : t('registrations.hasMedicalLimitation')}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </section>

                      <section className="registrations-card__col">
                        <h4>{t('registrations.sectionContact')}</h4>
                        <dl>
                          <div>
                            <dt>{t('registrations.parent')}</dt>
                            <dd>
                              {row.parentFirstName} {row.parentLastName}
                            </dd>
                          </div>
                          <div>
                            <dt>{t('registrations.phone')}</dt>
                            <dd dir="ltr">{row.phoneNumber}</dd>
                          </div>
                          <div>
                            <dt>{t('registrations.membership')}</dt>
                            <dd>
                              {row.isKibbutzMember
                                ? t('registrations.kibbutzMember')
                                : t('registrations.notKibbutzMember')}
                            </dd>
                          </div>
                          {row.isKibbutzMember && row.budgetNumber && (
                            <div>
                              <dt>{t('registrations.budgetNumber')}</dt>
                              <dd dir="ltr">{row.budgetNumber}</dd>
                            </div>
                          )}
                        </dl>
                      </section>
                    </div>
                  </div>

                  <footer className="registrations-card__footer">
                    <span className="registrations-card__id">
                      {t('common.id')} #{row.id}
                    </span>
                    <div className="registrations-card__actions">
                      <Link
                        to={`/admin/registrations/${row.id}`}
                        className="reg-action reg-action--view"
                      >
                        {t('registrations.view')}
                      </Link>
                      <Link
                        to={`/admin/registrations/${row.id}?edit=1`}
                        className="reg-action reg-action--edit"
                      >
                        {t('registrations.edit')}
                      </Link>
                      {canApprove && (
                        <button
                          type="button"
                          className={
                            row.status === 'CANCELLED'
                              ? 'reg-action reg-action--restore'
                              : 'reg-action reg-action--approve'
                          }
                          disabled={busy}
                          onClick={() => void handleApprove(row)}
                        >
                          {busy
                            ? t('registrations.working')
                            : row.status === 'CANCELLED'
                              ? t('registrations.restoreApprove')
                              : t('registrations.approve')}
                        </button>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          className="reg-action reg-action--cancel"
                          disabled={busy}
                          onClick={() => void handleCancel(row)}
                        >
                          {busy
                            ? t('registrations.working')
                            : t('registrations.cancelAction')}
                        </button>
                      )}
                    </div>
                  </footer>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </section>
  )
}
