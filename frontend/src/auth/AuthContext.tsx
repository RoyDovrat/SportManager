import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { login as loginRequest } from '../api/auth'
import { UNAUTHORIZED_EVENT } from './authEvents'
import {
  clearSession,
  getAccessToken,
  getUsername,
  setSession,
} from './tokenStorage'

type AuthContextValue = {
  token: string | null
  username: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readInitialSession(): { token: string | null; username: string | null } {
  return {
    token: getAccessToken(),
    username: getUsername(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState(readInitialSession)

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginRequest({ username, password })
    setSession(response.accessToken, response.username)
    setSessionState({
      token: response.accessToken,
      username: response.username,
    })
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSessionState({ token: null, username: null })
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession()
      setSessionState({ token: null, username: null })
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token: session.token,
      username: session.username,
      isAuthenticated: Boolean(session.token),
      login,
      logout,
    }),
    [session.token, session.username, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
