import { NavLink, Outlet } from 'react-router-dom'
import { apiBaseUrl } from '../config'

export function PublicLayout() {
  return (
    <div className="layout layout--public">
      <header className="layout__header">
        <strong>SportManager</strong>
        <nav className="layout__nav">
          <NavLink to="/" end>
            Public home
          </NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
      <footer className="layout__footer">
        API: <code>{apiBaseUrl}</code>
      </footer>
    </div>
  )
}
