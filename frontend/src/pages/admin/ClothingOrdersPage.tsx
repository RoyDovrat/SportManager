import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  createClothingOrder,
  listClothingOrders,
  type ClothingOrderRequest,
  type ClothingOrderResponse,
} from '../../api/clothingOrders'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import { clothingSizeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import { CLOTHING_SIZES, type ClothingSize } from '../../types/enums'

const ALL = ''

type CreateFormState = {
  seasonId: string
  studentIdentityNumber: string
  alreadyHasClothing: boolean
  shortKitQuantity: string
  shortKitSize: string
  longKitQuantity: string
  longKitSize: string
  hoodieQuantity: string
  hoodieSize: string
  shirtNumber: string
}

const emptyCreateForm: CreateFormState = {
  seasonId: '',
  studentIdentityNumber: '',
  alreadyHasClothing: false,
  shortKitQuantity: '0',
  shortKitSize: '',
  longKitQuantity: '0',
  longKitSize: '',
  hoodieQuantity: '0',
  hoodieSize: '',
  shirtNumber: '',
}

function parseQuantity(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function buildCreateRequest(form: CreateFormState): ClothingOrderRequest {
  if (form.alreadyHasClothing) {
    return {
      studentIdentityNumber: form.studentIdentityNumber.trim(),
      seasonId: Number(form.seasonId),
      alreadyHasClothing: true,
    }
  }

  const shortKitQuantity = parseQuantity(form.shortKitQuantity)
  const longKitQuantity = parseQuantity(form.longKitQuantity)
  const hoodieQuantity = parseQuantity(form.hoodieQuantity)

  return {
    studentIdentityNumber: form.studentIdentityNumber.trim(),
    seasonId: Number(form.seasonId),
    alreadyHasClothing: false,
    shortKitQuantity,
    shortKitSize:
      shortKitQuantity > 0 ? (form.shortKitSize as ClothingSize) : null,
    longKitQuantity,
    longKitSize:
      longKitQuantity > 0 ? (form.longKitSize as ClothingSize) : null,
    hoodieQuantity,
    hoodieSize: hoodieQuantity > 0 ? (form.hoodieSize as ClothingSize) : null,
    shirtNumber:
      form.shirtNumber.trim() === '' ? null : Number(form.shirtNumber),
  }
}

export function ClothingOrdersPage() {
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [seasonId, setSeasonId] = useState<string>(ALL)
  const [identityInput, setIdentityInput] = useState('')
  const [identityFilter, setIdentityFilter] = useState('')
  const [rows, setRows] = useState<ClothingOrderResponse[]>([])
  const [filtersReady, setFiltersReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm)

  useEffect(() => {
    async function loadSeasons() {
      setError(null)

      try {
        const data = await listSeasons()
        setSeasons(data)
        const active = data.find((season) => season.isActive)
        if (active) {
          setSeasonId(String(active.id))
          setCreateForm((prev) => ({ ...prev, seasonId: String(active.id) }))
        } else if (data.length > 0) {
          setCreateForm((prev) => ({ ...prev, seasonId: String(data[0].id) }))
        }
        setFiltersReady(true)
      } catch (err) {
        setError(formatApiError(err))
        setLoading(false)
      }
    }

    void loadSeasons()
  }, [])

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

  useEffect(() => {
    if (!filtersReady) {
      return
    }
    void loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on filter changes only
  }, [filtersReady, seasonId, identityFilter])

  function handleApplyIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIdentityFilter(identityInput.trim())
  }

  function handleClearIdentity() {
    setIdentityInput('')
    setIdentityFilter('')
  }

  function resetCreateForm() {
    const defaultSeasonId =
      seasons.find((season) => season.isActive)?.id ?? seasons[0]?.id
    setCreateForm({
      ...emptyCreateForm,
      seasonId: defaultSeasonId == null ? '' : String(defaultSeasonId),
    })
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const created = await createClothingOrder(buildCreateRequest(createForm))
      setMessage(
        created.alreadyHasClothing
          ? t('clothingOrders.createdSkip')
          : t('clothingOrders.createdOrder'),
      )
      resetCreateForm()
      await loadRows()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-page admin-page--wide">
      <h1>{t('clothingOrders.title')}</h1>
      <p>{t('clothingOrders.intro')}</p>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <form className="admin-form clothing-order-form" onSubmit={handleCreate}>
        <h2>{t('clothingOrders.createTitle')}</h2>
        <p className="clothing-order-form__hint">{t('clothingOrders.createHint')}</p>

        <label className="admin-form__field">
          <span>{t('clothingOrders.season')}</span>
          <select
            value={createForm.seasonId}
            onChange={(event) =>
              setCreateForm({ ...createForm, seasonId: event.target.value })
            }
            required
            disabled={!filtersReady || saving}
          >
            <option value="" disabled>
              {t('clothingOrders.selectSeason')}
            </option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
                {season.isActive ? ` (${t('common.active')})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('clothingOrders.identity')}</span>
          <input
            value={createForm.studentIdentityNumber}
            onChange={(event) =>
              setCreateForm({
                ...createForm,
                studentIdentityNumber: event.target.value,
              })
            }
            required
            disabled={saving}
          />
        </label>

        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={createForm.alreadyHasClothing}
            onChange={(event) =>
              setCreateForm({
                ...createForm,
                alreadyHasClothing: event.target.checked,
              })
            }
            disabled={saving}
          />
          <span>{t('clothingOrders.alreadyHas')}</span>
        </label>

        {!createForm.alreadyHasClothing && (
          <>
            <KitFields
              title={t('clothingOrders.shortKit')}
              quantity={createForm.shortKitQuantity}
              size={createForm.shortKitSize}
              disabled={saving}
              onQuantityChange={(value) =>
                setCreateForm({ ...createForm, shortKitQuantity: value })
              }
              onSizeChange={(value) =>
                setCreateForm({ ...createForm, shortKitSize: value })
              }
            />
            <KitFields
              title={t('clothingOrders.longKit')}
              quantity={createForm.longKitQuantity}
              size={createForm.longKitSize}
              disabled={saving}
              onQuantityChange={(value) =>
                setCreateForm({ ...createForm, longKitQuantity: value })
              }
              onSizeChange={(value) =>
                setCreateForm({ ...createForm, longKitSize: value })
              }
            />
            <KitFields
              title={t('clothingOrders.hoodie')}
              quantity={createForm.hoodieQuantity}
              size={createForm.hoodieSize}
              disabled={saving}
              onQuantityChange={(value) =>
                setCreateForm({ ...createForm, hoodieQuantity: value })
              }
              onSizeChange={(value) =>
                setCreateForm({ ...createForm, hoodieSize: value })
              }
            />
            <label className="admin-form__field">
              <span>{t('clothingOrders.shirtNumber')}</span>
              <input
                type="number"
                min={0}
                max={99}
                value={createForm.shirtNumber}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    shirtNumber: event.target.value,
                  })
                }
                disabled={saving}
              />
            </label>
          </>
        )}

        <div className="admin-form__actions">
          <button type="submit" disabled={saving || !filtersReady}>
            {saving ? t('common.saving') : t('clothingOrders.create')}
          </button>
        </div>
      </form>

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

function KitFields({
  title,
  quantity,
  size,
  disabled,
  onQuantityChange,
  onSizeChange,
}: {
  title: string
  quantity: string
  size: string
  disabled: boolean
  onQuantityChange: (value: string) => void
  onSizeChange: (value: string) => void
}) {
  const qty = parseQuantity(quantity)

  return (
    <fieldset className="clothing-order-form__kit">
      <legend>{title}</legend>
      <label className="admin-form__field">
        <span>{t('clothingOrders.quantity')}</span>
        <input
          type="number"
          min={0}
          value={quantity}
          onChange={(event) => onQuantityChange(event.target.value)}
          required
          disabled={disabled}
        />
      </label>
      <label className="admin-form__field">
        <span>{t('clothingOrders.size')}</span>
        <select
          value={size}
          onChange={(event) => onSizeChange(event.target.value)}
          required={qty > 0}
          disabled={disabled || qty === 0}
        >
          <option value="">{t('clothingOrders.selectSize')}</option>
          {CLOTHING_SIZES.map((value) => (
            <option key={value} value={value}>
              {clothingSizeLabel(value)}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  )
}
