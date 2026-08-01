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
import { activityTypeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
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
        setMessage(t('activities.created'))
      } else {
        await updateActivity(editingId, form)
        setMessage(t('activities.updated'))
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
      setMessage(t('activities.activated'))
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
      setMessage(t('activities.deactivated'))
      await loadActivities()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  return (
    <section className="admin-page">
      <h1>{t('activities.title')}</h1>
      <p>{t('activities.intro')}</p>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId === null ? t('activities.createTitle') : t('activities.editTitle')}</h2>

        <label className="admin-form__field">
          <span>{t('activities.activityType')}</span>
          <select
            value={form.activityType}
            onChange={(event) =>
              setForm({ ...form, activityType: event.target.value as ActivityType })
            }
            required
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {activityTypeLabel(type)}
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
        <h2>{t('activities.existing')}</h2>
        {loading ? (
          <p>{t('activities.loading')}</p>
        ) : activities.length === 0 ? (
          <p>{t('activities.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('common.type')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.id}</td>
                  <td>{activityTypeLabel(activity.activityType)}</td>
                  <td>{activity.isActive ? t('common.active') : t('common.inactive')}</td>
                  <td className="admin-table__actions">
                    <button type="button" onClick={() => startEdit(activity)}>
                      {t('common.edit')}
                    </button>
                    {activity.isActive ? (
                      <button type="button" onClick={() => void handleDeactivate(activity.id)}>
                        {t('common.deactivate')}
                      </button>
                    ) : (
                      <button type="button" onClick={() => void handleActivate(activity.id)}>
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
