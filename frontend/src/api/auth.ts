import { apiRequest } from './client'

export type LoginRequest = {
  username: string
  password: string
}

export type AuthResponse = {
  accessToken: string
  tokenType: string
  expiresInMs: number
  username: string
}

export function login(credentials: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: credentials,
  })
}
