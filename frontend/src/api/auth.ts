import client from './client'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'student' | 'tutor'
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
  role: 'student' | 'tutor'
  user_id: string
  name: string
}

export const register = (email: string, name: string, password: string) =>
  client.post<AuthUser>('/auth/register', { email, name, password })

export const login = (email: string, password: string) =>
  client.post<Token>('/auth/login', { email, password })

export const me = () => client.get<AuthUser>('/auth/me')
