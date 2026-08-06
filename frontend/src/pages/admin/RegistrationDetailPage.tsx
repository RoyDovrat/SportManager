import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  approveRegistration,
  cancelRegistration,
  getRegistration,
  updateRegistrationAdmin,
  type RegistrationAdminUpdateRequest,
  type RegistrationResponse,
} from '../../api/registrations'
import { AdminBackLink } from '../../components/admin/AdminBackLink'
import {
  StatusBadge,
  registrationStatusTone,
} from '../../components/ui/StatusBadge'
import {
  activityTypeLabel,
  ageGroupLabel,
  genderLabel,
  registrationStatusLabel,
  swimmingLessonTypeLabel,
  waterAdaptationLevelLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'
import {
  AGE_GROUPS,
  GENDERS,
  SWIMMING_LESSON_TYPES,
  WATER_ADAPTATION_LEVELS,
  type AgeGroup,
  type Gender,
  type SwimmingLessonType,
  type WaterAdaptationLevel,
} from '../../types/enums'

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  return String(value)
}

function toEditForm(registration: RegistrationResponse): RegistrationAdminUpdateRequest {
  return {
    parentFirstName: registration.parentFirstName,
    parentLastName: registration.parentLastName,
    phoneNumber: registration.phoneNumber,
    isKibbutzMember: registration.isKibbutzMember,
    budgetNumber: registration.budgetNumber,
    studentFirstName: registration.studentFirstName,
    studentLastName: registration.studentLastName,
    age: registration.studentAge,
    ageGroup: registration.studentAgeGroup,
    gender: registration.studentGender,
    hasMedicalLimitation: registration.hasMedicalLimitation,
    medicalNotes: registration.medicalNotes,
    specialRequests: registration.specialRequests,
    swimmingLessonType: registration.swimmingLessonType,
    waterAdaptationLevel: registration.waterAdaptationLevel,
    weeklySessions: registration.weeklySessions,
  }
}

export function RegistrationDetailPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const registrationId = Number(id)
  const editing = searchParams.get('edit') === '1'

  const [registration, setRegistration] = useState<RegistrationResponse | null>(
    null,
  )
  const [form, setForm] = useState<RegistrationAdminUpdateRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadRegistration() {
      if (!Number.isFinite(registrationId) || registrationId <= 0) {
        if (!cancelled) {
          setError(t('registrations.invalidId'))
          setRegistration(null)
          setLoading(false)
        }
        return
      }

      if (!cancelled) {
        setLoading(true)
        setError(null)
        setMessage(null)
      }

      try {
        const data = await getRegistration(registrationId)
        if (!cancelled) {
          setRegistration(data)
          setForm(toEditForm(data))
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatApiError(err))
          setRegistration(null)
          setForm(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRegistration()

    return () => {
      cancelled = true
    }
  }, [registrationId])

  const canApprove =
    registration?.status === 'PENDING' || registration?.status === 'CANCELLED'
  const canCancel = registration?.status === 'APPROVED'
  const isSwimming = registration?.activityType === 'SWIMMING'

  const approveLabel = useMemo(() => {
    if (registration?.status === 'CANCELLED') {
      return t('registrations.restoreApprove')
    }
    return t('registrations.approve')
  }, [registration?.status])

  async function handleApprove() {
    if (!registration) {
      return
    }
    const confirmKey =
      registration.status === 'CANCELLED'
        ? 'registrations.confirmRestore'
        : 'registrations.confirmApprove'
    if (!window.confirm(t(confirmKey))) {
      return
    }

    setActing(true)
    setError(null)
    setMessage(null)

    try {
      const updated = await approveRegistration(registration.id)
      setRegistration(updated)
      setForm(toEditForm(updated))
      setMessage(
        registration.status === 'CANCELLED'
          ? t('registrations.restored')
          : t('registrations.approved'),
      )
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setActing(false)
    }
  }

  async function handleCancel() {
    if (!registration) {
      return
    }
    if (!window.confirm(t('registrations.confirmCancel'))) {
      return
    }

    setActing(true)
    setError(null)
    setMessage(null)

    try {
      const updated = await cancelRegistration(registration.id)
      setRegistration(updated)
      setForm(toEditForm(updated))
      setMessage(t('registrations.cancelled'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setActing(false)
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!registration || !form) {
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const payload: RegistrationAdminUpdateRequest = {
        ...form,
        budgetNumber: form.isKibbutzMember ? form.budgetNumber : null,
        weeklySessions:
          form.swimmingLessonType === 'GROUP'
            ? form.weeklySessions
            : Number(form.weeklySessions ?? 1),
      }
      const updated = await updateRegistrationAdmin(registration.id, payload)
      setRegistration(updated)
      setForm(toEditForm(updated))
      setMessage(t('registrations.updated'))
      setSearchParams({}, { replace: true })
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  function startEdit() {
    if (registration) {
      setForm(toEditForm(registration))
    }
    setSearchParams({ edit: '1' })
  }

  function stopEdit() {
    if (registration) {
      setForm(toEditForm(registration))
    }
    setSearchParams({}, { replace: true })
  }

  return (
    <section className="admin-page admin-page--wide registrations-detail">
      <p className="registrations-detail__back">
        <AdminBackLink
          fallbackTo="/admin/registrations"
          className="registrations-back"
          aria-label={t('registrations.backToList')}
        >
          <span className="registrations-back__arrow" aria-hidden="true">
            →
          </span>
          <span>{t('registrations.backToList')}</span>
        </AdminBackLink>
      </p>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : registration === null || form === null ? (
        <p>{t('registrations.notFound')}</p>
      ) : (
        <>
          <header className="registrations-detail__hero">
            <div className="registrations-detail__hero-text">
              <p className="registrations-detail__eyebrow">
                {editing
                  ? t('registrations.editTitle')
                  : t('registrations.detailTitle')}
                <span aria-hidden="true"> · </span>
                {t('common.id')} #{registration.id}
              </p>
              <h1>
                {registration.studentFirstName} {registration.studentLastName}
              </h1>
              <p className="registrations-detail__context">
                <span className="registrations-chip">
                  {activityTypeLabel(registration.activityType)}
                </span>
                <span className="registrations-chip registrations-chip--muted">
                  {registration.seasonName}
                </span>
                <span className="registrations-chip registrations-chip--muted">
                  {ageGroupLabel(registration.studentAgeGroup)}
                </span>
                <span className="registrations-chip registrations-chip--muted">
                  {registration.registrationDate}
                </span>
              </p>
            </div>
            <StatusBadge tone={registrationStatusTone(registration.status)}>
              {registrationStatusLabel(registration.status)}
            </StatusBadge>
          </header>

          <div className="registrations-detail__actions">
            {!editing && (
              <button
                type="button"
                className="reg-action reg-action--edit"
                onClick={startEdit}
              >
                {t('registrations.edit')}
              </button>
            )}
            {canApprove && (
              <button
                type="button"
                className={
                  registration.status === 'CANCELLED'
                    ? 'reg-action reg-action--restore'
                    : 'reg-action reg-action--approve'
                }
                onClick={() => void handleApprove()}
                disabled={acting || editing}
              >
                {acting ? t('registrations.working') : approveLabel}
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                className="reg-action reg-action--cancel"
                onClick={() => void handleCancel()}
                disabled={acting || editing}
              >
                {acting
                  ? t('registrations.working')
                  : t('registrations.cancelAction')}
              </button>
            )}
          </div>

          {editing ? (
            <form className="admin-form registrations-edit-form" onSubmit={handleSave}>
              <fieldset className="registrations-edit-form__fieldset">
                <legend>{t('registration.student')}</legend>
                <div className="registrations-edit-form__grid">
                  <label className="admin-form__field">
                    <span>{t('registration.firstName')}</span>
                    <input
                      value={form.studentFirstName}
                      onChange={(e) =>
                        setForm({ ...form, studentFirstName: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="admin-form__field">
                    <span>{t('registration.lastName')}</span>
                    <input
                      value={form.studentLastName}
                      onChange={(e) =>
                        setForm({ ...form, studentLastName: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="admin-form__field">
                    <span>{t('registration.age')}</span>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={form.age}
                      onChange={(e) =>
                        setForm({ ...form, age: Number(e.target.value) })
                      }
                      required
                    />
                  </label>
                  <label className="admin-form__field">
                    <span>{t('registration.ageGroup')}</span>
                    <select
                      value={form.ageGroup}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          ageGroup: e.target.value as AgeGroup,
                        })
                      }
                    >
                      {AGE_GROUPS.map((value) => (
                        <option key={value} value={value}>
                          {ageGroupLabel(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-form__field">
                    <span>{t('registration.gender')}</span>
                    <select
                      value={form.gender}
                      onChange={(e) =>
                        setForm({ ...form, gender: e.target.value as Gender })
                      }
                    >
                      {GENDERS.map((value) => (
                        <option key={value} value={value}>
                          {genderLabel(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-form__field">
                    <span>{t('registration.identityNumber')}</span>
                    <input
                      value={registration.studentIdentityNumber}
                      readOnly
                      className="registrations-edit-form__readonly"
                      dir="ltr"
                    />
                  </label>
                </div>
                <p className="admin-form__hint">
                  {t('registrations.identityReadonly')}
                </p>
              </fieldset>

              <fieldset className="registrations-edit-form__fieldset">
                <legend>{t('registration.parent')}</legend>
                <div className="registrations-edit-form__grid">
                  <label className="admin-form__field">
                    <span>{t('registration.firstName')}</span>
                    <input
                      value={form.parentFirstName}
                      onChange={(e) =>
                        setForm({ ...form, parentFirstName: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="admin-form__field">
                    <span>{t('registration.lastName')}</span>
                    <input
                      value={form.parentLastName}
                      onChange={(e) =>
                        setForm({ ...form, parentLastName: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="admin-form__field">
                    <span>{t('registration.phone')}</span>
                    <input
                      value={form.phoneNumber}
                      onChange={(e) =>
                        setForm({ ...form, phoneNumber: e.target.value })
                      }
                      required
                      dir="ltr"
                    />
                  </label>
                  <label className="admin-form__field registrations-edit-form__check-field">
                    <span>{t('registrations.membership')}</span>
                    <label className="admin-form__checkbox">
                      <input
                        type="checkbox"
                        checked={form.isKibbutzMember}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            isKibbutzMember: e.target.checked,
                          })
                        }
                      />
                      <span>{t('registration.kibbutzMember')}</span>
                    </label>
                  </label>
                  {form.isKibbutzMember && (
                    <label className="admin-form__field">
                      <span>{t('registration.budgetNumber')}</span>
                      <input
                        value={form.budgetNumber ?? ''}
                        onChange={(e) =>
                          setForm({ ...form, budgetNumber: e.target.value })
                        }
                        required
                        dir="ltr"
                      />
                    </label>
                  )}
                </div>
              </fieldset>

              {isSwimming && (
                <fieldset className="registrations-edit-form__fieldset">
                  <legend>{t('registration.swimmingDetails')}</legend>
                  <div className="registrations-edit-form__grid">
                    <label className="admin-form__field">
                      <span>{t('registration.lessonType')}</span>
                      <select
                        value={form.swimmingLessonType ?? 'GROUP'}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            swimmingLessonType: e.target
                              .value as SwimmingLessonType,
                          })
                        }
                      >
                        {SWIMMING_LESSON_TYPES.map((value) => (
                          <option key={value} value={value}>
                            {swimmingLessonTypeLabel(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-form__field">
                      <span>{t('registration.waterAdaptationLevel')}</span>
                      <select
                        value={form.waterAdaptationLevel ?? 'NOT_INDEPENDENT'}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            waterAdaptationLevel: e.target
                              .value as WaterAdaptationLevel,
                          })
                        }
                      >
                        {WATER_ADAPTATION_LEVELS.map((value) => (
                          <option key={value} value={value}>
                            {waterAdaptationLevelLabel(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {form.swimmingLessonType !== 'GROUP' && (
                      <label className="admin-form__field">
                        <span>{t('registration.weeklySessions')}</span>
                        <select
                          value={String(form.weeklySessions ?? 1)}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              weeklySessions: Number(e.target.value),
                            })
                          }
                        >
                          {[1, 2, 3, 4, 5, 6].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </fieldset>
              )}

              <fieldset className="registrations-edit-form__fieldset">
                <legend>{t('registration.healthNotes')}</legend>
                <label className="admin-form__checkbox">
                  <input
                    type="checkbox"
                    checked={form.hasMedicalLimitation}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        hasMedicalLimitation: e.target.checked,
                      })
                    }
                  />
                  <span>{t('registration.hasMedicalLimitation')}</span>
                </label>
                <div className="registrations-edit-form__grid registrations-edit-form__grid--stack">
                  <label className="admin-form__field">
                    <span>{t('registrations.medicalNotes')}</span>
                    <textarea
                      rows={3}
                      value={form.medicalNotes ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, medicalNotes: e.target.value })
                      }
                    />
                  </label>
                  <label className="admin-form__field">
                    <span>{t('registrations.specialRequests')}</span>
                    <textarea
                      rows={3}
                      value={form.specialRequests ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, specialRequests: e.target.value })
                      }
                    />
                  </label>
                </div>
              </fieldset>

              <div className="registrations-edit-form__actions">
                <button type="submit" className="reg-action reg-action--approve" disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </button>
                <button
                  type="button"
                  className="reg-action reg-action--view"
                  onClick={stopEdit}
                  disabled={saving}
                >
                  {t('common.cancelEdit')}
                </button>
              </div>
            </form>
          ) : (
            <div className="admin-detail registrations-detail__panels">
              <DetailSection title={t('registrations.summarySection')}>
                <DetailRow label={t('common.id')} value={registration.id} />
                <DetailRow
                  label={t('registrations.date')}
                  value={registration.registrationDate}
                />
                <DetailRow
                  label={t('registrations.activity')}
                  value={activityTypeLabel(registration.activityType)}
                />
                <DetailRow
                  label={t('registrations.season')}
                  value={registration.seasonName}
                />
                <DetailRow
                  label={t('registrations.group')}
                  value={displayValue(registration.activityGroupName)}
                />
              </DetailSection>

              <DetailSection title={t('registration.student')}>
                <DetailRow
                  label={t('registration.firstName')}
                  value={registration.studentFirstName}
                />
                <DetailRow
                  label={t('registration.lastName')}
                  value={registration.studentLastName}
                />
                <DetailRow
                  label={t('registration.identityNumber')}
                  value={registration.studentIdentityNumber}
                />
                <DetailRow
                  label={t('registration.age')}
                  value={registration.studentAge}
                />
                <DetailRow
                  label={t('registration.ageGroup')}
                  value={ageGroupLabel(registration.studentAgeGroup)}
                />
                <DetailRow
                  label={t('registration.gender')}
                  value={genderLabel(registration.studentGender)}
                />
              </DetailSection>

              <DetailSection title={t('registration.parent')}>
                <DetailRow
                  label={t('registration.firstName')}
                  value={registration.parentFirstName}
                />
                <DetailRow
                  label={t('registration.lastName')}
                  value={registration.parentLastName}
                />
                <DetailRow
                  label={t('registration.phone')}
                  value={registration.phoneNumber}
                />
                <DetailRow
                  label={t('registration.kibbutzMember')}
                  value={
                    registration.isKibbutzMember
                      ? t('common.yes')
                      : t('common.no')
                  }
                />
                <DetailRow
                  label={t('registration.budgetNumber')}
                  value={displayValue(registration.budgetNumber)}
                />
              </DetailSection>

              {isSwimming && (
                <DetailSection title={t('registration.swimmingDetails')}>
                  <DetailRow
                    label={t('registration.lessonType')}
                    value={
                      registration.swimmingLessonType
                        ? swimmingLessonTypeLabel(
                            registration.swimmingLessonType,
                          )
                        : '—'
                    }
                  />
                  <DetailRow
                    label={t('registration.waterAdaptationLevel')}
                    value={
                      registration.waterAdaptationLevel
                        ? waterAdaptationLevelLabel(
                            registration.waterAdaptationLevel,
                          )
                        : '—'
                    }
                  />
                  <DetailRow
                    label={t('registration.weeklySessions')}
                    value={registration.weeklySessions ?? '—'}
                  />
                </DetailSection>
              )}

              <DetailSection title={t('registration.healthNotes')}>
                <DetailRow
                  label={t('registrations.healthDeclaration')}
                  value={
                    registration.healthDeclarationApproved
                      ? t('common.yes')
                      : t('common.no')
                  }
                />
                <DetailRow
                  label={t('registration.hasMedicalLimitation')}
                  value={
                    registration.hasMedicalLimitation
                      ? t('common.yes')
                      : t('common.no')
                  }
                />
                <DetailRow
                  label={t('registrations.medicalNotes')}
                  value={displayValue(registration.medicalNotes)}
                />
                <DetailRow
                  label={t('registrations.specialRequests')}
                  value={displayValue(registration.specialRequests)}
                />
              </DetailSection>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="admin-detail__section">
      <h2>{title}</h2>
      <dl className="admin-detail__list">{children}</dl>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="admin-detail__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
