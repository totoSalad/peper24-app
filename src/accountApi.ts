import { apiRequest, useServerApi } from './api'
import type { Account, AccountProfile, EnglishLevel } from './types'

let demoAccount: Account | undefined

function now() {
  return new Date().toISOString()
}

function demoUser(email: string, profile?: AccountProfile): Account {
  const timestamp = now()
  return {
    id: crypto.randomUUID(),
    email,
    status: 'active',
    profile: profile ?? {
      displayName: email.split('@')[0] || 'Learner',
      englishLevel: 'B1',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export async function registerAccount(email: string, password: string): Promise<Account> {
  const profile = {
    displayName: email.split('@')[0].slice(0, 50) || 'Learner',
    englishLevel: 'B1' as EnglishLevel,
  }
  if (useServerApi) {
    return (
      await apiRequest<{ user: Account }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, profile }),
      })
    ).user
  }
  demoAccount = demoUser(email, profile)
  return demoAccount
}

export async function loginAccount(email: string, password: string): Promise<Account> {
  if (useServerApi) {
    return (
      await apiRequest<{ user: Account }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    ).user
  }
  demoAccount = demoAccount ?? demoUser(email)
  return { ...demoAccount, email }
}

export async function getCurrentAccount(): Promise<Account> {
  if (!useServerApi) {
    if (!demoAccount) throw new Error('UNAUTHENTICATED')
    return demoAccount
  }
  return (await apiRequest<{ user: Account }>('/api/v1/me')).user
}

export async function updateAccountProfile(profile: AccountProfile): Promise<Account> {
  if (useServerApi) {
    return (
      await apiRequest<{ user: Account }>('/api/v1/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      })
    ).user
  }
  if (!demoAccount) demoAccount = demoUser('lihua@example.com', profile)
  demoAccount = { ...demoAccount, profile, updatedAt: now() }
  return demoAccount
}

export async function logoutAccount(): Promise<void> {
  if (useServerApi) {
    await apiRequest<void>('/api/v1/auth/logout', { method: 'POST', body: '{}' })
  }
  demoAccount = undefined
}
