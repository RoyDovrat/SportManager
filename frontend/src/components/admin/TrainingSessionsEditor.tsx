import type { GroupTrainingSession } from '../../api/activityGroups'
import { dayOfWeekLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import type { DayOfWeek } from '../../types/enums'
import { WEEK_DAY_ORDER } from '../../utils/dayOfWeekOrder'

export type TrainingSessionDraft = {
  key: string
  id?: number
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  isActive: boolean
}

let draftKeyCounter = 0

export function newTrainingSessionDraft(
  partial?: Partial<TrainingSessionDraft>,
): TrainingSessionDraft {
  draftKeyCounter += 1
  return {
    key: `session-${draftKeyCounter}`,
    dayOfWeek: 'SUNDAY',
    startTime: '16:00',
    endTime: '',
    isActive: true,
    ...partial,
  }
}

export function draftsFromSessions(
  sessions: GroupTrainingSession[] | undefined,
): TrainingSessionDraft[] {
  if (!sessions?.length) {
    return []
  }
  return sessions.map((session) =>
    newTrainingSessionDraft({
      id: session.id,
      dayOfWeek: session.dayOfWeek,
      startTime: toTimeInputValue(session.startTime),
      endTime: session.endTime ? toTimeInputValue(session.endTime) : '',
      isActive: session.isActive,
    }),
  )
}

export function draftsToRequest(
  drafts: TrainingSessionDraft[],
): GroupTrainingSession[] {
  return drafts.map((draft) => ({
    ...(draft.id != null ? { id: draft.id } : {}),
    dayOfWeek: draft.dayOfWeek,
    startTime: draft.startTime,
    endTime: draft.endTime.trim() === '' ? null : draft.endTime,
    isActive: draft.isActive,
  }))
}

function toTimeInputValue(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value
}

type TrainingSessionsEditorProps = {
  sessions: TrainingSessionDraft[]
  onChange: (next: TrainingSessionDraft[]) => void
  disabled?: boolean
  maxSessions?: number
  hintKey?: 'football' | 'swimming'
}

export function TrainingSessionsEditor({
  sessions,
  onChange,
  disabled = false,
  maxSessions = 6,
  hintKey = 'football',
}: TrainingSessionsEditorProps) {
  function updateSession(
    key: string,
    patch: Partial<TrainingSessionDraft>,
  ) {
    onChange(
      sessions.map((session) =>
        session.key === key ? { ...session, ...patch } : session,
      ),
    )
  }

  function removeSession(key: string) {
    onChange(sessions.filter((session) => session.key !== key))
  }

  return (
    <fieldset className="admin-form__checkbox-group">
      <legend>{t('activityGroups.trainingSessions')}</legend>
      <p className="clothing-order-form__hint">
        {hintKey === 'swimming'
          ? t('activityGroups.trainingSessionsHintSwimming')
          : t('activityGroups.trainingSessionsHint')}
      </p>

      {sessions.length === 0 ? (
        <p className="clothing-order-form__hint">
          {t('activityGroups.trainingSessionsEmpty')}
        </p>
      ) : (
        <div className="training-sessions-editor">
          {sessions.map((session) => (
            <div key={session.key} className="training-sessions-editor__row">
              <label className="admin-form__field">
                <span>{t('activityGroups.dayOfWeek')}</span>
                <select
                  value={session.dayOfWeek}
                  onChange={(event) =>
                    updateSession(session.key, {
                      dayOfWeek: event.target.value as DayOfWeek,
                    })
                  }
                  disabled={disabled}
                >
                  {WEEK_DAY_ORDER.map((day) => (
                    <option key={day} value={day}>
                      {dayOfWeekLabel(day)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-form__field">
                <span>{t('activityGroups.startTime')}</span>
                <input
                  type="time"
                  value={session.startTime}
                  onChange={(event) =>
                    updateSession(session.key, { startTime: event.target.value })
                  }
                  required
                  disabled={disabled}
                />
              </label>

              <label className="admin-form__field">
                <span>{t('activityGroups.endTime')}</span>
                <input
                  type="time"
                  value={session.endTime}
                  onChange={(event) =>
                    updateSession(session.key, { endTime: event.target.value })
                  }
                  disabled={disabled}
                />
              </label>

              <label className="admin-form__checkbox">
                <input
                  type="checkbox"
                  checked={session.isActive}
                  onChange={(event) =>
                    updateSession(session.key, { isActive: event.target.checked })
                  }
                  disabled={disabled}
                />
                <span>{t('common.active')}</span>
              </label>

              <button
                type="button"
                onClick={() => removeSession(session.key)}
                disabled={disabled}
              >
                {t('activityGroups.removeSession')}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="admin-form__actions">
        <button
          type="button"
          onClick={() => onChange([...sessions, newTrainingSessionDraft()])}
          disabled={disabled || sessions.length >= maxSessions}
        >
          {t('activityGroups.addSession')}
        </button>
      </div>
    </fieldset>
  )
}
