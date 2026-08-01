import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  listClothingOrders,
  type ClothingOrderResponse,
} from '../../api/clothingOrders'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import { t } from '../../i18n/t'

const ALL = ''

export function ClothingOrdersPage() {
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [seasonId, setSeasonId] = useState<string>(ALL)
  const [identityInput, setIdentityInput] = useState('')
  const [identityFilter, setIdentityFilter] = useState('')
  const [rows, setRows] = useState<ClothingOrderResponse[]>([])
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
        const data = await listClothingOrders({
          seasonId: seasonId === ALL ? null : Number(seasonId),
          studentIdentityNumber: identityFilter || null,
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
  }, [filtersReady, seasonId, identityFilter])

  function handleApplyIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIdentityFilter(identityInput.trim())
  }

  function handleClearIdentity() {
    setIdentityInput('')
    setIdentityFilter('')
  }

  return (
    <section className="admin-page admin-page--wide">
      <h1>{t('clothingOrders.title')}</h1>
      <p>{t('clothingOrders.intro')}</p>

      {error && <p className="admin-page__error">{error}</p>}

      <div className="admin-filters">
        <label className="admin-form__field">
          <span>{t('clothingOrders.filterSeason')}</span>
          <select
            value={seasonId}
            onChange={(event) => setSeasonId(event.target.value)}
            disabled={!filtersReady}
          >
            <option value={ALL}>{t('clothingOrders.allSeasons')}</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
                {season.isActive ? ` (${t('common.active')})` : ''}
              </option>
            ))}
          </select>
        </label>

        <form className="admin-filters__identity" onSubmit={handleApplyIdentity}>
          <label className="admin-form__field">
            <span>{t('clothingOrders.filterIdentity')}</span>
            <input
              value={identityInput}
              onChange={(event) => setIdentityInput(event.target.value)}
              placeholder={t('clothingOrders.identityPlaceholder')}
              disabled={!filtersReady}
            />
          </label>
          <div className="admin-form__actions">
            <button type="submit" disabled={!filtersReady}>
              {t('clothingOrders.applyFilter')}
            </button>
            {(identityInput || identityFilter) && (
              <button
                type="button"
                onClick={handleClearIdentity}
                disabled={!filtersReady}
              >
                {t('clothingOrders.clearIdentity')}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-table-wrap">
        <h2>{t('clothingOrders.listTitle')}</h2>
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <p>{t('clothingOrders.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('clothingOrders.student')}</th>
                <th>{t('clothingOrders.identity')}</th>
                <th>{t('clothingOrders.season')}</th>
                <th>{t('clothingOrders.alreadyHas')}</th>
                <th>{t('clothingOrders.paymentRequired')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>
                    {row.studentFirstName} {row.studentLastName}
                  </td>
                  <td>{row.studentIdentityNumber}</td>
                  <td>{row.seasonName}</td>
                  <td>
                    {row.alreadyHasClothing ? t('common.yes') : t('common.no')}
                  </td>
                  <td>
                    {row.clothingPaymentRequired
                      ? t('common.yes')
                      : t('common.no')}
                  </td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/clothing-orders/${row.id}`}>
                      {t('clothingOrders.viewDetails')}
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
