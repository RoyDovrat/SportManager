import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../api'
import {
  createClothingPricing,
  getClothingPricingBySeason,
  listClothingPricing,
  updateClothingPricing,
  type ClothingPricingResponse,
} from '../../api/clothingPricing'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import { t } from '../../i18n/t'

type PriceForm = {
  shortKitPrice: string
  longKitPrice: string
  hoodiePrice: string
}

const emptyForm: PriceForm = {
  shortKitPrice: '',
  longKitPrice: '',
  hoodiePrice: '',
}

export function ClothingPricingPage() {
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [allPricing, setAllPricing] = useState<ClothingPricingResponse[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | ''>('')
  const [current, setCurrent] = useState<ClothingPricingResponse | null>(null)
  const [form, setForm] = useState<PriceForm>(emptyForm)
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const [loadingCurrent, setLoadingCurrent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadSeasonsAndList() {
    setLoadingSeasons(true)
    setError(null)
    try {
      const [seasonData, pricingData] = await Promise.all([
        listSeasons(),
        listClothingPricing(),
      ])
      setSeasons(seasonData)
      setAllPricing(pricingData)

      const active = seasonData.find((season) => season.isActive)
      if (active) {
        setSelectedSeasonId(active.id)
      } else if (seasonData.length > 0) {
        setSelectedSeasonId(seasonData[0].id)
      }
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoadingSeasons(false)
    }
  }

  async function loadCurrentForSeason(seasonId: number) {
    setLoadingCurrent(true)
    setError(null)
    setMessage(null)

    try {
      const pricing = await getClothingPricingBySeason(seasonId)
      setCurrent(pricing)
      setForm({
        shortKitPrice: String(pricing.shortKitPrice),
        longKitPrice: String(pricing.longKitPrice),
        hoodiePrice: String(pricing.hoodiePrice),
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setCurrent(null)
        setForm(emptyForm)
      } else {
        setError(formatApiError(err))
        setCurrent(null)
        setForm(emptyForm)
      }
    } finally {
      setLoadingCurrent(false)
    }
  }

  useEffect(() => {
    void loadSeasonsAndList()
  }, [])

  useEffect(() => {
    if (typeof selectedSeasonId === 'number') {
      void loadCurrentForSeason(selectedSeasonId)
    } else {
      setCurrent(null)
      setForm(emptyForm)
    }
  }, [selectedSeasonId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (typeof selectedSeasonId !== 'number') {
      setError(t('clothingPricing.selectSeasonFirst'))
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    const payload = {
      shortKitPrice: Number(form.shortKitPrice),
      longKitPrice: Number(form.longKitPrice),
      hoodiePrice: Number(form.hoodiePrice),
    }

    try {
      if (current) {
        await updateClothingPricing(current.id, payload)
        setMessage(t('clothingPricing.updated'))
      } else {
        await createClothingPricing({
          seasonId: selectedSeasonId,
          ...payload,
        })
        setMessage(t('clothingPricing.created'))
      }

      const pricingData = await listClothingPricing()
      setAllPricing(pricingData)
      await loadCurrentForSeason(selectedSeasonId)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-page">
      <h1>{t('clothingPricing.title')}</h1>
      <p>{t('clothingPricing.intro')}</p>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <label className="admin-form__field" style={{ maxWidth: '28rem' }}>
        <span>{t('clothingPricing.season')}</span>
        <select
          value={selectedSeasonId === '' ? '' : String(selectedSeasonId)}
          onChange={(event) => {
            const value = event.target.value
            setSelectedSeasonId(value === '' ? '' : Number(value))
          }}
          disabled={loadingSeasons || seasons.length === 0}
        >
          {seasons.length === 0 ? (
            <option value="">{t('clothingPricing.noSeasons')}</option>
          ) : (
            seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
                {season.isActive ? ` ${t('clothingPricing.activeSuffix')}` : ''}
              </option>
            ))
          )}
        </select>
      </label>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>
          {loadingCurrent
            ? t('clothingPricing.loading')
            : current
              ? t('clothingPricing.editTitle')
              : t('clothingPricing.createTitle')}
        </h2>

        <label className="admin-form__field">
          <span>{t('clothingPricing.shortKit')}</span>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={form.shortKitPrice}
            onChange={(event) => setForm({ ...form, shortKitPrice: event.target.value })}
            required
            disabled={loadingCurrent || typeof selectedSeasonId !== 'number'}
          />
        </label>

        <label className="admin-form__field">
          <span>{t('clothingPricing.longKit')}</span>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={form.longKitPrice}
            onChange={(event) => setForm({ ...form, longKitPrice: event.target.value })}
            required
            disabled={loadingCurrent || typeof selectedSeasonId !== 'number'}
          />
        </label>

        <label className="admin-form__field">
          <span>{t('clothingPricing.hoodie')}</span>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={form.hoodiePrice}
            onChange={(event) => setForm({ ...form, hoodiePrice: event.target.value })}
            required
            disabled={loadingCurrent || typeof selectedSeasonId !== 'number'}
          />
        </label>

        <div className="admin-form__actions">
          <button type="submit" disabled={saving || loadingCurrent || typeof selectedSeasonId !== 'number'}>
            {saving ? t('common.saving') : current ? t('common.save') : t('common.create')}
          </button>
        </div>
      </form>

      <div className="admin-table-wrap">
        <h2>{t('clothingPricing.all')}</h2>
        {allPricing.length === 0 ? (
          <p>{t('clothingPricing.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('clothingPricing.season')}</th>
                <th>{t('clothingPricing.shortKit')}</th>
                <th>{t('clothingPricing.longKit')}</th>
                <th>{t('clothingPricing.hoodie')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {allPricing.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.seasonName}</td>
                  <td>{row.shortKitPrice}</td>
                  <td>{row.longKitPrice}</td>
                  <td>{row.hoodiePrice}</td>
                  <td className="admin-table__actions">
                    <button type="button" onClick={() => setSelectedSeasonId(row.seasonId)}>
                      {t('common.open')}
                    </button>
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
