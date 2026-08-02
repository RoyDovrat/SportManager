import { t } from '../../i18n/t'

export function HealthDeclarationPage() {
  return (
    <article className="health-declaration-page">
      <header className="health-declaration-page__header">
        <h1>{t('healthDeclarationPage.title')}</h1>
        <p className="health-declaration-page__intro">
          {t('healthDeclarationPage.intro')}
        </p>
      </header>

      <ol className="health-declaration-page__list">
        <li>{t('healthDeclarationPage.item1')}</li>
        <li>{t('healthDeclarationPage.item2')}</li>
        <li>{t('healthDeclarationPage.item3')}</li>
        <li>{t('healthDeclarationPage.item4')}</li>
        <li>{t('healthDeclarationPage.item5')}</li>
        <li>{t('healthDeclarationPage.item6')}</li>
      </ol>

      <p className="health-declaration-page__closing">
        {t('healthDeclarationPage.closing')}
      </p>

      <p className="health-declaration-page__actions">
        <button
          type="button"
          className="btn"
          onClick={() => window.close()}
        >
          {t('healthDeclarationPage.closeWindow')}
        </button>
      </p>
    </article>
  )
}
