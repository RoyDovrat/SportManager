import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const setupLinks = [
  { to: '/admin/seasons', label: 'Seasons' },
  { to: '/admin/activities', label: 'Activities' },
  { to: '/admin/activity-pricing', label: 'Activity pricing' },
  { to: '/admin/clothing-pricing', label: 'Clothing pricing' },
] as const

export function AdminHomePage() {
  const { username } = useAuth()

  return (
    <section>
      <h1>Admin home</h1>
      <p>
        Signed in as <strong>{username}</strong>.
      </p>
      <p>Setup areas (F2):</p>
      <ul className="admin-home__links">
        {setupLinks.map((link) => (
          <li key={link.to}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
