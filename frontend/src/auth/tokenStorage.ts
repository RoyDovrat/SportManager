const ACCESS_TOKEN_KEY = 'sportmanager.accessToken'
const USERNAME_KEY = 'sportmanager.username'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY)
}

export function setSession(accessToken: string, username: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(USERNAME_KEY, username)
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem('sportmanager.rememberMe')
}
