import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  activateActivityGroup,
  assignRegistrationToGroup,
  deactivateActivityGroup,
  deleteActivityGroup,
  getActivityGroup,
  listEligibleRegistrations,
  listGroupRegistrations,
  unassignRegistrationFromGroup,
  updateActivityGroup,
  type ActivityGroupResponse,
} from '../../api/activityGroups'
import { formatApiError } from '../../api/formatApiError'
import type { RegistrationResponse } from '../../api/registrations'
import { AdminBackLink } from '../../components/admin/AdminBackLink'
import {
  GroupFormFields,
  emptyGroupFormErrors,
  hasGroupFormErrors,
  resolvedWeeklySessions,
  validateGroupForm,
  type GroupFormErrors,
  type GroupFormValues,
} from '../../components/admin/GroupFormFields'
import {
  draftsFromSessions,
  draftsToRequest,
} from '../../components/admin/TrainingSessionsEditor'
import {
  StatusBadge,
  registrationStatusTone,
} from '../../components/ui/StatusBadge'
import {
  activityTypeLabel,
  ageGroupLabel,
  dayOfWeekLabel,
  registrationStatusLabel,
  swimmingLessonTypeLabel,
  waterAdaptationLevelLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import { compareAgeGroups, compareWaterAdaptationLevels, type SwimmingLessonType } from '../../types/enums'

function toEditForm(group: ActivityGroupResponse): GroupFormValues {
  return {
    name: group.name,
    seasonId: String(group.seasonId),
    activityType: group.activityType,
    ageGroups: [...(group.ageGroups ?? [])].sort(compareAgeGroups),
    weeklySessions: String(group.weeklySessions ?? 1),
    swimmingLessonType: group.swimmingLessonType ?? '',
    waterAdaptationLevels: [...(group.waterAdaptationLevels ?? [])].sort(
      compareWaterAdaptationLevels,
    ),
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

function formatSessionTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value
}

export function ActivityGroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const groupId = Number(id)
  const editing = searchParams.get('edit') === '1'
  const formRef = useRef<HTMLFormElement>(null)
  const assignRef = useRef<HTMLFormElement>(null)

  const [group, setGroup] = useState<ActivityGroupResponse | null>(null)
  const [form, setForm] = useState<GroupFormValues | null>(null)
  const [members, setMembers] = useState<RegistrationResponse[]>([])
  const [eligible, setEligible] = useState<RegistrationResponse[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [formErrors, setFormErrors] = useState<GroupFormErrors>(
    emptyGroupFormErrors(),
  )
  const [assignError, setAssignError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadGroupAndMembers(options?: { clearMessage?: boolean }) {
    if (!Number.isFinite(groupId) || groupId <= 0) {
      setFormErrors({ general: t('activityGroups.invalidId') })
      setGroup(null)
      setForm(null)
      setMembers([])
      setEligible([])
      setLoading(false)
      return
    }

    setLoading(true)
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
      setFormErrors({ general: formatApiError(err) })
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

  function startEdit() {
    if (group) {
      setForm(toEditForm(group))
    }
    setFormErrors(emptyGroupFormErrors())
    const next = new URLSearchParams(searchParams)
    next.set('edit', '1')
    setSearchParams(next, { replace: true })
  }

  function stopEdit() {
    if (group) {
      setForm(toEditForm(group))
    }
    setFormErrors(emptyGroupFormErrors())
    const next = new URLSearchParams(searchParams)
    next.delete('edit')
    setSearchParams(next, { replace: true })
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
    setMessage(null)
    const errors = validateGroupForm(form)
    if (hasGroupFormErrors(errors)) {
      setFormErrors(errors)
      setSaving(false)
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    try {
      const updated = await updateActivityGroup(group.id, {
        name: form.name.trim(),
        ageGroups: form.ageGroups,
        weeklySessions: resolvedWeeklySessions(form),
        swimmingLessonType:
          group.activityType === 'FOOTBALL'
            ? null
            : (form.swimmingLessonType as SwimmingLessonType),
        waterAdaptationLevels:
          group.activityType === 'FOOTBALL' ? [] : (form.waterAdaptationLevels ?? []),
        waterAdaptationLevel:
          group.activityType === 'FOOTBALL'
            ? null
            : (form.waterAdaptationLevels?.[0] ?? null),
        isActive: form.isActive,
        trainingSessions: draftsToRequest(form.trainingSessions),
      })
      setGroup(updated)
      setForm(toEditForm(updated))
      setFormErrors(emptyGroupFormErrors())
      setMessage(t('activityGroups.updated'))
      const [memberData, eligibleData] = await Promise.all([
        listGroupRegistrations(group.id),
        listEligibleRegistrations(group.id),
      ])
      setMembers(memberData)
      setEligible(eligibleData)
      setSelectedIds([])
    } catch (err) {
      setFormErrors({ general: formatApiError(err) })
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate() {
    if (!group) {
      return
    }
    setActing(true)
    setAssignError(null)
    setMessage(null)
    try {
      const updated = await activateActivityGroup(group.id)
      setGroup(updated)
      setForm(toEditForm(updated))
      setMessage(t('activityGroups.activated'))
    } catch (err) {
      setAssignError(formatApiError(err))
    } finally {
      setActing(false)
    }
  }

  async function handleDeactivate() {
    if (!group) {
      return
    }
    setActing(true)
    setAssignError(null)
    setMessage(null)
    try {
      const updated = await deactivateActivityGroup(group.id)
      setGroup(updated)
      setForm(toEditForm(updated))
      setMessage(t('activityGroups.deactivated'))
    } catch (err) {
      setAssignError(formatApiError(err))
    } finally {
      setActing(false)
    }
  }

  async function handleDelete() {
    if (!group) {
      return
    }
    const confirmed = window.confirm(
      t('activityGroups.confirmDelete', { name: group.name }),
    )
    if (!confirmed) {
      return
    }

    setActing(true)
    setAssignError(null)
    setMessage(null)
    try {
      await deleteActivityGroup(group.id)
      navigate('/admin/activity-groups', {
        replace: true,
        state: { message: t('activityGroups.deleted') },
      })
    } catch (err) {
      setAssignError(formatApiError(err))
      setActing(false)
    }
  }

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!group) {
      return
    }

    if (selectedIds.length === 0) {
      setAssignError(t('activityGroups.selectAtLeastOne'))
      assignRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    const remaining = remainingCapacity(group)
    if (remaining != null && selectedIds.length > remaining) {
      setAssignError(t('activityGroups.tooManySelected', { remaining }))
      assignRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    setAssigning(true)
    setAssignError(null)
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
      setAssignError(formatApiError(err))
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
    setAssignError(null)
    setMessage(null)

    try {
      await unassignRegistrationFromGroup(registrationId)
      setMessage(t('activityGroups.unassigned'))
      await loadGroupAndMembers()
    } catch (err) {
      setAssignError(formatApiError(err))
    } finally {
      setAssigning(false)
    }
  }

  const remaining = group ? remainingCapacity(group) : null
  const isFull = remaining === 0
  const activeSessions = (group?.trainingSessions ?? []).filter(
    (session) => session.isActive,
  )

  return (
    <section className="admin-page admin-page--wide groups-page">
      <nav className="admin-back-nav" aria-label={t('activityGroups.backToList')}>
        <AdminBackLink
          fallbackTo="/admin/activity-groups"
          className="admin-back"
          aria-label={t('activityGroups.backToList')}
        >
          <span className="admin-back__arrow" aria-hidden="true">
            →
          </span>
          <span>{t('activityGroups.backToList')}</span>
        </AdminBackLink>
      </nav>

      {loading ? (
        <p className="admin-page__loading">{t('common.loading')}</p>
      ) : group === null || form === null ? (
        <>
          {formErrors.general && (
            <p className="admin-page__error">{formErrors.general}</p>
          )}
          <p className="dashboard-empty">{t('activityGroups.notFound')}</p>
        </>
      ) : (
        <>
          <header className="admin-page-hero">
            <div className="admin-page-hero__copy">
              <h1>
                {editing
                  ? t('activityGroups.editTitle')
                  : t('activityGroups.viewTitle')}
              </h1>
              <p className="admin-page__lede">
                {group.name}
                {' · '}
                {activityTypeLabel(group.activityType)}
                {' · '}
                {group.seasonName}
              </p>
            </div>
            <div className="groups-hero-actions">
              {editing ? (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={stopEdit}
                  disabled={saving || acting}
                >
                  {t('activityGroups.backToView')}
                </button>
              ) : (
                <button
                  type="button"
                  className="reg-action reg-action--edit"
                  onClick={startEdit}
                >
                  {t('activityGroups.edit')}
                </button>
              )}
              <StatusBadge tone={group.isActive ? 'success' : 'neutral'}>
                {group.isActive ? t('common.active') : t('common.inactive')}
              </StatusBadge>
            </div>
          </header>

          {message && <p className="admin-page__ok">{message}</p>}

          {editing ? (
            <>
              <div className="admin-form__actions groups-toolbar">
                {group.isActive ? (
                  <button
                    type="button"
                    className="reg-action reg-action--deactivate"
                    onClick={() => void handleDeactivate()}
                    disabled={acting || saving}
                  >
                    {acting ? t('common.saving') : t('common.deactivate')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="reg-action reg-action--activate"
                    onClick={() => void handleActivate()}
                    disabled={acting || saving}
                  >
                    {acting ? t('common.saving') : t('common.activate')}
                  </button>
                )}
                <button
                  type="button"
                  className="reg-action reg-action--cancel"
                  onClick={() => void handleDelete()}
                  disabled={acting || saving}
                >
                  {t('activityGroups.delete')}
                </button>
              </div>
              {assignError && (
                <p className="groups-inline-error" role="alert">
                  {assignError}
                </p>
              )}

              <form
                ref={formRef}
                className="admin-form groups-form"
                onSubmit={handleSave}
              >
                <GroupFormFields
                  values={form}
                  errors={formErrors}
                  onChange={(next) => {
                    setForm(next)
                    setFormErrors(emptyGroupFormErrors())
                  }}
                  disabled={saving}
                  showActivityType={false}
                  showSeason={false}
                />
                <div className="admin-form__actions">
                  <button
                    type="submit"
                    className="reg-action reg-action--approve"
                    disabled={saving || acting}
                  >
                    {saving ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </form>

              <form
                ref={assignRef}
                className="admin-form groups-form"
                onSubmit={handleAssign}
              >
                <h2>{t('activityGroups.assignTitle')}</h2>
                <p className="admin-form__hint">
                  {group.activityType === 'SWIMMING'
                    ? t('activityGroups.assignHint')
                    : t('activityGroups.assignHintFootball')}
                </p>
                {assignError && (
                  <p className="groups-inline-error" role="alert">
                    {assignError}
                  </p>
                )}
                {isFull ? (
                  <p className="groups-inline-error">
                    {t('activityGroups.capacityFull')}
                  </p>
                ) : eligible.length === 0 ? (
                  <p className="dashboard-empty">
                    {t('activityGroups.eligibleEmpty')}
                  </p>
                ) : (
                  <fieldset className="admin-form__checkbox-group">
                    <legend>{t('activityGroups.eligibleTitle')}</legend>
                    {remaining != null && (
                      <p className="admin-form__hint">
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
                    className="reg-action reg-action--approve"
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
            </>
          ) : (
            <div className="groups-form-grid">
              <section className="groups-card">
                <h3>{t('activityGroups.detailsCard')}</h3>
                <dl className="groups-readout">
                  <div>
                    <dt>{t('common.name')}</dt>
                    <dd>{group.name}</dd>
                  </div>
                  <div>
                    <dt>{t('activityGroups.season')}</dt>
                    <dd>{group.seasonName}</dd>
                  </div>
                  <div>
                    <dt>{t('activityGroups.activityType')}</dt>
                    <dd>{activityTypeLabel(group.activityType)}</dd>
                  </div>
                  <div>
                    <dt>{t('activityGroups.members')}</dt>
                    <dd>
                      {group.maxCapacity != null
                        ? `${group.memberCount}/${group.maxCapacity}`
                        : group.memberCount}
                    </dd>
                  </div>
                  {group.swimmingLessonType && (
                    <div>
                      <dt>{t('activityGroups.lessonType')}</dt>
                      <dd>
                        {swimmingLessonTypeLabel(group.swimmingLessonType)}
                      </dd>
                    </div>
                  )}
                  {group.waterAdaptationLevels?.length ? (
                    <div>
                      <dt>{t('activityGroups.waterLevel')}</dt>
                      <dd>
                        {[...group.waterAdaptationLevels]
                          .sort(compareWaterAdaptationLevels)
                          .map((value) => waterAdaptationLevelLabel(value))
                          .join(' · ')}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="groups-card">
                <h3>{t('activityGroups.ageGroups')}</h3>
                {group.ageGroups?.length ? (
                  <ul className="groups-chip-list">
                    {[...group.ageGroups].sort(compareAgeGroups).map((value) => (
                      <li key={value}>{ageGroupLabel(value)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-form__hint">—</p>
                )}
              </section>

              <section className="groups-card">
                <h3>{t('activityGroups.trainingSessions')}</h3>
                {activeSessions.length === 0 ? (
                  <p className="admin-form__hint">
                    {t('activityGroups.noSessions')}
                  </p>
                ) : (
                  <ul className="groups-session-list">
                    {activeSessions.map((session) => (
                      <li key={`${session.dayOfWeek}-${session.startTime}`}>
                        <strong>{dayOfWeekLabel(session.dayOfWeek)}</strong>
                        <span>
                          {formatSessionTime(session.startTime)}
                          {session.endTime
                            ? ` – ${formatSessionTime(session.endTime)}`
                            : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          <div className="admin-table-wrap">
            <h2>{t('activityGroups.membersTitle')}</h2>
            {members.length === 0 ? (
              <p className="dashboard-empty">{t('activityGroups.membersEmpty')}</p>
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
                      <td dir="ltr">{member.id}</td>
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
                        <Link
                          to={`/admin/registrations/${member.id}`}
                          className="reg-action reg-action--view"
                        >
                          {t('common.view')}
                        </Link>
                        {editing && (
                          <>
                            <Link
                              to={`/admin/registrations/${member.id}?edit=1`}
                              className="reg-action reg-action--edit"
                            >
                              {t('common.edit')}
                            </Link>
                            <button
                              type="button"
                              className="reg-action reg-action--cancel"
                              onClick={() => void handleUnassign(member.id)}
                              disabled={assigning || saving || acting}
                            >
                              {t('activityGroups.unassign')}
                            </button>
                          </>
                        )}
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
