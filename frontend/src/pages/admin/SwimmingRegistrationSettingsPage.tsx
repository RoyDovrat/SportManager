import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../api'
import { formatApiError } from '../../api/formatApiError'
import { listSeasons, type SeasonResponse } from '../../api/seasons'
import {
  createSwimmingRegistrationSettings,
  getSwimmingRegistrationSettingsBySeason,
  listSwimmingRegistrationSettings,
  updateSwimmingRegistrationSettings,
  type SwimmingRegistrationSettingsResponse,
} from '../../api/swimmingRegistrationSettings'
import { NavIcon } from '../../components/ui/NavIcon'
import { MarkdownView } from '../../components/ui/MarkdownView'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { t } from '../../i18n/t'

const FILTER_DEFAULTS = {
  seasonId: '',
}

export function SwimmingRegistrationSettingsPage() {
  const { filters, setFilter, hasParam } = useUrlFilters(FILTER_DEFAULTS)
  const selectedSeasonId =
    filters.seasonId === '' ? '' : Number(filters.seasonId)

  const [seasons, setSeasons] = useState<SeasonResponse[]>([])
  const [allSettings, setAllSettings] = useState<
    SwimmingRegistrationSettingsResponse[]
  >([])
  const [current, setCurrent] =
    useState<SwimmingRegistrationSettingsResponse | null>(null)
  const [introMarkdown, setIntroMarkdown] = useState('')
  const [groupWeeklySessions, setGroupWeeklySessions] = useState('2')
  const [showPreview, setShowPreview] = useState(false)
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const [loadingCurrent, setLoadingCurrent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const selectedSeason = seasons.find(
    (season) => String(season.id) === filters.seasonId,
  )

  async function loadSeasonsAndList() {
    setLoadingSeasons(true)
    setError(null)
    try {
      const [seasonData, settingsData] = await Promise.all([
        listSeasons(),
        listSwimmingRegistrationSettings(),
      ])
      const swimmingSeasons = seasonData.filter(
        (season) => season.activityType === 'SWIMMING',
      )
      setSeasons(swimmingSeasons)
      setAllSettings(settingsData)

      if (!hasParam('seasonId')) {
        const active = swimmingSeasons.find((season) => season.isActive)
        if (active) {
          setFilter('seasonId', String(active.id))
        } else if (swimmingSeasons.length > 0) {
          setFilter('seasonId', String(swimmingSeasons[0].id))
        }
      }
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoadingSeasons(false)
    }
  }

  async function loadCurrentForSeason(seasonId: number) {
    setLoadingCurrent(true)
    setError(null)

    try {
      const settings = await getSwimmingRegistrationSettingsBySeason(seasonId)
      setCurrent(settings)
      setIntroMarkdown(settings.introMarkdown ?? '')
      setGroupWeeklySessions(String(settings.groupWeeklySessions ?? 2))
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setCurrent(null)
        setIntroMarkdown('')
        setGroupWeeklySessions('2')
      } else {
        setError(formatApiError(err))
        setCurrent(null)
        setIntroMarkdown('')
        setGroupWeeklySessions('2')
      }
    } finally {
      setLoadingCurrent(false)
    }
  }

  useEffect(() => {
    void loadSeasonsAndList()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, [])

  useEffect(() => {
    if (typeof selectedSeasonId === 'number' && !Number.isNaN(selectedSeasonId)) {
      void loadCurrentForSeason(selectedSeasonId)
    } else {
      setCurrent(null)
      setIntroMarkdown('')
      setGroupWeeklySessions('2')
    }
  }, [selectedSeasonId])

  function resetFormFields() {
    if (current) {
      setIntroMarkdown(current.introMarkdown ?? '')
      setGroupWeeklySessions(String(current.groupWeeklySessions ?? 2))
    } else {
      setIntroMarkdown('')
      setGroupWeeklySessions('2')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (typeof selectedSeasonId !== 'number') {
      setError(t('swimmingSettings.selectSeasonFirst'))
      return
    }

    const groupSessions = Number(groupWeeklySessions)
    if (!Number.isInteger(groupSessions) || groupSessions < 1 || groupSessions > 6) {
      setError(t('swimmingSettings.groupWeeklySessionsHint'))
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      if (current) {
        await updateSwimmingRegistrationSettings(current.id, {
          introMarkdown,
          groupWeeklySessions: groupSessions,
        })
        setMessage(t('swimmingSettings.updated'))
      } else {
        await createSwimmingRegistrationSettings({
          seasonId: selectedSeasonId,
          introMarkdown,
          groupWeeklySessions: groupSessions,
        })
        setMessage(t('swimmingSettings.created'))
      }

      const settingsData = await listSwimmingRegistrationSettings()
      setAllSettings(settingsData)
      await loadCurrentForSeason(selectedSeasonId)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const formDisabled =
    saving || loadingCurrent || typeof selectedSeasonId !== 'number'

  return (
    <section className="admin-page admin-page--wide seasons-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('swimmingSettings.title')}</h1>
          <p className="admin-page__lede">{t('swimmingSettings.intro')}</p>
        </div>
        <div className="seasons-hero-meta">
          <label
            className={
              selectedSeason?.isActive
                ? 'seasons-active-chip seasons-active-chip--on pricing-season-picker'
                : 'seasons-active-chip pricing-season-picker'
            }
          >
            <span className="seasons-active-chip__label">
              <NavIcon name="seasons" />
              {t('swimmingSettings.season')}
            </span>
            <div className="seasons-active-chip__row">
              <select
                className="pricing-season-picker__select"
                value={filters.seasonId}
                onChange={(event) => setFilter('seasonId', event.target.value)}
                disabled={loadingSeasons || seasons.length === 0}
              >
                {seasons.length === 0 ? (
                  <option value="">{t('swimmingSettings.noSeasons')}</option>
                ) : (
                  seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                      {season.isActive ? ` · ${t('common.active')}` : ''}
                    </option>
                  ))
                )}
              </select>
              {selectedSeason?.isActive && (
                <StatusBadge tone="success">{t('common.active')}</StatusBadge>
              )}
            </div>
          </label>
        </div>
      </header>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <div className="seasons-editor swim-settings-layout">
        <form className="admin-form seasons-form" onSubmit={handleSubmit}>
          <div className="seasons-card-head">
            <span className="seasons-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <div>
              <h2>
                {loadingCurrent
                  ? t('swimmingSettings.loading')
                  : current
                    ? t('swimmingSettings.editTitle')
                    : t('swimmingSettings.createTitle')}
              </h2>
              <p>
                {current
                  ? t('swimmingSettings.editSubtitle')
                  : t('swimmingSettings.createSubtitle')}
              </p>
            </div>
          </div>

          <label className="admin-form__field">
            <span>{t('swimmingSettings.groupWeeklySessions')}</span>
            <select
              value={groupWeeklySessions}
              onChange={(event) => setGroupWeeklySessions(event.target.value)}
              disabled={formDisabled}
            >
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <option key={value} value={String(value)}>
                  {value}
                </option>
              ))}
            </select>
            <span className="admin-form__hint">
              {t('swimmingSettings.groupWeeklySessionsHint')}
            </span>
          </label>

          <div className="swim-markdown">
            <div className="swim-markdown__head">
              <span>{t('swimmingSettings.introMarkdown')}</span>
              <div className="swim-markdown__tabs" role="tablist">
                <button
                  type="button"
                  className={showPreview ? undefined : 'is-active'}
                  onClick={() => setShowPreview(false)}
                >
                  {t('swimmingSettings.editText')}
                </button>
                <button
                  type="button"
                  className={showPreview ? 'is-active' : undefined}
                  onClick={() => setShowPreview(true)}
                >
                  {t('swimmingSettings.preview')}
                </button>
              </div>
            </div>
            {showPreview ? (
              <div className="swim-markdown__preview">
                {introMarkdown.trim() ? (
                  <MarkdownView
                    className="swimming-intro__body"
                    markdown={introMarkdown}
                  />
                ) : (
                  <p className="dashboard-empty">
                    {t('swimmingSettings.previewEmpty')}
                  </p>
                )}
              </div>
            ) : (
              <textarea
                rows={10}
                value={introMarkdown}
                onChange={(event) => setIntroMarkdown(event.target.value)}
                disabled={formDisabled}
                placeholder={t('swimmingSettings.placeholder')}
                dir="rtl"
              />
            )}
            <p className="admin-form__hint">{t('swimmingSettings.markdownHint')}</p>
          </div>

          <div className="seasons-form__footer">
            <div className="admin-form__actions">
              <button type="submit" disabled={formDisabled}>
                {saving
                  ? t('common.saving')
                  : current
                    ? t('common.save')
                    : t('common.create')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={resetFormFields}
                disabled={formDisabled}
              >
                {t('swimmingSettings.clearForm')}
              </button>
            </div>
          </div>
        </form>

        <aside className="seasons-instructions swim-settings-list">
          <div className="seasons-card-head">
            <span className="seasons-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 5h12v14H6zM8 8h8M8 12h8M8 16h5" />
              </svg>
            </span>
            <div>
              <h2>{t('swimmingSettings.all')}</h2>
              <p>
                {allSettings.length === 0
                  ? t('swimmingSettings.empty')
                  : t('swimmingSettings.savedCount', {
                      count: allSettings.length,
                    })}
              </p>
            </div>
            <span className="swim-settings-list__count">{allSettings.length}</span>
          </div>

          {allSettings.length === 0 ? (
            <p className="dashboard-empty">{t('swimmingSettings.empty')}</p>
          ) : (
            <ul className="swim-settings-list__items">
              {allSettings.map((row) => {
                const selected = String(row.seasonId) === filters.seasonId
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      className={
                        selected
                          ? 'swim-settings-list__item is-selected'
                          : 'swim-settings-list__item'
                      }
                      onClick={() => setFilter('seasonId', String(row.seasonId))}
                    >
                      <strong>{row.seasonName}</strong>
                      <span>
                        {t('swimmingSettings.weeklySessionsShort', {
                          count: row.groupWeeklySessions,
                        })}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>
    </section>
  )
}
