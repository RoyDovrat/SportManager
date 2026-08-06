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
import { MarkdownView } from '../../components/ui/MarkdownView'
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
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const [loadingCurrent, setLoadingCurrent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function loadSeasonsAndList() {
    setLoadingSeasons(true)
    setError(null)
    try {
      const [seasonData, settingsData] = await Promise.all([
        listSeasons(),
        listSwimmingRegistrationSettings(),
      ])
      setSeasons(seasonData)
      setAllSettings(settingsData)

      if (!hasParam('seasonId')) {
        const active =
          seasonData.find(
            (season) => season.isActive && season.activityType === 'SWIMMING',
          ) ?? seasonData.find((season) => season.isActive)
        if (active) {
          setFilter('seasonId', String(active.id))
        } else if (seasonData.length > 0) {
          setFilter('seasonId', String(seasonData[0].id))
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
    setMessage(null)

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

  return (
    <section className="admin-page">
      <header className="admin-page-hero">
        <div className="admin-page-hero__copy">
          <h1>{t('swimmingSettings.title')}</h1>
          <p className="admin-page__lede">{t('swimmingSettings.intro')}</p>
        </div>
      </header>

      {error && <p className="admin-page__error">{error}</p>}
      {message && <p className="admin-page__ok">{message}</p>}

      <label className="admin-form__field" style={{ maxWidth: '28rem' }}>
        <span>{t('swimmingSettings.season')}</span>
        <select
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
                {season.isActive ? ` ${t('swimmingSettings.activeSuffix')}` : ''}
              </option>
            ))
          )}
        </select>
      </label>

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>
          {loadingCurrent
            ? t('swimmingSettings.loading')
            : current
              ? t('swimmingSettings.editTitle')
              : t('swimmingSettings.createTitle')}
        </h2>

        <label className="admin-form__field">
          <span>{t('swimmingSettings.groupWeeklySessions')}</span>
          <select
            value={groupWeeklySessions}
            onChange={(event) => setGroupWeeklySessions(event.target.value)}
            disabled={loadingCurrent || typeof selectedSeasonId !== 'number'}
          >
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <option key={value} value={String(value)}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <p className="admin-form__hint">
          {t('swimmingSettings.groupWeeklySessionsHint')}
        </p>

        <label className="admin-form__field">
          <span>{t('swimmingSettings.introMarkdown')}</span>
          <textarea
            rows={16}
            value={introMarkdown}
            onChange={(event) => setIntroMarkdown(event.target.value)}
            disabled={loadingCurrent || typeof selectedSeasonId !== 'number'}
            placeholder={t('swimmingSettings.placeholder')}
            dir="rtl"
          />
        </label>
        <p className="admin-form__hint">{t('swimmingSettings.markdownHint')}</p>

        <div className="admin-form__actions">
          <button
            type="submit"
            disabled={
              saving || loadingCurrent || typeof selectedSeasonId !== 'number'
            }
          >
            {saving
              ? t('common.saving')
              : current
                ? t('common.save')
                : t('common.create')}
          </button>
        </div>
      </form>

      {introMarkdown.trim() && (
        <div className="admin-page__preview">
          <h2>{t('swimmingSettings.preview')}</h2>
          <MarkdownView
            className="swimming-intro__body"
            markdown={introMarkdown}
          />
        </div>
      )}

      <div className="admin-table-wrap">
        <h2>{t('swimmingSettings.all')}</h2>
        {allSettings.length === 0 ? (
          <p className="dashboard-empty">{t('swimmingSettings.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('swimmingSettings.season')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {allSettings.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.seasonName}</td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="reg-action reg-action--open"
                      onClick={() =>
                        setFilter('seasonId', String(row.seasonId))
                      }
                    >
                      {t('common.edit')}
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
