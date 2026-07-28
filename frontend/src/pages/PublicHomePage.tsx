import { useState } from 'react'
import { ApiError } from '../api'
import { getHealth } from '../api/health'

type HealthCheckState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; value: string }
  | { status: 'error'; message: string }

export function PublicHomePage() {
  const [check, setCheck] = useState<HealthCheckState>({ status: 'idle' })

  async function handleCheckHealth() {
    setCheck({ status: 'loading' })

    try {
      const result = await getHealth()
      setCheck({ status: 'ok', value: result.status })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error calling the API'

      setCheck({ status: 'error', message })
    }
  }

  return (
    <section>
      <h1>Public home</h1>
      <p>Public registration and info will live here (later phases).</p>

      <div className="health-check">
        <h2>API connection check</h2>
        <p>Calls the public backend endpoint GET /api/health (CORS + client smoke test).</p>
        <button type="button" onClick={handleCheckHealth} disabled={check.status === 'loading'}>
          {check.status === 'loading' ? 'Checking…' : 'Check API health'}
        </button>

        {check.status === 'ok' && (
          <p className="health-check__ok">
            Backend responded: <code>{check.value}</code>
          </p>
        )}

        {check.status === 'error' && (
          <p className="health-check__error">
            Request failed: {check.message}
          </p>
        )}
      </div>
    </section>
  )
}
