import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to public home</Link>
        {' · '}
        <Link to="/admin">Admin home</Link>
      </p>
    </section>
  )
}
