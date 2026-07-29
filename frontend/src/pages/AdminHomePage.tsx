import { useAuth } from '../auth/AuthContext'

export function AdminHomePage() {
  const { username } = useAuth()

  return (
    <section>
      <h1>Admin home</h1>
      <p>
        Signed in as <strong>{username}</strong>. Domain screens will be added in later phases.
      </p>
    </section>
  )
}
