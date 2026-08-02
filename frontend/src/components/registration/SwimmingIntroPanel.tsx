import type { SwimmingCatalogResponse } from '../../api/publicCatalog'
import { t } from '../../i18n/t'
import { MarkdownView } from '../ui/MarkdownView'

type SwimmingIntroPanelProps = {
  catalog: SwimmingCatalogResponse
}

export function SwimmingIntroPanel({ catalog }: SwimmingIntroPanelProps) {
  const hasIntro = Boolean(catalog.introMarkdown?.trim())

  return (
    <section className="swimming-intro" aria-label={t('swimmingCatalog.introTitle')}>
      <div className="swimming-intro__band">
        <h2 className="swimming-intro__title">{t('swimmingCatalog.introTitle')}</h2>
        <p className="swimming-intro__subtitle">
          {t('swimmingCatalog.seasonLine', { season: catalog.seasonName })}
        </p>
      </div>

      {hasIntro ? (
        <MarkdownView
          className="swimming-intro__body"
          markdown={catalog.introMarkdown}
        />
      ) : (
        <p className="swimming-intro__empty">{t('swimmingCatalog.introEmpty')}</p>
      )}
    </section>
  )
}
