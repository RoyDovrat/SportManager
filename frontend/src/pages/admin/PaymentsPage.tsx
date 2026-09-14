import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  createManualPayment,
  generateMonthlyPayments,
  syncSeasonMonthlyPayments,
  listPayments,
  type PaymentResponse,
} from '../../api/payments'
import {
  listRegistrations,
  type RegistrationResponse,
} from '../../api/registrations'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import { FilterClearButton } from '../../components/ui/FilterClearButton'
import { DateText } from '../../components/ui/DateText'
import { NavIcon } from '../../components/ui/NavIcon'
import {
  StatusBadge,
  paymentStatusTone,
} from '../../components/ui/StatusBadge'
import { isKnownSeasonId } from '../../hooks/lastSeason'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import {
  activityTypeLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTypeLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import {
  ACTIVITY_TYPES,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  type ActivityType,
  type PaymentStatus,
  type PaymentType,
} from '../../types/enums'

const ALL = ''

const FILTER_DEFAULTS = {
  status: 'PENDING',
  paymentType: ALL,
  chargeMonth: ALL,
  activityType: ALL,
  seasonId: ALL,
}

function isActivityType(value: string): value is ActivityType {
  return value === 'FOOTBALL' || value === 'SWIMMING'
}

/** Convert `<input type="month">` value `YYYY-MM` → `YYYY-MM-01`. */
function toChargeMonthParam(monthValue: string): string | null {
  if (!monthValue) {
    return null
  }
  return `${monthValue}-01`
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function currentMonthValue(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function parseAmount(value: string): number | null {
  const amount = Number(value.replace(',', '.'))
  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }
  return amount
}

function registrationOptionLabel(row: RegistrationResponse): string {
  return [
    `${row.studentFirstName} ${row.studentLastName}`,
    row.studentIdentityNumber,
    row.seasonName,
    activityTypeLabel(row.activityType),
  ].join(' · ')
}

function formatManualPaymentError(error: unknown): string {
  const message = formatApiError(error)
  if (message.includes('approved registration')) {
    return t('payments.manualNotApproved')
  }
  if (message.includes('Registration was not found')) {
    return t('payments.manualRegistrationMissing')
  }
  if (/uk_monthly_payment|constraint|duplicate/i.test(message)) {
    return t('payments.manualDuplicate')
  }
  return message
}

function SeasonField({
  value,
  seasons,
  disabled,
  onChange,
}: {
  value: string
  seasons: SeasonResponse[]
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="admin-form__field">
      <span>{t('payments.generateSeason')}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">{t('payments.activeSeasonDefault')}</option>
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name}
            {season.isActive ? ` (${t('common.active')})` : ''}
          </option>
        ))}
      </select>
    </label>
  )
}

export function PaymentsPage() {
  const { filters, setFilter, setFilters } = useUrlFilters(FILTER_DEFAULTS, {
    storageKey: 'payments',
  })
  const { status, paymentType, chargeMonth, activityType, seasonId } = filters

  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [rows, setRows] = useState<PaymentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [generateMonth, setGenerateMonth] = useState(currentMonthValue)
  const [generateSeasonId, setGenerateSeasonId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [syncingSeason, setSyncingSeason] = useState(false)
  const [chargeActionsOpen, setChargeActionsOpen] = useState(false)
  const [manualFormOpen, setManualFormOpen] = useState(false)
  const [manualSeasonId, setManualSeasonId] = useState('')
  const [registrationSearch, setRegistrationSearch] = useState('')
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  const [creatingManual, setCreatingManual] = useState(false)
  const [approvedRegistrations, setApprovedRegistrations] = useState<
    RegistrationResponse[]
  >([])
  const [loadingRegistrations, setLoadingRegistrations] = useState(false)

  useEffect(() => {
    async function loadSeasons() {
      try {
        const data = await listSeasons()
        setSeasons(data)
        if (seasonId && !isKnownSeasonId(data, seasonId)) {
          setFilter('seasonId', ALL)
        }
        const active = data.find((season) => season.isActive)
        if (active) {
          const activeId = String(active.id)
          setGenerateSeasonId(activeId)
          setManualSeasonId(activeId)
        } else if (data.length > 0) {
          const firstId = String(data[0].id)
          setGenerateSeasonId(firstId)
          setManualSeasonId(firstId)
        }
      } catch (err) {
        setError(formatApiError(err))
      }
    }

    void loadSeasons()
  }, [])

  async function loadRows() {
    setLoading(true)
    setError(null)

    try {
      const data = await listPayments({
        status: status === ALL ? null : (status as PaymentStatus),
        paymentType: paymentType === ALL ? null : (paymentType as PaymentType),
        chargeMonth: toChargeMonthParam(chargeMonth),
      })
      setRows(data)
    } catch (err) {
      setError(formatApiError(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters change
  }, [status, paymentType, chargeMonth])

  useEffect(() => {
    if (!chargeActionsOpen || !manualFormOpen) {
      return
    }

    let cancelled = false

    async function loadApproved() {
      setLoadingRegistrations(true)
      try {
        const data = await listRegistrations({
          status: 'APPROVED',
          seasonId: manualSeasonId === '' ? null : Number(manualSeasonId),
        })
        if (cancelled) {
          return
        }
        setApprovedRegistrations(data)
        setSelectedRegistrationId((prev) =>
          data.some((row) => String(row.id) === prev) ? prev : '',
        )
      } catch (err) {
        if (!cancelled) {
          setError(formatApiError(err))
          setApprovedRegistrations([])
        }
      } finally {
        if (!cancelled) {
          setLoadingRegistrations(false)
        }
      }
    }

    void loadApproved()
    return () => {
      cancelled = true
    }
  }, [chargeActionsOpen, manualFormOpen, manualSeasonId])

  const visibleRegistrations = useMemo(() => {
    const query = registrationSearch.trim()
    const filtered =
      query === ''
        ? approvedRegistrations
        : approvedRegistrations.filter((row) => {
            const haystack = [
              row.studentFirstName,
              row.studentLastName,
              row.studentIdentityNumber,
              row.parentFirstName,
              row.parentLastName,
              row.seasonName,
            ]
              .join(' ')
              .toLowerCase()
            return haystack.includes(query.toLowerCase())
          })

    if (
      selectedRegistrationId &&
      !filtered.some((row) => String(row.id) === selectedRegistrationId)
    ) {
      const selected = approvedRegistrations.find(
        (row) => String(row.id) === selectedRegistrationId,
      )
      if (selected) {
        return [selected, ...filtered]
      }
    }

    return filtered
  }, [approvedRegistrations, registrationSearch, selectedRegistrationId])

  const selectedRegistration = approvedRegistrations.find(
    (row) => String(row.id) === selectedRegistrationId,
  )

  const actionsBusy = generating || syncingSeason || creatingManual

  function resetManualForm() {
    setRegistrationSearch('')
    setSelectedRegistrationId('')
    setManualAmount('')
  }

  async function handleSyncSeason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSyncingSeason(true)
    setError(null)
    setMessage(null)

    try {
      const result = await syncSeasonMonthlyPayments(
        generateSeasonId === '' ? null : Number(generateSeasonId),
      )
      setMessage(
        t('payments.currentMonthResult', {
          created: result.createdCount,
          skipped: result.skippedCount,
        }),
      )
      await loadRows()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSyncingSeason(false)
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const monthParam = toChargeMonthParam(generateMonth)
    if (!monthParam) {
      setError(t('payments.pastMonthMonthRequired'))
      return
    }

    setGenerating(true)
    setError(null)
    setMessage(null)

    try {
      const result = await generateMonthlyPayments({
        chargeMonth: monthParam,
        seasonId:
          generateSeasonId === '' ? null : Number(generateSeasonId),
      })
      setMessage(
        t('payments.pastMonthResult', {
          created: result.createdCount,
          skipped: result.skippedCount,
        }),
      )
      await loadRows()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setGenerating(false)
    }
  }

  async function handleCreateManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!selectedRegistrationId) {
      setError(t('payments.manualRegistrationRequired'))
      return
    }

    const amount = parseAmount(manualAmount)
    if (amount == null) {
      setError(t('payments.amountInvalid'))
      return
    }

    setCreatingManual(true)

    try {
      await createManualPayment({
        registrationId: Number(selectedRegistrationId),
        amount,
      })
      setMessage(t('payments.manualCreated'))
      resetManualForm()
      setManualFormOpen(false)
      await loadRows()
    } catch (err) {
      setError(formatManualPaymentError(err))
    } finally {
      setCreatingManual(false)
    }
  }

  const filtersActive =
    status !== FILTER_DEFAULTS.status ||
    paymentType !== ALL ||
    chargeMonth !== ALL ||
    activityType !== ALL ||
    seasonId !== ALL

  function resetFilters() {
    setFilters({ ...FILTER_DEFAULTS })
  }

  function handleActivityTypeFilterChange(nextValue: string) {
    const nextType = isActivityType(nextValue) ? nextValue : ALL
    const selectedSeason = seasons.find((season) => String(season.id) === seasonId)
    const seasonStillValid =
      nextType === ALL || selectedSeason?.activityType === nextType
    setFilters({
      activityType: nextType,
      seasonId: seasonStillValid ? seasonId : ALL,
    })
  }

  const seasonsForFilter = isActivityType(activityType)
    ? seasons.filter((season) => season.activityType === activityType)
    : seasons

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (isActivityType(activityType) && row.activityType !== activityType) {
        return false
      }
      if (seasonId !== ALL && String(row.seasonId) !== seasonId) {
        return false
      }
      return true
    })
  }, [rows, activityType, seasonId])

  const exportHref = chargeMonth
    ? `/admin/exports/kibbutz?month=${encodeURIComponent(chargeMonth)}`
    : '/admin/exports/kibbutz'

  return (
    <section className="admin-page admin-page--wide payments-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('payments.title')}</h1>
          <p className="admin-page__lede">{t('payments.intro')}</p>
        </div>
        <div className="seasons-hero-meta">
          <Link to={exportHref} className="admin-export-link">
            <NavIcon name="export" />
            {t('payments.kibbutzExportLink')}
          </Link>
          <button
            type="button"
            className="reg-action reg-action--approve"
            aria-expanded={chargeActionsOpen}
            onClick={() => {
              const nextOpen = !chargeActionsOpen
              setChargeActionsOpen(nextOpen)
              if (!nextOpen) {
                setManualFormOpen(false)
              }
            }}
          >
            {chargeActionsOpen
              ? t('payments.closeChargeActions')
              : t('payments.chargeActions')}
          </button>
        </div>
      </header>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      {chargeActionsOpen && (
        <div className="payments-actions">
          <form
            className="payments-action-card payments-action-card--current"
            onSubmit={handleSyncSeason}
          >
            <div className="seasons-card-head">
              <span className="seasons-card-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />
                </svg>
              </span>
              <div>
                <h2>{t('payments.currentMonthTitle')}</h2>
                <p>{t('payments.currentMonthHint')}</p>
              </div>
            </div>

            <SeasonField
              value={generateSeasonId}
              seasons={seasons}
              disabled={actionsBusy}
              onChange={setGenerateSeasonId}
            />

            <div className="admin-form__actions">
              <button
                type="submit"
                className="reg-action reg-action--approve"
                disabled={actionsBusy}
              >
                {syncingSeason
                  ? t('payments.currentMonthWorking')
                  : t('payments.currentMonthSubmit')}
              </button>
            </div>
          </form>

          <form
            className="payments-action-card payments-action-card--past"
            onSubmit={handleGenerate}
          >
            <div className="seasons-card-head">
              <span className="seasons-card-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M8 3v4M16 3v4M3 10h18" />
                </svg>
              </span>
              <div>
                <h2>{t('payments.pastMonthTitle')}</h2>
                <p>{t('payments.pastMonthHint')}</p>
              </div>
            </div>

            <div className="payments-action-card__grid">
              <SeasonField
                value={generateSeasonId}
                seasons={seasons}
                disabled={actionsBusy}
                onChange={setGenerateSeasonId}
              />

              <label className="admin-form__field">
                <span>{t('payments.pastMonthMonth')}</span>
                <input
                  type="month"
                  value={generateMonth}
                  onChange={(event) => setGenerateMonth(event.target.value)}
                  required
                  disabled={actionsBusy}
                />
              </label>
            </div>

            <div className="admin-form__actions">
              <button type="submit" disabled={actionsBusy}>
                {generating
                  ? t('payments.pastMonthWorking')
                  : t('payments.pastMonthSubmit')}
              </button>
            </div>
          </form>

          <div className="payments-action-card payments-action-card--manual">
            <div className="seasons-card-head">
              <span className="seasons-card-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <div>
                <h2>{t('payments.manualTitle')}</h2>
                <p>{t('payments.manualHint')}</p>
              </div>
            </div>

            {!manualFormOpen ? (
              <div className="admin-form__actions">
                <button
                  type="button"
                  className="reg-action reg-action--restore"
                  onClick={() => setManualFormOpen(true)}
                  disabled={actionsBusy}
                >
                  {t('payments.manualOpenForm')}
                </button>
              </div>
            ) : (
              <form className="payments-manual-form" onSubmit={handleCreateManual}>
                <div className="payments-action-card__grid">
                  <label className="admin-form__field">
                    <span>{t('payments.manualSeason')}</span>
                    <select
                      value={manualSeasonId}
                      onChange={(event) => setManualSeasonId(event.target.value)}
                      disabled={actionsBusy || loadingRegistrations}
                    >
                      <option value="">{t('payments.manualAllSeasons')}</option>
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.name}
                          {season.isActive ? ` (${t('common.active')})` : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-form__field">
                    <span>{t('payments.manualSearch')}</span>
                    <input
                      value={registrationSearch}
                      onChange={(event) =>
                        setRegistrationSearch(event.target.value)
                      }
                      placeholder={t('payments.manualSearchPlaceholder')}
                      disabled={actionsBusy}
                    />
                  </label>
                </div>

                <label className="admin-form__field">
                  <span>{t('payments.manualRegistration')}</span>
                  <select
                    value={selectedRegistrationId}
                    onChange={(event) =>
                      setSelectedRegistrationId(event.target.value)
                    }
                    disabled={actionsBusy || loadingRegistrations}
                    required
                  >
                    <option value="">
                      {loadingRegistrations
                        ? t('common.loading')
                        : t('payments.manualRegistrationPlaceholder')}
                    </option>
                    {visibleRegistrations.map((row) => (
                      <option key={row.id} value={row.id}>
                        {registrationOptionLabel(row)}
                      </option>
                    ))}
                  </select>
                </label>

                {!loadingRegistrations && visibleRegistrations.length === 0 && (
                  <p className="payments-action-card__note">
                    {t('payments.manualNoRegistrations')}
                  </p>
                )}

                {selectedRegistration && (
                  <p className="payments-manual-selected">
                    {t('payments.manualSelectedMeta', {
                      parent: `${selectedRegistration.parentFirstName} ${selectedRegistration.parentLastName}`,
                      activity: activityTypeLabel(
                        selectedRegistration.activityType,
                      ),
                      id: selectedRegistration.id,
                    })}
                    {' · '}
                    {t('payments.kibbutz')}:{' '}
                    {selectedRegistration.isKibbutzMember
                      ? t('common.yes')
                      : t('common.no')}
                  </p>
                )}

                <div className="payments-action-card__grid">
                  <label className="admin-form__field">
                    <span>{t('payments.amount')}</span>
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      inputMode="decimal"
                      value={manualAmount}
                      onChange={(event) => setManualAmount(event.target.value)}
                      required
                      disabled={actionsBusy}
                    />
                  </label>

                  <label className="admin-form__field">
                    <span>{t('payments.chargeMonth')}</span>
                    <input
                      type="month"
                      value={currentMonthValue()}
                      disabled
                    />
                  </label>
                </div>

                <p className="payments-action-card__note">
                  {t('payments.manualChargeMonthHint')}{' '}
                  {t('payments.manualTypeHint')}
                </p>

                <div className="admin-form__actions">
                  <button type="submit" disabled={actionsBusy}>
                    {creatingManual
                      ? t('payments.manualWorking')
                      : t('payments.manualSubmit')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => {
                      resetManualForm()
                      setManualFormOpen(false)
                    }}
                    disabled={actionsBusy}
                  >
                    {t('payments.manualCloseForm')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="admin-filters payments-filters">
        <p className="payments-filters__title">
          <NavIcon name="filter" />
          {t('payments.filterTitle')}
        </p>
        <label className="admin-form__field">
          <span>{t('payments.filterStatus')}</span>
          <select
            value={status}
            onChange={(event) => setFilter('status', event.target.value)}
          >
            <option value={ALL}>{t('payments.allStatuses')}</option>
            {PAYMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {paymentStatusLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('payments.filterActivity')}</span>
          <select
            value={activityType}
            onChange={(event) =>
              handleActivityTypeFilterChange(event.target.value)
            }
          >
            <option value={ALL}>{t('payments.allActivities')}</option>
            {ACTIVITY_TYPES.map((value) => (
              <option key={value} value={value}>
                {activityTypeLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('payments.filterSeason')}</span>
          <select
            value={seasonId}
            onChange={(event) => setFilter('seasonId', event.target.value)}
          >
            <option value={ALL}>{t('payments.allSeasons')}</option>
            {seasonsForFilter.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
                {isActivityType(activityType)
                  ? ''
                  : ` · ${activityTypeLabel(season.activityType)}`}
                {season.isActive ? ` (${t('common.active')})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('payments.filterType')}</span>
          <select
            value={paymentType}
            onChange={(event) => setFilter('paymentType', event.target.value)}
          >
            <option value={ALL}>{t('payments.allTypes')}</option>
            {PAYMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {paymentTypeLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('payments.filterMonth')}</span>
          <input
            type="month"
            value={chargeMonth}
            onChange={(event) => setFilter('chargeMonth', event.target.value)}
          />
        </label>

        <FilterClearButton onClick={resetFilters} disabled={!filtersActive}>
          {t('payments.resetFilters')}
        </FilterClearButton>
      </div>

      <div className="admin-table-wrap">
        <div className="seasons-table-head">
          <h2>
            <NavIcon name="payments" />
            {t('payments.listTitle')}
          </h2>
        </div>
        {loading ? (
          <p className="admin-page__loading">{t('common.loading')}</p>
        ) : visibleRows.length === 0 ? (
          <div className="registrations-empty">
            <span className="registrations-empty__icon" aria-hidden="true">
              <NavIcon name="payments" />
            </span>
            <p>{t('payments.empty')}</p>
            <p className="registrations-empty__hint">
              {t('payments.emptyHint')}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-table__num">{t('common.rowNumber')}</th>
                <th>{t('payments.student')}</th>
                <th>{t('payments.activity')}</th>
                <th>{t('payments.season')}</th>
                <th>{t('payments.amount')}</th>
                <th>{t('payments.chargeMonth')}</th>
                <th>{t('payments.type')}</th>
                <th>{t('common.status')}</th>
                <th>{t('payments.method')}</th>
                <th>{t('payments.kibbutz')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => (
                <tr key={row.id}>
                  <td className="admin-table__num">{index + 1}</td>
                  <td>
                    {row.studentFirstName} {row.studentLastName}
                  </td>
                  <td>{activityTypeLabel(row.activityType)}</td>
                  <td>{row.seasonName}</td>
                  <td>{formatAmount(row.amount)}</td>
                  <td>
                    <DateText value={row.chargeMonth} />
                  </td>
                  <td>{paymentTypeLabel(row.paymentType)}</td>
                  <td>
                    <StatusBadge tone={paymentStatusTone(row.status)}>
                      {paymentStatusLabel(row.status)}
                    </StatusBadge>
                  </td>
                  <td>
                    {row.paymentMethod
                      ? paymentMethodLabel(row.paymentMethod)
                      : '—'}
                  </td>
                  <td>
                    {row.isKibbutzMember ? t('common.yes') : t('common.no')}
                  </td>
                  <td className="admin-table__actions">
                    <Link
                      to={`/admin/payments/${row.id}`}
                      className="reg-action reg-action--view"
                    >
                      {t('payments.view')}
                    </Link>
                    <Link
                      to={`/admin/payments/${row.id}?edit=1`}
                      className="reg-action reg-action--edit"
                    >
                      {t('payments.edit')}
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