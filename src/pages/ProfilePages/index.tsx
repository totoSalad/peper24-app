import {
  ArrowLeft,
  ChevronRight,
  Check,
  Pencil,
  LogOut,
  Settings,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { logoutAccount } from '../../accountApi'
import { Page, ScreenHeader } from '../../components'
import { useCorrectMemory, useMemories, useRemoveMemory } from '../../memoryApi'
import { useAppStore } from '../../store'
import './index.less'

export function ProfilePage() {
  const profile = useAppStore((state) => state.profile)
  const clearAuthentication = useAppStore((state) => state.clearAuthentication)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loggingOut, setLoggingOut] = useState(false)
  return (
    <Page>
      <ScreenHeader title="我的" action={<Settings />} />
      <Link className="profile-card" to="/profile/edit">
        <div className="avatar">{profile.name.charAt(0)}</div>
        <div>
          <h2>{profile.name}</h2>
          <p>English Level · {profile.englishLevel} 中级</p>
          {(profile.age || profile.occupation) && (
            <span>
              {[profile.age && `${profile.age} 岁`, profile.occupation].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
        <ChevronRight />
      </Link>
      <div className="menu-list">
        <Link to="/memories">
          <Sparkles />
          <div>
            <strong>AI 对我的了解</strong>
            <span>查看和管理 AI 保存的个人记忆</span>
          </div>
          <ChevronRight />
        </Link>
      </div>
      <h3 className="section-label">设置</h3>
      <div className="menu-list compact">
        {/* <Link to="/settings/audio">
          <Volume2 />
          <div>
            <strong>朗读设置</strong>
          </div>
          <ChevronRight />
        </Link> */}
        <Link to="/settings/privacy">
          <Shield />
          <div>
            <strong>隐私和数据管理</strong>
          </div>
          <ChevronRight />
        </Link>
        <button
          className="danger"
          disabled={loggingOut}
          onClick={async () => {
            if (loggingOut) return
            setLoggingOut(true)
            try {
              await logoutAccount()
            } finally {
              queryClient.clear()
              clearAuthentication()
              navigate('/')
            }
          }}
        >
          <LogOut />
          <div>
            <strong>{loggingOut ? '正在退出…' : '退出登录'}</strong>
          </div>
          <ChevronRight />
        </button>
      </div>
    </Page>
  )
}

export function MemoriesPage() {
  const memories = useMemories()
  const correctMemory = useCorrectMemory()
  const removeMemory = useRemoveMemory()
  const [editingId, setEditingId] = useState<string>()
  const [draft, setDraft] = useState('')
  const labels = {
    profile: '个人信息',
    preference: '偏好',
    significant_fact: '重要事实',
    short_term: '短期事实',
  }
  return (
    <Page>
      <header className="sub-header">
        <Link to="/profile">
          <ArrowLeft />
        </Link>
        <h1>AI 对我的了解</h1>
        <span />
      </header>
      <p className="muted page-intro">这些记忆帮助 AI 更自然地延续聊天。你可以随时修改或删除。</p>
      {memories.isPending && <p className="muted memory-state">正在读取记忆…</p>}
      {memories.isError && <p className="memory-state error">记忆加载失败，请稍后重试。</p>}
      {memories.data?.length === 0 && <p className="muted memory-state">还没有保存任何记忆。</p>}
      <div className="memory-list">
        {memories.data?.map((memory) => (
          <article key={memory.id}>
            <Sparkles />
            <div>
              <span>{labels[memory.type]}</span>
              {editingId === memory.id ? (
                <input
                  className="memory-edit"
                  value={draft}
                  maxLength={500}
                  autoFocus
                  onChange={(event) => setDraft(event.target.value)}
                />
              ) : (
                <p>{memory.content}</p>
              )}
              {memory.expiresAt && (
                <small>{new Date(memory.expiresAt).toLocaleDateString('zh-CN')} 过期</small>
              )}
            </div>
            <div className="memory-actions">
              {editingId === memory.id ? (
                <button
                  disabled={!draft.trim() || correctMemory.isPending}
                  onClick={() =>
                    correctMemory.mutate(
                      { id: memory.id, content: draft },
                      { onSuccess: () => setEditingId(undefined) },
                    )
                  }
                  aria-label="保存修改"
                >
                  <Check />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(memory.id)
                    setDraft(memory.content)
                  }}
                  aria-label="修改记忆"
                >
                  <Pencil />
                </button>
              )}
              <button
                disabled={removeMemory.isPending}
                onClick={() => removeMemory.mutate(memory.id)}
                aria-label="删除记忆"
              >
                <Trash2 />
              </button>
            </div>
          </article>
        ))}
      </div>
    </Page>
  )
}

export function AudioSettingsPage() {
  return (
    <Page>
      <header className="sub-header">
        <Link to="/profile">
          <ArrowLeft />
        </Link>
        <h1>语音设置</h1>
        <span />
      </header>
      <section className="settings-card">
        <Sparkles />
        <div>
          <h2>AI 朗读</h2>
          <p>使用设备内置英语音色，优先选择美式女声；具体音色取决于浏览器和系统。</p>
        </div>
      </section>
    </Page>
  )
}

export function PrivacyPage() {
  return (
    <Page>
      <header className="sub-header">
        <Link to="/profile">
          <ArrowLeft />
        </Link>
        <h1>隐私和数据</h1>
        <span />
      </header>
      <section className="settings-card">
        <Shield />
        <div>
          <h2>你的数据由你控制</h2>
          <p>账号、对话和学习记忆保存在服务端；你可以在对应页面修改或删除。</p>
        </div>
      </section>
    </Page>
  )
}
