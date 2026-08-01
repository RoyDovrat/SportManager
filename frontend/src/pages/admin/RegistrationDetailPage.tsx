import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatApiError } from '../../api/formatApiError'
import {
  approveRegistration,
  cancelRegistration,
  getRegistration,
  type RegistrationResponse,
} from '../../api/registrations'
import {
  activityTypeLabel,
  ageGroupLabel,
  genderLabel,
  registrationStatusLabel,
  swimmingLessonTypeLabel,
  waterAdaptationLevelLabel,
} from '../../i18n/labels'
import { t } from '../../i18n/t'

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  return String(value)
}

export function RegistrationDetailPage() {
  const { id } = useParams()
  const registrationId = Number(id)

  const [registration, setRegistration] = useState<RegistrationResponse | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
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
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatApiError(err))
          setRegistration(null)
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

  async function handleApprove() {
    if (!registration) {
      return
    }
    if (!window.confirm(t('registrations.confirmApprove'))) {
      return
    }

    setActing(true)
    setError(null)
    setMessage(null)

    try {
      const updated = await approveRegistration(registration.id)
      setRegistration(updated)
      setMessage(t('registrations.approved'))
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
      setMessage(t('registrations.cancelled'))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setActing(false)
    }
  }

  const canApprove = registration?.status === 'PENDING'
  const canCancel =
    registration?.status === 'PENDING' || registration?.status === 'APPROVED'

  return (
    <section className="admin-page">
      <p>
        <Link to="/admin/registrations">{t('registrations.backToList')}</Link>
      </p>

      <h1>{t('registrations.detailTitle')}</h1>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : registration === null ? (
        <p>{t('registrations.notFound')}</p>
      ) : (
        <>
          <div className="admin-form__actions">
            {canApprove && (
              <button
                type="button"
                onClick={() => void handleApprove()}
                disabled={acting}
              >
                {acting ? t('registrations.working') : t('registrations.approve')}
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={acting}
              >
                {acting
                  ? t('registrations.working')
                  : t('registrations.cancelAction')}
              </button>
            )}
          </div>

          <div className="admin-detail">
            <DetailSection title={t('registrations.summarySection')}>
              <DetailRow label={t('common.id')} value={registration.id} />
              <DetailRow
                label={t('registrations.date')}
                value={registration.registrationDate}
              />
              <DetailRow
                label={t('common.status')}
                value={registrationStatusLabel(registration.status)}
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
                  registration.isKibbutzMember ? t('common.yes') : t('common.no')
                }
              />
              <DetailRow
                label={t('registration.budgetNumber')}
                value={displayValue(registration.budgetNumber)}
              />
            </DetailSection>

            {registration.activityType === 'SWIMMING' && (
              <DetailSection title={t('registration.swimmingDetails')}>
                <DetailRow
                  label={t('registration.lessonType')}
                  value={
                    registration.swimmingLessonType
                      ? swimmingLessonTypeLabel(registration.swimmingLessonType)
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
  value: string | number
}) {
  return (
    <div className="admin-detail__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
