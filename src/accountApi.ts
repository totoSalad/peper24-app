import { apiRequest } from './api'
import type { Account, AccountProfile, EnglishLevel } from './types'

export async function registerAccount(email: string, password: string): Promise<Account> {
  const profile = {
    displayName: email.split('@')[0].slice(0, 50) || 'Learner',
    englishLevel: 'B1' as EnglishLevel,
  }
  return (
    await apiRequest<{ user: Account }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, profile }),
    })
  ).user
}

export async function loginAccount(email: string, password: string): Promise<Account> {
  return (
    await apiRequest<{ user: Account }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  ).user
}

export async function getCurrentAccount(): Promise<Account> {
  return (await apiRequest<{ user: Account }>('/api/v1/me')).user
}

export async function updateAccountProfile(profile: AccountProfile): Promise<Account> {
  return (
    await apiRequest<{ user: Account }>('/api/v1/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    })
  ).user
}

export async function logoutAccount(): Promise<void> {
  await apiRequest<void>('/api/v1/auth/logout', { method: 'POST', body: '{}' })
}
