import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const setupLinks = [
  {
    to: '/admin/seasons',
    label: 'Seasons',
    description: 'Create seasons and set which one is active.',
  },
  {
    to: '/admin/activities',
    label: 'Activities',
    description: 'Manage football and swimming activities.',
  },
  {
    to: '/admin/activity-pricing',
    label: 'Activity pricing',
    description: 'Monthly prices by season, age group, or swimming lesson type.',
  },
  {
    to: '/admin/clothing-pricing',
    label: 'Clothing pricing',
    description: 'Short kit, long kit, and hoodie prices per season.',
  },
] as const

export function AdminHomePage() {
  const { username } = useAuth()

  return (
    <section className="admin-page">
      <h1>Admin home</h1>
      <p>
        Signed in as <strong>{username}</strong>. Configure the season setup below before opening
        registration.
      </p>

      <ul className="admin-home__cards">
        {setupLinks.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="admin-home__card">
              <strong>{link.label}</strong>
              <span>{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
