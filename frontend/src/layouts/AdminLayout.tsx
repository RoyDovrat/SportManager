import { NavLink, Outlet } from 'react-router-dom'

export function AdminLayout() {
  return (
    <div className="layout layout--admin">
      <header className="layout__header">
        <strong>SportManager Admin</strong>
        <nav className="layout__nav">
          <NavLink to="/admin" end>
            Admin home
          </NavLink>
          <NavLink to="/">Public site</NavLink>
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
