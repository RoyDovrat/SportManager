import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { t } from '../i18n/t'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const cleanedUsername = username.trim()
    if (!cleanedUsername || !password) {
      setError(t('login.required'))
      setSubmitting(false)
      return
    }

    try {
      await login(cleanedUsername, password)
      navigate('/admin', { replace: true })
    } catch {
      setError(t('login.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>{t('login.title')}</h1>
        <p className="login-form__hint">{t('login.hint')}</p>

        <label className="login-form__field">
          <span>{t('login.username')}</span>
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="login-form__field">
          <span>{t('login.password')}</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && (
          <p className="login-form__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? t('login.submitting') : t('login.submit')}
        </button>

        <p className="login-form__footer">
          <Link to="/">{t('login.backPublic')}</Link>
        </p>
      </form>
    </div>
  )
}
