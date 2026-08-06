import { ArrowLeft, BookOpen, MessageCircle, Sparkles } from 'lucide-react'
import { type CSSProperties, type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { loginAccount, registerAccount, updateAccountProfile } from '../../accountApi'
import { ApiError } from '../../api'
import { Page } from '../../components'
import { useAppStore } from '../../store'
import type { EnglishLevel } from '../../types'
import './index.less'

const englishLevels: Array<{ level: EnglishLevel; title: string; description: string }> = [
  {
    level: 'A1',
    title: '入门',
    description: '能理解和使用非常基础的日常表达，需要对方说得慢一些。',
  },
  { level: 'A2', title: '基础', description: '能应对购物、出行等熟悉场景，进行简单直接的交流。' },
  { level: 'B1', title: '中级', description: '能处理旅行和日常沟通，连贯描述经历、计划和观点。' },
  {
    level: 'B2',
    title: '中高级',
    description: '能较自然地参与多数话题，清楚表达并解释自己的观点。',
  },
  { level: 'C1', title: '高级', description: '能流利、灵活地交流，理解复杂内容并准确组织表达。' },
  {
    level: 'C2',
    title: '精通',
    description: '能轻松理解几乎所有内容，表达自然、精准且有细微差别。',
  },
]

export function WelcomePage() {
  const authChecked = useAppStore((state) => state.authChecked)
  const authenticated = useAppStore((state) => state.authenticated)
  if (!authChecked)
    return (
      <Page className="session-loading">
        <p className="muted">正在恢复登录状态…</p>
      </Page>
    )
  if (authenticated) return <Navigate to="/topics" replace />
  return (
    <Page className="welcome-page">
      <div className="brand-mark">
        <BookOpen />
      </div>
      <h1 className="brand-title">SpeakEasy</h1>
      <p className="muted brand-subtitle">敢于开口，轻松表达</p>
      <div className="benefits">
        <p>
          <MessageCircle />
          沉浸式场景对话，真实情境练习
        </p>
        <p>
          <BookOpen />
          不会说的单词短语，一键加入词汇本
        </p>
        <p>
          <Sparkles />
          AI 自然纠正表达，无压力提升
        </p>
      </div>
      <div className="welcome-actions">
        <Link className="button primary" to="/register">
          注册账号
        </Link>
        <Link className="button secondary" to="/login">
          已有账号？登录
        </Link>
      </div>
    </Page>
  )
}

function AuthHeader({ title, backTo = '/' }: { title: string; backTo?: string }) {
  return (
    <>
      <Link className="icon-link" to={backTo}>
        <ArrowLeft />
      </Link>
      <h1 className="auth-title">{title}</h1>
    </>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuthenticated = useAppStore((state) => state.setAuthenticated)
  const [email, setEmail] = useState('lihua@example.com')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.includes('@') || password.length < 8) return
    setSubmitting(true)
    setError('')
    try {
      const account = await registerAccount(email, password)
      setAuthenticated(account, true)
      navigate('/onboarding/profile')
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : '注册失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <Page className="auth-page">
      <AuthHeader title="创建账号" />
      <p className="muted">开始你的英语表达练习</p>
      <form className="form-stack" onSubmit={submit}>
        <label>
          邮箱
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          密码
          <input
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary" type="submit" disabled={submitting}>
          {submitting ? '正在创建账号…' : '创建账号'}
        </button>
      </form>
    </Page>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const setAuthenticated = useAppStore((state) => state.setAuthenticated)
  const [email, setEmail] = useState('lihua@example.com')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const account = await loginAccount(email, password)
      setAuthenticated(account)
      navigate('/topics')
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : '登录失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <Page className="auth-page">
      <AuthHeader title="欢迎回来" />
      <p className="muted">继续和你的英语朋友聊天</p>
      <form className="form-stack" onSubmit={submit}>
        <label>
          邮箱
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary" type="submit" disabled={submitting}>
          {submitting ? '正在登录…' : '登录'}
        </button>
      </form>
    </Page>
  )
}

function ProfileEditor({ onboarding }: { onboarding: boolean }) {
  const navigate = useNavigate()
  const current = useAppStore((state) => state.profile)
  const setProfile = useAppStore((state) => state.setProfile)
  const [name, setName] = useState(current.name)
  const [age, setAge] = useState(current.age?.toString() ?? '')
  const [occupation, setOccupation] = useState(current.occupation ?? '')
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>(current.englishLevel)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const levelIndex = englishLevels.findIndex((item) => item.level === englishLevel)
  const selectedLevel = englishLevels[levelIndex]
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const account = await updateAccountProfile({
        displayName: name,
        ...(age ? { age: Number(age) } : {}),
        ...(occupation.trim() ? { occupation } : {}),
        englishLevel,
      })
      setProfile(account)
      navigate(onboarding ? '/topics' : '/profile')
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : '资料保存失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <Page className="auth-page">
      {onboarding ? (
        <span className="step-label">最后一步</span>
      ) : (
        <AuthHeader title="编辑个人资料" backTo="/profile" />
      )}
      {onboarding && <h1 className="auth-title">让朋友更懂你</h1>}
      <p className="muted">这些信息用于调整聊天难度和话题</p>
      <form className="form-stack" onSubmit={submit}>
        <label>
          怎么称呼你
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="field-row">
          <label>
            年龄
            <input
              type="number"
              min={8}
              max={100}
              value={age}
              onChange={(event) => setAge(event.target.value)}
            />
          </label>
          <label>
            职业
            <input value={occupation} onChange={(event) => setOccupation(event.target.value)} />
          </label>
        </div>
        <fieldset className="level-fieldset">
          <legend>英语水平（CEFR）</legend>
          <div className="level-slider-wrap">
            <input
              className="level-slider"
              type="range"
              min={0}
              max={englishLevels.length - 1}
              step={1}
              value={levelIndex}
              aria-label="英语水平"
              aria-valuetext={`${selectedLevel.level} ${selectedLevel.title}`}
              onChange={(event) => setEnglishLevel(englishLevels[Number(event.target.value)].level)}
              style={
                {
                  '--level-progress': `${(levelIndex / (englishLevels.length - 1)) * 100}%`,
                } as CSSProperties
              }
            />
            <div className="level-marks" aria-hidden="true">
              {englishLevels.map((item) => (
                <span className={item.level === englishLevel ? 'active' : ''} key={item.level}>
                  {item.level}
                </span>
              ))}
            </div>
          </div>
          <div className="level-summary" aria-live="polite">
            <div>
              <strong>{selectedLevel.level}</strong>
              <span>{selectedLevel.title}</span>
            </div>
            <p>{selectedLevel.description}</p>
          </div>
        </fieldset>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary" type="submit" disabled={submitting}>
          {submitting ? '正在保存…' : onboarding ? '开始练习' : '保存修改'}
        </button>
      </form>
    </Page>
  )
}

export function ProfileSetupPage() {
  return <ProfileEditor onboarding />
}

export function EditProfilePage() {
  return <ProfileEditor onboarding={false} />
}
