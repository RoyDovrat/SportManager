import { Link } from 'react-router-dom'
import { t } from '../i18n/t'

export function NotFoundPage() {
  return (
    <section>
      <h1>{t('notFound.title')}</h1>
      <p>
        <Link to="/">{t('notFound.backPublic')}</Link>
        {' · '}
        <Link to="/admin">{t('notFound.backAdmin')}</Link>
      </p>
    </section>
  )
}
