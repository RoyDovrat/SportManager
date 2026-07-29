import { useEffect, useState, type FormEvent } from 'react'
import {
  activateActivity,
  createActivity,
  deactivateActivity,
  listActivities,
  updateActivity,
  type ActivityRequest,
  type ActivityResponse,
} from '../../api/activities'
import { formatApiError } from '../../api/formatApiError'
import { ACTIVITY_TYPES, type ActivityType } from '../../types/enums'

const emptyForm: ActivityRequest = {
  activityType: 'FOOTBALL',
  isActive: true,
}

export function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([])
  const [form, setForm] = useState<ActivityRequest>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadActivities() {
    setLoading(true)
    setError(null)

    try {
      const data = await listActivities()
      setActivities(data)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadActivities()
  }, [])

  function startEdit(activity: ActivityResponse) {
    setEditingId(activity.id)
    setForm({
      activityType: activity.activityType,
      isActive: activity.isActive,
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
        await createActivity(form)
        setMessage('Activity created.')
      } else {
        await updateActivity(editingId, form)
        setMessage('Activity updated.')
      }
      resetForm()
      await loadActivities()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate(activityId: number) {
    setError(null)
    setMessage(null)
    try {
      await activateActivity(activityId)
      setMessage('Activity activated.')
      await loadActivities()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  async function handleDeactivate(activityId: number) {
    setError(null)
    setMessage(null)
    try {
      await deactivateActivity(activityId)
      setMessage('Activity deactivated.')
      await loadActivities()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  return (
    <section className="admin-page">
      <h1>Activities</h1>
      <p>
        Manage football and swimming. Usually one row per activity type (backend enforces uniqueness).
      </p>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId === null ? 'Create activity' : `Edit activity #${editingId}`}</h2>

        <label className="admin-form__field">
          <span>Activity type</span>
          <select
            value={form.activityType}
            onChange={(event) =>
              setForm({ ...form, activityType: event.target.value as ActivityType })
            }
            required
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
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
        <h2>Existing activities</h2>
        {loading ? (
          <p>Loading activities…</p>
        ) : activities.length === 0 ? (
          <p>No activities yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.id}</td>
                  <td>{activity.activityType}</td>
                  <td>{activity.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="admin-table__actions">
                    <button type="button" onClick={() => startEdit(activity)}>
                      Edit
                    </button>
                    {activity.isActive ? (
                      <button type="button" onClick={() => void handleDeactivate(activity.id)}>
                        Deactivate
                      </button>
                    ) : (
                      <button type="button" onClick={() => void handleActivate(activity.id)}>
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
