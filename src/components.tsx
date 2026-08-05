import { BookOpen, MessageCircle, UserRound } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from './store'

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
  const authenticated = useAppStore((state) => state.authenticated)
  const location = useLocation()
  if (!authenticated) return <Navigate to="/" replace state={{ from: location.pathname }} />
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
