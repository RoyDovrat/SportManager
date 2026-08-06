import { useEffect, useState, type FormEvent } from 'react'
import {
  activateSeason,
  createSeason,
  deactivateSeason,
  listSeasons,
  updateSeason,
  type SeasonRequest,
  type SeasonResponse,
} from '../../api/seasons'
import { formatApiError } from '../../api/formatApiError'
import { activityTypeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import { ACTIVITY_TYPES, type ActivityType } from '../../types/enums'

const emptyForm: SeasonRequest = {
  name: '',
  startDate: '',
  endDate: '',
  activityType: 'FOOTBALL',
  isActive: false,
}

export function SeasonsPage() {
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [form, setForm] = useState<SeasonRequest>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadSeasons() {
    setLoading(true)
    setError(null)

    try {
      const data = await listSeasons()
      setSeasons(data)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSeasons()
  }, [])

  function startEdit(season: SeasonResponse) {
    setEditingId(season.id)
    setForm({
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      activityType: season.activityType,
      isActive: season.isActive,
    })
    setMessage(null)
    setError(null)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      if (editingId === null) {
        await createSeason(form)
        setMessage(t('seasons.created'))
      } else {
        await updateSeason(editingId, form)
        setMessage(t('seasons.updated'))
      }
      resetForm()
      await loadSeasons()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate(seasonId: number) {
    setError(null)
    setMessage(null)
    try {
      await activateSeason(seasonId)
      setMessage(t('seasons.activated'))
      await loadSeasons()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  async function handleDeactivate(seasonId: number) {
    setError(null)
    setMessage(null)
    try {
      await deactivateSeason(seasonId)
      setMessage(t('seasons.deactivated'))
      await loadSeasons()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('seasons.title')}</h1>
          <p className="admin-page__lede">{t('seasons.intro')}</p>
        </div>
      </header>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId === null ? t('seasons.createTitle') : t('seasons.editTitle')}</h2>

        <label className="admin-form__field">
          <span>{t('seasons.name')}</span>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>

        <label className="admin-form__field">
          <span>{t('seasons.activityType')}</span>
          <select
            value={form.activityType}
            onChange={(event) =>
              setForm({
                ...form,
                activityType: event.target.value as ActivityType,
              })
            }
            required
            disabled={editingId !== null}
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {activityTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-form__field">
          <span>{t('seasons.startDate')}</span>
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            required
          />
        </label>

        <label className="admin-form__field">
          <span>{t('seasons.endDate')}</span>
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
            required
          />
        </label>

        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          <span>{t('common.active')}</span>
        </label>

        <div className="admin-form__actions">
          <button type="submit" disabled={saving}>
            {saving ? t('common.saving') : editingId === null ? t('common.create') : t('common.save')}
          </button>
          {editingId !== null && (
            <button type="button" onClick={resetForm} disabled={saving}>
              {t('common.cancelEdit')}
            </button>
          )}
        </div>
      </form>

      <div className="admin-table-wrap">
        <h2>{t('seasons.existing')}</h2>
        {loading ? (
          <p className="admin-page__loading">{t('seasons.loading')}</p>
        ) : seasons.length === 0 ? (
          <p className="dashboard-empty">{t('seasons.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('common.name')}</th>
                <th>{t('seasons.activityType')}</th>
                <th>{t('common.start')}</th>
                <th>{t('common.end')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => (
                <tr key={season.id}>
                  <td>{season.id}</td>
                  <td>{season.name}</td>
                  <td>{activityTypeLabel(season.activityType)}</td>
                  <td>{season.startDate}</td>
                  <td>{season.endDate}</td>
                  <td>{season.isActive ? t('common.active') : t('common.inactive')}</td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="reg-action reg-action--edit"
                      onClick={() => startEdit(season)}
                    >
                      {t('common.edit')}
                    </button>
                    {season.isActive ? (
                      <button
                        type="button"
                        className="reg-action reg-action--deactivate"
                        onClick={() => void handleDeactivate(season.id)}
                      >
                        {t('common.deactivate')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="reg-action reg-action--activate"
                        onClick={() => void handleActivate(season.id)}
                      >
                        {t('common.activate')}
                      </button>
                    )}
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
