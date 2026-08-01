import { useEffect, useState } from 'react'
import { formatPublicApiError } from '../../api/formatPublicApiError'
import { getActiveSeason, listActiveActivities } from '../../api/publicCatalog'
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
}

export function useRegistrationCatalog(activityType: ActivityType): CatalogState {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [season, setSeason] = useState<SeasonResponse | null>(null)
  const [activity, setActivity] = useState<ActivityResponse | null>(null)

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
          setError(
            t('registration.noActiveActivity', {
              type: activityTypeLabel(activityType),
            }),
          )
          return
        }

        setSeason(activeSeason)
        setActivity(matched)
      } catch (err) {
        if (!cancelled) {
          setSeason(null)
          setActivity(null)
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

  return { loading, error, season, activity }
}
