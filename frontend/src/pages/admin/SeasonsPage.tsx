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

const emptyForm: SeasonRequest = {
  name: '',
  startDate: '',
  endDate: '',
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
        setMessage('Season created.')
      } else {
        await updateSeason(editingId, form)
        setMessage('Season updated.')
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
      setMessage('Season activated.')
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
      setMessage('Season deactivated.')
      await loadSeasons()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  return (
    <section className="admin-page">
      <h1>Seasons</h1>
      <p>Create, edit, and activate seasons. Only one season should be active at a time.</p>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId === null ? 'Create season' : `Edit season #${editingId}`}</h2>

        <label className="admin-form__field">
          <span>Name</span>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>

        <label className="admin-form__field">
          <span>Start date</span>
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
            required
          />
        </label>

        <label className="admin-form__field">
          <span>End date</span>
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
          <span>Active</span>
        </label>

        <div className="admin-form__actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : editingId === null ? 'Create' : 'Save changes'}
          </button>
          {editingId !== null && (
            <button type="button" onClick={resetForm} disabled={saving}>
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="admin-table-wrap">
        <h2>Existing seasons</h2>
        {loading ? (
          <p>Loading seasons…</p>
        ) : seasons.length === 0 ? (
          <p>No seasons yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => (
                <tr key={season.id}>
                  <td>{season.id}</td>
                  <td>{season.name}</td>
                  <td>{season.startDate}</td>
                  <td>{season.endDate}</td>
                  <td>{season.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="admin-table__actions">
                    <button type="button" onClick={() => startEdit(season)}>
                      Edit
                    </button>
                    {season.isActive ? (
                      <button type="button" onClick={() => void handleDeactivate(season.id)}>
                        Deactivate
                      </button>
                    ) : (
                      <button type="button" onClick={() => void handleActivate(season.id)}>
                        Activate
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
