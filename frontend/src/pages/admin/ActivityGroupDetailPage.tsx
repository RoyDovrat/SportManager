import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  activateActivityGroup,
  assignRegistrationToGroup,
  deactivateActivityGroup,
  getActivityGroup,
  listEligibleRegistrations,
  listGroupRegistrations,
  unassignRegistrationFromGroup,
  updateActivityGroup,
  type ActivityGroupResponse,
} from '../../api/activityGroups'
import { formatApiError } from '../../api/formatApiError'
import type { RegistrationResponse } from '../../api/registrations'
import {
  TrainingSessionsEditor,
  draftsFromSessions,
  draftsToRequest,
  type TrainingSessionDraft,
} from '../../components/admin/TrainingSessionsEditor'
import {
  StatusBadge,
  registrationStatusTone,
} from '../../components/ui/StatusBadge'
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

const SWIMMING_WEEKLY_OPTIONS = [1, 2, 3, 4, 5, 6] as const

type EditForm = {
  name: string
  ageGroups: AgeGroup[]
  weeklySessions: string
  swimmingLessonType: string
  waterAdaptationLevel: string
  isActive: boolean
  trainingSessions: TrainingSessionDraft[]
}

function toEditForm(group: ActivityGroupResponse): EditForm {
  return {
    name: group.name,
    ageGroups: group.ageGroups ?? [],
    weeklySessions: String(group.weeklySessions ?? 1),
    swimmingLessonType: group.swimmingLessonType ?? '',
    waterAdaptationLevel: group.waterAdaptationLevel ?? '',
    isActive: group.isActive,
    trainingSessions: draftsFromSessions(group.trainingSessions),
  }
}

function studentLabel(row: RegistrationResponse): string {
  return `${row.studentFirstName} ${row.studentLastName}`
}

function remainingCapacity(group: ActivityGroupResponse): number | null {
  if (group.maxCapacity == null) {
    return null
  }
  return Math.max(0, group.maxCapacity - group.memberCount)
}

export function ActivityGroupDetailPage() {
  const { id } = useParams()
  const groupId = Number(id)

  const [group, setGroup] = useState<ActivityGroupResponse | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)
  const [members, setMembers] = useState<RegistrationResponse[]>([])
  const [eligible, setEligible] = useState<RegistrationResponse[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadGroupAndMembers(options?: { clearMessage?: boolean }) {
    if (!Number.isFinite(groupId) || groupId <= 0) {
      setError(t('activityGroups.invalidId'))
      setGroup(null)
      setForm(null)
      setMembers([])
      setEligible([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    if (options?.clearMessage) {
      setMessage(null)
    }

    try {
      const [data, memberData, eligibleData] = await Promise.all([
        getActivityGroup(groupId),
        listGroupRegistrations(groupId),
        listEligibleRegistrations(groupId),
      ])
      setGroup(data)
      setForm(toEditForm(data))
      setMembers(memberData)
      setEligible(eligibleData)
      setSelectedIds([])
    } catch (err) {
      setError(formatApiError(err))
      setGroup(null)
      setForm(null)
      setMembers([])
      setEligible([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadGroupAndMembers({ clearMessage: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  function toggleAgeGroup(value: AgeGroup) {
    setForm((prev) => {
      if (!prev) {
        return prev
      }
      const exists = prev.ageGroups.includes(value)
      return {
        ...prev,
        ageGroups: exists
          ? prev.ageGroups.filter((item) => item !== value)
          : [...prev.ageGroups, value],
      }
    })
  }

  function toggleSelected(registrationId: number, remaining: number | null) {
    setSelectedIds((prev) => {
      if (prev.includes(registrationId)) {
        return prev.filter((id) => id !== registrationId)
      }
      if (remaining != null && prev.length >= remaining) {
        return prev
      }
      return [...prev, registrationId]
    })
  }

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
      if (form.ageGroups.length === 0) {
        setError(t('activityGroups.ageGroupsRequired'))
        setSaving(false)
        return
      }
      if (!isFootball && form.swimmingLessonType === '') {
        setError(t('activityGroups.lessonTypeRequired'))
        setSaving(false)
        return
      }
      if (!isFootball && form.waterAdaptationLevel === '') {
        setError(t('activityGroups.waterLevelRequired'))
        setSaving(false)
        return
      }
      let weeklySessions = Number(form.weeklySessions)
      if (isFootball) {
        const activeSessions = form.trainingSessions.filter(
          (session) => session.isActive,
        )
        if (activeSessions.length !== 1 && activeSessions.length !== 2) {
          setError(t('activityGroups.trainingSessionsExactlyOneOrTwo'))
          setSaving(false)
          return
        }
        weeklySessions = activeSessions.length
      }

      const updated = await updateActivityGroup(group.id, {
        name: form.name.trim(),
        ageGroups: form.ageGroups,
        weeklySessions,
        swimmingLessonType: isFootball
          ? null
          : (form.swimmingLessonType as SwimmingLessonType),
        waterAdaptationLevel: isFootball
          ? null
          : (form.waterAdaptationLevel as WaterAdaptationLevel),
        isActive: form.isActive,
        trainingSessions: isFootball
          ? draftsToRequest(form.trainingSessions)
          : undefined,
      })
      setGroup(updated)
      setForm(toEditForm(updated))
      setMessage(t('activityGroups.updated'))
      const eligibleData = await listEligibleRegistrations(group.id)
      setEligible(eligibleData)
      setSelectedIds([])
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

    if (selectedIds.length === 0) {
      setError(t('activityGroups.selectAtLeastOne'))
      return
    }

    const remaining = remainingCapacity(group)
    if (remaining != null && selectedIds.length > remaining) {
      setError(t('activityGroups.tooManySelected', { remaining }))
      return
    }

    setAssigning(true)
    setError(null)
    setMessage(null)

    try {
      for (const registrationId of selectedIds) {
        await assignRegistrationToGroup(group.id, registrationId)
      }
      setMessage(
        selectedIds.length === 1
          ? t('activityGroups.assigned')
          : t('activityGroups.assignedCount', { count: selectedIds.length }),
      )
      await loadGroupAndMembers()
    } catch (err) {
      setError(formatApiError(err))
      await loadGroupAndMembers()
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

  const remaining = group ? remainingCapacity(group) : null
  const isFull = remaining === 0

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
            {group.maxCapacity != null && (
              <>
                {' · '}
                {t('activityGroups.capacity')}:{' '}
                <strong>
                  {group.memberCount}/{group.maxCapacity}
                </strong>
              </>
            )}
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
              <>
                <fieldset className="admin-form__checkbox-group">
                  <legend>{t('activityGroups.ageGroups')}</legend>
                  <p className="clothing-order-form__hint">
                    {t('activityGroups.ageGroupsHint')}
                  </p>
                  {AGE_GROUPS.map((value) => (
                    <label key={value} className="admin-form__checkbox">
                      <input
                        type="checkbox"
                        checked={form.ageGroups.includes(value)}
                        onChange={() => toggleAgeGroup(value)}
                        disabled={saving}
                      />
                      <span>{ageGroupLabel(value)}</span>
                    </label>
                  ))}
                </fieldset>

                <TrainingSessionsEditor
                  sessions={form.trainingSessions}
                  onChange={(trainingSessions) => {
                    const activeCount = trainingSessions.filter(
                      (session) => session.isActive,
                    ).length
                    setForm({
                      ...form,
                      trainingSessions,
                      weeklySessions:
                        activeCount === 1 || activeCount === 2
                          ? String(activeCount)
                          : form.weeklySessions,
                    })
                  }}
                  disabled={saving}
                />
                <p className="clothing-order-form__hint">
                  {t('activityGroups.weeklySessionsFromSchedule', {
                    count: form.trainingSessions.filter(
                      (session) => session.isActive,
                    ).length,
                  })}
                </p>
              </>
            ) : (
              <>
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
                    required
                    disabled={saving}
                  >
                    <option value="">{t('activityGroups.selectLessonType')}</option>
                    {SWIMMING_LESSON_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {swimmingLessonTypeLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="clothing-order-form__hint">
                  {t('activityGroups.lessonCapacityHint')}
                </p>

                <fieldset className="admin-form__checkbox-group">
                  <legend>{t('activityGroups.ageGroups')}</legend>
                  <p className="clothing-order-form__hint">
                    {t('activityGroups.ageGroupsHintSwimming')}
                  </p>
                  {AGE_GROUPS.map((value) => (
                    <label key={value} className="admin-form__checkbox">
                      <input
                        type="checkbox"
                        checked={form.ageGroups.includes(value)}
                        onChange={() => toggleAgeGroup(value)}
                        disabled={saving}
                      />
                      <span>{ageGroupLabel(value)}</span>
                    </label>
                  ))}
                </fieldset>

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
                    required
                    disabled={saving}
                  >
                    <option value="">{t('activityGroups.selectWaterLevel')}</option>
                    {WATER_ADAPTATION_LEVELS.map((value) => (
                      <option key={value} value={value}>
                        {waterAdaptationLevelLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-form__field">
                  <span>{t('activityGroups.weeklySessionsSwimming')}</span>
                  <select
                    value={form.weeklySessions}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        weeklySessions: event.target.value,
                      })
                    }
                    required
                    disabled={saving}
                  >
                    {SWIMMING_WEEKLY_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
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
              {group.activityType === 'SWIMMING'
                ? t('activityGroups.assignHint')
                : t('activityGroups.assignHintFootball')}
            </p>
            {isFull ? (
              <p className="admin-page__error">{t('activityGroups.capacityFull')}</p>
            ) : eligible.length === 0 ? (
              <p>{t('activityGroups.eligibleEmpty')}</p>
            ) : (
              <fieldset className="admin-form__checkbox-group">
                <legend>{t('activityGroups.eligibleTitle')}</legend>
                {remaining != null && (
                  <p className="clothing-order-form__hint">
                    {t('activityGroups.capacity')}: {group.memberCount}/
                    {group.maxCapacity}
                    {' · '}
                    {t('activityGroups.remainingSlots', { count: remaining })}
                  </p>
                )}
                {eligible.map((row) => (
                  <label key={row.id} className="admin-form__checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelected(row.id, remaining)}
                      disabled={assigning || saving || acting}
                    />
                    <span>
                      {studentLabel(row)}
                      {' · '}
                      {ageGroupLabel(row.studentAgeGroup)}
                      {row.swimmingLessonType
                        ? ` · ${swimmingLessonTypeLabel(row.swimmingLessonType)}`
                        : ''}
                      {row.waterAdaptationLevel
                        ? ` · ${waterAdaptationLevelLabel(row.waterAdaptationLevel)}`
                        : ''}
                      {row.weeklySessions != null
                        ? ` · ${t('activityGroups.weeklySessionsShort')}: ${row.weeklySessions}`
                        : ''}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            <div className="admin-form__actions">
              <button
                type="submit"
                disabled={
                  assigning ||
                  saving ||
                  acting ||
                  isFull ||
                  eligible.length === 0 ||
                  selectedIds.length === 0
                }
              >
                {assigning
                  ? t('activityGroups.assigning')
                  : t('activityGroups.assignSelected')}
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
                    <th>{t('activityGroups.ageGroup')}</th>
                    {group.activityType === 'SWIMMING' && (
                      <>
                        <th>{t('activityGroups.lessonType')}</th>
                        <th>{t('activityGroups.waterLevel')}</th>
                        <th>{t('activityGroups.weeklySessionsShort')}</th>
                      </>
                    )}
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
                      <td>{studentLabel(member)}</td>
                      <td>{ageGroupLabel(member.studentAgeGroup)}</td>
                      {group.activityType === 'SWIMMING' && (
                        <>
                          <td>
                            {member.swimmingLessonType
                              ? swimmingLessonTypeLabel(member.swimmingLessonType)
                              : '—'}
                          </td>
                          <td>
                            {member.waterAdaptationLevel
                              ? waterAdaptationLevelLabel(
                                  member.waterAdaptationLevel,
                                )
                              : '—'}
                          </td>
                          <td>{member.weeklySessions ?? '—'}</td>
                        </>
                      )}
                      <td>
                        <StatusBadge
                          tone={registrationStatusTone(member.status)}
                        >
                          {registrationStatusLabel(member.status)}
                        </StatusBadge>
                      </td>
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
