import type { FootballCatalogResponse } from '../../api/publicCatalog'
import { dayOfWeekLabel } from '../../i18n/labels'
import { sortByDayOfWeek } from '../../utils/dayOfWeekOrder'
import { t } from '../../i18n/t'

type FootballCatalogPanelProps = {
  catalog: FootballCatalogResponse
  highlightedGroupId: number | null
  showPriceList?: boolean
  variant?: 'inline' | 'step'
}

function formatTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value
}

function formatSessionTime(startTime: string, endTime: string | null): string {
  const start = formatTime(startTime)
  if (!endTime) {
    return start
  }
  return `${start}–${formatTime(endTime)}`
}

export function FootballCatalogPanel({
  catalog,
  highlightedGroupId,
  showPriceList = false,
  variant = 'inline',
}: FootballCatalogPanelProps) {
  const sortedPrices = [...catalog.prices].sort(
    (a, b) => a.weeklySessions - b.weeklySessions,
  )

  return (
    <section
      className={
        variant === 'step'
          ? 'football-catalog football-catalog--step'
          : 'football-catalog'
      }
      aria-label={t('footballCatalog.title')}
    >
      <div className="football-catalog__band">
        <h2 className="football-catalog__title">{t('footballCatalog.title')}</h2>
        <p className="football-catalog__subtitle">
          {t('footballCatalog.seasonLine', { season: catalog.seasonName })}
        </p>
      </div>

      {showPriceList && (
        <div className="football-catalog__prices-block">
          <h3 className="football-catalog__prices-title">
            {t('footballCatalog.pricesTitle')}
          </h3>
          {sortedPrices.length === 0 ? (
            <p className="football-catalog__empty">
              {t('footballCatalog.priceUnavailable')}
            </p>
          ) : (
            <ul className="football-catalog__prices-list">
              {sortedPrices.map((price) => (
                <li key={price.activityPricingId}>
                  <span>
                    {t('footballCatalog.priceBySessions', {
                      count: price.weeklySessions,
                    })}
                  </span>
                  <strong>
                    {t('footballCatalog.priceAmount', {
                      amount: price.monthlyPrice,
                    })}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {catalog.groups.length === 0 ? (
        <p className="football-catalog__empty">{t('footballCatalog.empty')}</p>
      ) : (
        <ul className="football-catalog__list">
          {catalog.groups.map((group) => {
            const isMatch = highlightedGroupId === group.id
            const activeSessions = sortByDayOfWeek(
              group.trainingSessions.filter((session) => session.isActive),
            )
            return (
              <li
                key={group.id}
                className={
                  isMatch
                    ? 'football-catalog__group football-catalog__group--match'
                    : 'football-catalog__group'
                }
              >
                <div className="football-catalog__group-head">
                  <h3 className="football-catalog__group-name">{group.name}</h3>
                  {isMatch && (
                    <span className="football-catalog__match-badge">
                      {t('footballCatalog.matchedGroup')}
                    </span>
                  )}
                </div>

                <p className="football-catalog__meta">
                  <span className="football-catalog__label">
                    {t('footballCatalog.weeklySessions')}
                  </span>
                  {group.weeklySessions ?? '—'}
                </p>

                <div className="football-catalog__sessions">
                  <span className="football-catalog__label">
                    {t('footballCatalog.schedule')}
                  </span>
                  {activeSessions.length === 0 ? (
                    <span>{t('footballCatalog.noSchedule')}</span>
                  ) : (
                    <ul className="football-catalog__session-list">
                      {activeSessions.map((session) => (
                        <li key={session.id}>
                          {dayOfWeekLabel(session.dayOfWeek)}{' '}
                          {formatSessionTime(session.startTime, session.endTime)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
