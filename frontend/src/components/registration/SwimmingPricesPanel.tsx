import type { SwimmingCatalogResponse } from '../../api/publicCatalog'
import { swimmingLessonTypeLabel } from '../../i18n/labels'
import { t } from '../../i18n/t'
import type { SwimmingLessonType } from '../../types/enums'

type SwimmingPricesPanelProps = {
  catalog: SwimmingCatalogResponse
}

export function SwimmingPricesPanel({ catalog }: SwimmingPricesPanelProps) {
  return (
    <section
      className="football-catalog football-catalog--step"
      aria-label={t('swimmingCatalog.pricesTitle')}
    >
      <div className="football-catalog__band">
        <h2 className="football-catalog__title">{t('swimmingCatalog.pricesTitle')}</h2>
        <p className="football-catalog__subtitle">
          {t('swimmingCatalog.seasonLine', { season: catalog.seasonName })}
        </p>
      </div>

      <p className="swimming-catalog__hint">{t('swimmingCatalog.unitPriceHint')}</p>
      <p className="swimming-catalog__hint">
        {t('swimmingCatalog.groupSessionsHint', {
          count: catalog.groupWeeklySessions,
        })}
      </p>

      {catalog.prices.length === 0 ? (
        <p className="football-catalog__empty">{t('swimmingCatalog.pricesEmpty')}</p>
      ) : (
        <div className="football-catalog__prices-block">
          <ul className="football-catalog__prices-list">
            {catalog.prices.map((price) => (
              <li key={price.activityPricingId}>
                <span>
                  {t('swimmingCatalog.unitPriceLine', {
                    lesson: swimmingLessonTypeLabel(
                      price.swimmingLessonType as SwimmingLessonType,
                    ),
                  })}
                </span>
                <strong>
                  {t('swimmingCatalog.priceAmount', {
                    amount: price.unitMonthlyPrice,
                  })}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
