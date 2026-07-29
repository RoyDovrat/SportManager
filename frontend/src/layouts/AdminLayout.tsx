import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AdminLayout() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="layout layout--admin">
      <header className="layout__header">
        <strong>SportManager Admin</strong>
        <nav className="layout__nav">
          <NavLink to="/admin" end>
            Admin home
          </NavLink>
          <NavLink to="/">Public site</NavLink>
          <span className="layout__user">
            Signed in as <strong>{username ?? 'admin'}</strong>
          </span>
          <button type="button" className="layout__logout" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
