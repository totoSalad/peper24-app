import { BookOpen, MessageCircle, UserRound } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, type ReactNode, useEffect } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { getCurrentAccount } from './accountApi'
import { setUnauthorizedHandler, useServerApi } from './api'
import { useAppStore } from './store'

export function AuthBootstrap({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const setAuthenticated = useAppStore((state) => state.setAuthenticated)
  const clearAuthentication = useAppStore((state) => state.clearAuthentication)
  const markAuthChecked = useAppStore((state) => state.markAuthChecked)

  useEffect(() => {
    const unauthorized = () => {
      clearAuthentication()
      queryClient.clear()
    }
    setUnauthorizedHandler(unauthorized)
    if (!useServerApi) {
      markAuthChecked()
      return () => setUnauthorizedHandler(undefined)
    }
    let active = true
    void getCurrentAccount()
      .then((account) => {
        if (active) {
          setAuthenticated(account, useAppStore.getState().onboardingRequired)
        }
      })
      .catch(() => {
        if (active) clearAuthentication()
      })
    return () => {
      active = false
      setUnauthorizedHandler(undefined)
    }
  }, [clearAuthentication, markAuthChecked, queryClient, setAuthenticated])

  return children
}

export function Page({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <main className={`page ${className}`}>{children}</main>
}

export function ScreenHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="screen-header">
      <h1>{title}</h1>
      {action}
    </header>
  )
}

export function ProtectedRoute() {
  const authChecked = useAppStore((state) => state.authChecked)
  const authenticated = useAppStore((state) => state.authenticated)
  const onboardingRequired = useAppStore((state) => state.onboardingRequired)
  const location = useLocation()
  if (!authChecked) {
    return (
      <Page className="session-loading">
        <p className="muted">正在恢复登录状态…</p>
      </Page>
    )
  }
  if (!authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (onboardingRequired && location.pathname !== '/onboarding/profile') {
    return <Navigate to="/onboarding/profile" replace />
  }
  return <Outlet />
}

export function MainLayout() {
  return (
    <div className="app-frame">
      <div className="app-content">
        <Outlet />
      </div>
      <nav className="bottom-nav" aria-label="主导航">
        <NavLink to="/topics" className={({ isActive }) => (isActive ? 'active' : '')}>
          <MessageCircle />
          <span>聊天</span>
        </NavLink>
        <NavLink to="/learn" className={({ isActive }) => (isActive ? 'active' : '')}>
          <BookOpen />
          <span>学习</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
          <UserRound />
          <span>我的</span>
        </NavLink>
      </nav>
    </div>
  )
}
