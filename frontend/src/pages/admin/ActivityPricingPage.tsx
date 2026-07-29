import { useEffect, useState, type FormEvent } from 'react'
import {
  createActivityPricing,
  listActivityPricingBySeason,
  updateActivityPricing,
  type ActivityPricingResponse,
} from '../../api/activityPricing'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import {
  ACTIVITY_TYPES,
  AGE_GROUPS,
  SWIMMING_LESSON_TYPES,
  type ActivityType,
  type AgeGroup,
  type SwimmingLessonType,
} from '../../types/enums'

type CreateFormState = {
  activityType: ActivityType
  ageGroup: AgeGroup
  swimmingLessonType: SwimmingLessonType
  weeklySessions: string
  monthlyPrice: string
}

type EditFormState = {
  weeklySessions: string
  monthlyPrice: string
}

const emptyCreateForm: CreateFormState = {
  activityType: 'FOOTBALL',
  ageGroup: 'GRADE_1',
  swimmingLessonType: 'GROUP',
  weeklySessions: '1',
  monthlyPrice: '',
}

export function ActivityPricingPage() {
  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | ''>('')
  const [rows, setRows] = useState<ActivityPricingResponse[]>([])
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    weeklySessions: '',
    monthlyPrice: '',
  })
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadSeasons() {
    setLoadingSeasons(true)
    setError(null)
    try {
      const data = await listSeasons()
      setSeasons(data)
      const active = data.find((season) => season.isActive)
      if (active) {
        setSelectedSeasonId(active.id)
      } else if (data.length > 0) {
        setSelectedSeasonId(data[0].id)
      }
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoadingSeasons(false)
    }
  }

  async function loadPricing(seasonId: number) {
    setLoadingRows(true)
    setError(null)
    try {
      const data = await listActivityPricingBySeason(seasonId)
      setRows(data)
    } catch (err) {
      setError(formatApiError(err))
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }

  useEffect(() => {
    void loadSeasons()
  }, [])

  useEffect(() => {
    if (typeof selectedSeasonId === 'number') {
      void loadPricing(selectedSeasonId)
    } else {
      setRows([])
    }
  }, [selectedSeasonId])

  function startEdit(row: ActivityPricingResponse) {
    setEditingId(row.id)
    setEditForm({
      weeklySessions: row.weeklySessions?.toString() ?? '',
      monthlyPrice: String(row.monthlyPrice),
    })
    setMessage(null)
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({ weeklySessions: '', monthlyPrice: '' })
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (typeof selectedSeasonId !== 'number') {
      setError('Select a season first.')
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    const monthlyPrice = Number(createForm.monthlyPrice)
    const weeklySessions =
      createForm.weeklySessions.trim() === ''
        ? null
        : Number(createForm.weeklySessions)

    try {
      await createActivityPricing({
        seasonId: selectedSeasonId,
        activityType: createForm.activityType,
        ageGroup: createForm.activityType === 'FOOTBALL' ? createForm.ageGroup : null,
        swimmingLessonType:
          createForm.activityType === 'SWIMMING' ? createForm.swimmingLessonType : null,
        weeklySessions: createForm.activityType === 'SWIMMING' ? weeklySessions : null,
        monthlyPrice,
      })
      setMessage('Activity pricing created.')
      setCreateForm(emptyCreateForm)
      await loadPricing(selectedSeasonId)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editingId === null || editingRow === null || typeof selectedSeasonId !== 'number') {
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    const monthlyPrice = Number(editForm.monthlyPrice)
    const weeklySessions =
      editForm.weeklySessions.trim() === ''
        ? null
        : Number(editForm.weeklySessions)

    try {
      await updateActivityPricing(editingId, {
        monthlyPrice,
        ...(editingRow.activityType === 'SWIMMING'
          ? { weeklySessions }
          : {}),
      })
      setMessage('Activity pricing updated.')
      cancelEdit()
      await loadPricing(selectedSeasonId)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const isFootball = createForm.activityType === 'FOOTBALL'
  const editingRow = rows.find((row) => row.id === editingId) ?? null

  return (
    <section className="admin-page">
      <h1>Activity pricing</h1>
      <p>Prices are scoped to a season. Football uses age group; swimming uses lesson type and weekly sessions.</p>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <label className="admin-form__field" style={{ maxWidth: '28rem' }}>
        <span>Season</span>
        <select
          value={selectedSeasonId === '' ? '' : String(selectedSeasonId)}
          onChange={(event) => {
            const value = event.target.value
            setSelectedSeasonId(value === '' ? '' : Number(value))
            cancelEdit()
          }}
          disabled={loadingSeasons || seasons.length === 0}
        >
          {seasons.length === 0 ? (
            <option value="">No seasons available</option>
          ) : (
            seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
                {season.isActive ? ' (active)' : ''}
              </option>
            ))
          )}
        </select>
      </label>

      <form className="admin-form" onSubmit={handleCreate}>
        <h2>Create pricing</h2>

        <label className="admin-form__field">
          <span>Activity type</span>
          <select
            value={createForm.activityType}
            onChange={(event) =>
              setCreateForm({
                ...createForm,
                activityType: event.target.value as ActivityType,
              })
            }
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        {isFootball ? (
          <label className="admin-form__field">
            <span>Age group</span>
            <select
              value={createForm.ageGroup}
              onChange={(event) =>
                setCreateForm({
                  ...createForm,
                  ageGroup: event.target.value as AgeGroup,
                })
              }
            >
              {AGE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="admin-form__field">
              <span>Swimming lesson type</span>
              <select
                value={createForm.swimmingLessonType}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    swimmingLessonType: event.target.value as SwimmingLessonType,
                  })
                }
              >
                {SWIMMING_LESSON_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-form__field">
              <span>Weekly sessions</span>
              <input
                type="number"
                min={1}
                value={createForm.weeklySessions}
                onChange={(event) =>
                  setCreateForm({ ...createForm, weeklySessions: event.target.value })
                }
                required
              />
            </label>
          </>
        )}

        <label className="admin-form__field">
          <span>Monthly price</span>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={createForm.monthlyPrice}
            onChange={(event) =>
              setCreateForm({ ...createForm, monthlyPrice: event.target.value })
            }
            required
          />
        </label>

        <div className="admin-form__actions">
          <button type="submit" disabled={saving || typeof selectedSeasonId !== 'number'}>
            {saving && editingId === null ? 'Saving…' : 'Create'}
          </button>
        </div>
      </form>

      {editingRow && (
        <form className="admin-form" onSubmit={handleUpdate}>
          <h2>Edit pricing #{editingRow.id}</h2>
          <p>
            {editingRow.activityType}
            {editingRow.ageGroup ? ` · ${editingRow.ageGroup}` : ''}
            {editingRow.swimmingLessonType ? ` · ${editingRow.swimmingLessonType}` : ''}
          </p>

          {editingRow.activityType === 'SWIMMING' && (
            <label className="admin-form__field">
              <span>Weekly sessions</span>
              <input
                type="number"
                min={1}
                value={editForm.weeklySessions}
                onChange={(event) =>
                  setEditForm({ ...editForm, weeklySessions: event.target.value })
                }
                required
              />
            </label>
          )}

          <label className="admin-form__field">
            <span>Monthly price</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={editForm.monthlyPrice}
              onChange={(event) =>
                setEditForm({ ...editForm, monthlyPrice: event.target.value })
              }
              required
            />
          </label>

          <div className="admin-form__actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={cancelEdit} disabled={saving}>
              Cancel edit
            </button>
          </div>
        </form>
      )}

      <div className="admin-table-wrap">
        <h2>Pricing for selected season</h2>
        {loadingRows ? (
          <p>Loading pricing…</p>
        ) : typeof selectedSeasonId !== 'number' ? (
          <p>Select a season to view pricing.</p>
        ) : rows.length === 0 ? (
          <p>No activity pricing for this season yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Activity</th>
                <th>Age group</th>
                <th>Lesson type</th>
                <th>Weekly sessions</th>
                <th>Monthly price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.activityType}</td>
                  <td>{row.ageGroup ?? '—'}</td>
                  <td>{row.swimmingLessonType ?? '—'}</td>
                  <td>{row.weeklySessions ?? '—'}</td>
                  <td>{row.monthlyPrice}</td>
                  <td className="admin-table__actions">
                    <button type="button" onClick={() => startEdit(row)}>
                      Edit
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
