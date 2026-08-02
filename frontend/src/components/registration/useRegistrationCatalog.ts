import { useEffect, useState } from 'react'
import { formatPublicApiError } from '../../api/formatPublicApiError'
import {
  getActiveSeason,
  getFootballCatalog,
  listActiveActivities,
  type FootballCatalogResponse,
} from '../../api/publicCatalog'
import type { ActivityResponse } from '../../api/activities'
import type { SeasonResponse } from '../../api/seasons'
import { activityTypeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import type { ActivityType } from '../../types/enums'

type CatalogState = {
  loading: boolean
  error: string | null
  season: SeasonResponse | null
  activity: ActivityResponse | null
  footballCatalog: FootballCatalogResponse | null
}

export function useRegistrationCatalog(activityType: ActivityType): CatalogState {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [season, setSeason] = useState<SeasonResponse | null>(null)
  const [activity, setActivity] = useState<ActivityResponse | null>(null)
  const [footballCatalog, setFootballCatalog] =
    useState<FootballCatalogResponse | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [activeSeason, activities] = await Promise.all([
          getActiveSeason(),
          listActiveActivities(),
        ])

        if (cancelled) {
          return
        }

        const matched = activities.find(
          (item) => item.activityType === activityType && item.isActive,
        )

        if (!matched) {
          setSeason(activeSeason)
          setActivity(null)
          setFootballCatalog(null)
          setError(
            t('registration.noActiveActivity', {
              type: activityTypeLabel(activityType),
            }),
          )
          return
        }

        let nextFootballCatalog: FootballCatalogResponse | null = null
        if (activityType === 'FOOTBALL') {
          nextFootballCatalog = await getFootballCatalog()
          if (cancelled) {
            return
          }
        }

        setSeason(activeSeason)
        setActivity(matched)
        setFootballCatalog(nextFootballCatalog)
      } catch (err) {
        if (!cancelled) {
          setSeason(null)
          setActivity(null)
          setFootballCatalog(null)
          setError(formatPublicApiError(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [activityType])

  return { loading, error, season, activity, footballCatalog }
}
