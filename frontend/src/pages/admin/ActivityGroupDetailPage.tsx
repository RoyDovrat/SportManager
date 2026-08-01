import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  activateActivityGroup,
  assignRegistrationToGroup,
  deactivateActivityGroup,
  getActivityGroup,
  listGroupRegistrations,
  unassignRegistrationFromGroup,
  updateActivityGroup,
  type ActivityGroupResponse,
} from '../../api/activityGroups'
import { formatApiError } from '../../api/formatApiError'
import type { RegistrationResponse } from '../../api/registrations'
import {
  activityTypeLabel,
  ageGroupLabel,
  registrationStatusLabel,
  swimmingLessonTypeLabel,
  waterAdaptationLevelLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import {
  AGE_GROUPS,
  SWIMMING_LESSON_TYPES,
  WATER_ADAPTATION_LEVELS,
  type AgeGroup,
  type SwimmingLessonType,
  type WaterAdaptationLevel,
} from '../../types/enums'

type EditForm = {
  name: string
  ageGroup: string
  swimmingLessonType: string
  waterAdaptationLevel: string
  isActive: boolean
}

function toEditForm(group: ActivityGroupResponse): EditForm {
  return {
    name: group.name,
    ageGroup: group.ageGroup ?? '',
    swimmingLessonType: group.swimmingLessonType ?? '',
    waterAdaptationLevel: group.waterAdaptationLevel ?? '',
    isActive: group.isActive,
  }
}

export function ActivityGroupDetailPage() {
  const { id } = useParams()
  const groupId = Number(id)

  const [group, setGroup] = useState<ActivityGroupResponse | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)
  const [members, setMembers] = useState<RegistrationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [registrationIdInput, setRegistrationIdInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadGroupAndMembers(options?: { clearMessage?: boolean }) {
    if (!Number.isFinite(groupId) || groupId <= 0) {
      setError(t('activityGroups.invalidId'))
      setGroup(null)
      setForm(null)
      setMembers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    if (options?.clearMessage) {
      setMessage(null)
    }

    try {
      const [data, memberData] = await Promise.all([
        getActivityGroup(groupId),
        listGroupRegistrations(groupId),
      ])
      setGroup(data)
      setForm(toEditForm(data))
      setMembers(memberData)
    } catch (err) {
      setError(formatApiError(err))
      setGroup(null)
      setForm(null)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadGroupAndMembers({ clearMessage: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!group || !form) {
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const isFootball = group.activityType === 'FOOTBALL'
      const updated = await updateActivityGroup(group.id, {
        name: form.name.trim(),
        ageGroup:
          form.ageGroup === '' ? null : (form.ageGroup as AgeGroup),
        swimmingLessonType: isFootball
          ? null
          : form.swimmingLessonType === ''
            ? null
            : (form.swimmingLessonType as SwimmingLessonType),
        waterAdaptationLevel: isFootball
          ? null
          : form.waterAdaptationLevel === ''
            ? null
            : (form.waterAdaptationLevel as WaterAdaptationLevel),
        isActive: form.isActive,
      })
      setGroup(updated)
      setForm(toEditForm(updated))
      setMessage(t('activityGroups.updated'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate() {
    if (!group) {
      return
    }
    setActing(true)
    setError(null)
    setMessage(null)
    try {
      const updated = await activateActivityGroup(group.id)
      setGroup(updated)
      setForm(toEditForm(updated))
      setMessage(t('activityGroups.activated'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setActing(false)
    }
  }

  async function handleDeactivate() {
    if (!group) {
      return
    }
    setActing(true)
    setError(null)
    setMessage(null)
    try {
      const updated = await deactivateActivityGroup(group.id)
      setGroup(updated)
      setForm(toEditForm(updated))
      setMessage(t('activityGroups.deactivated'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setActing(false)
    }
  }

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!group) {
      return
    }

    const registrationId = Number(registrationIdInput)
    if (!Number.isFinite(registrationId) || registrationId <= 0) {
      setError(t('activityGroups.registrationIdRequired'))
      return
    }

    setAssigning(true)
    setError(null)
    setMessage(null)

    try {
      await assignRegistrationToGroup(group.id, registrationId)
      setRegistrationIdInput('')
      setMessage(t('activityGroups.assigned'))
      await loadGroupAndMembers()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setAssigning(false)
    }
  }

  async function handleUnassign(registrationId: number) {
    if (!window.confirm(t('activityGroups.confirmUnassign'))) {
      return
    }

    setAssigning(true)
    setError(null)
    setMessage(null)

    try {
      await unassignRegistrationFromGroup(registrationId)
      setMessage(t('activityGroups.unassigned'))
      await loadGroupAndMembers()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setAssigning(false)
    }
  }

  return (
    <section className="admin-page">
      <p>
        <Link to="/admin/activity-groups">{t('activityGroups.backToList')}</Link>
      </p>

      <h1>{t('activityGroups.detailTitle')}</h1>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : group === null || form === null ? (
        <p>{t('activityGroups.notFound')}</p>
      ) : (
        <>
          <p>
            {t('activityGroups.season')}: <strong>{group.seasonName}</strong>
            {' · '}
            {t('activityGroups.activityType')}:{' '}
            <strong>{activityTypeLabel(group.activityType)}</strong>
            {' · '}
            {t('activityGroups.members')}: <strong>{group.memberCount}</strong>
          </p>

          <div className="admin-form__actions">
            {group.isActive ? (
              <button
                type="button"
                onClick={() => void handleDeactivate()}
                disabled={acting || saving}
              >
                {acting ? t('common.saving') : t('common.deactivate')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleActivate()}
                disabled={acting || saving}
              >
                {acting ? t('common.saving') : t('common.activate')}
              </button>
            )}
          </div>

          <form className="admin-form" onSubmit={handleSave}>
            <h2>{t('activityGroups.editTitle')}</h2>

            <label className="admin-form__field">
              <span>{t('common.name')}</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
                disabled={saving}
              />
            </label>

            {group.activityType === 'FOOTBALL' ? (
              <label className="admin-form__field">
                <span>{t('activityGroups.ageGroup')}</span>
                <select
                  value={form.ageGroup}
                  onChange={(event) =>
                    setForm({ ...form, ageGroup: event.target.value })
                  }
                  required
                  disabled={saving}
                >
                  <option value="">{t('activityGroups.selectAgeGroup')}</option>
                  {AGE_GROUPS.map((value) => (
                    <option key={value} value={value}>
                      {ageGroupLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label className="admin-form__field">
                  <span>{t('activityGroups.ageGroupOptional')}</span>
                  <select
                    value={form.ageGroup}
                    onChange={(event) =>
                      setForm({ ...form, ageGroup: event.target.value })
                    }
                    disabled={saving}
                  >
                    <option value="">{t('common.optional')}</option>
                    {AGE_GROUPS.map((value) => (
                      <option key={value} value={value}>
                        {ageGroupLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-form__field">
                  <span>{t('activityGroups.lessonType')}</span>
                  <select
                    value={form.swimmingLessonType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        swimmingLessonType: event.target.value,
                      })
                    }
                    disabled={saving}
                  >
                    <option value="">{t('common.optional')}</option>
                    {SWIMMING_LESSON_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {swimmingLessonTypeLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-form__field">
                  <span>{t('activityGroups.waterLevel')}</span>
                  <select
                    value={form.waterAdaptationLevel}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        waterAdaptationLevel: event.target.value,
                      })
                    }
                    disabled={saving}
                  >
                    <option value="">{t('common.optional')}</option>
                    {WATER_ADAPTATION_LEVELS.map((value) => (
                      <option key={value} value={value}>
                        {waterAdaptationLevelLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <label className="admin-form__checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm({ ...form, isActive: event.target.checked })
                }
                disabled={saving}
              />
              <span>{t('common.active')}</span>
            </label>

            <div className="admin-form__actions">
              <button type="submit" disabled={saving || acting}>
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>

          <form className="admin-form" onSubmit={handleAssign}>
            <h2>{t('activityGroups.assignTitle')}</h2>
            <p className="clothing-order-form__hint">
              {t('activityGroups.assignHint')}
            </p>
            <label className="admin-form__field">
              <span>{t('activityGroups.registrationId')}</span>
              <input
                type="number"
                min={1}
                value={registrationIdInput}
                onChange={(event) => setRegistrationIdInput(event.target.value)}
                required
                disabled={assigning || saving || acting}
              />
            </label>
            <div className="admin-form__actions">
              <button
                type="submit"
                disabled={assigning || saving || acting}
              >
                {assigning
                  ? t('activityGroups.assigning')
                  : t('activityGroups.assignSubmit')}
              </button>
            </div>
          </form>

          <div className="admin-table-wrap">
            <h2>{t('activityGroups.membersTitle')}</h2>
            {members.length === 0 ? (
              <p>{t('activityGroups.membersEmpty')}</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('common.id')}</th>
                    <th>{t('activityGroups.student')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <Link to={`/admin/registrations/${member.id}`}>
                          {member.id}
                        </Link>
                      </td>
                      <td>
                        {member.studentFirstName} {member.studentLastName}
                      </td>
                      <td>{registrationStatusLabel(member.status)}</td>
                      <td className="admin-table__actions">
                        <button
                          type="button"
                          onClick={() => void handleUnassign(member.id)}
                          disabled={assigning || saving || acting}
                        >
                          {t('activityGroups.unassign')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </section>
  )
}
