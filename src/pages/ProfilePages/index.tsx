import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  Mic,
  RotateCcw,
  Settings,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Page, ScreenHeader } from '../../components'
import { useAppStore } from '../../store'
import './index.less'

export function ProfilePage() {
  const profile = useAppStore((state) => state.profile)
  const logout = useAppStore((state) => state.logout)
  const navigate = useNavigate()
  return (
    <Page>
      <ScreenHeader title="我的" action={<Settings />} />
      <section className="profile-card">
        <div className="avatar">{profile.name.charAt(0)}</div>
        <div>
          <h2>{profile.name}</h2>
          <p>English Level · {profile.englishLevel} 中级</p>
          <span>
            {profile.age} 岁 · {profile.occupation}
          </span>
        </div>
        <ChevronRight />
      </section>
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
        <Link to="/settings/audio">
          <Mic />
          <div>
            <strong>麦克风及语音设置</strong>
          </div>
          <ChevronRight />
        </Link>
        <Link to="/settings/privacy">
          <Shield />
          <div>
            <strong>隐私和数据管理</strong>
          </div>
          <ChevronRight />
        </Link>
        <button
          className="danger"
          onClick={() => {
            logout()
            navigate('/')
          }}
        >
          <LogOut />
          <div>
            <strong>退出登录</strong>
          </div>
          <ChevronRight />
        </button>
      </div>
    </Page>
  )
}

export function MemoriesPage() {
  const memories = useAppStore((state) => state.memories)
  const removeMemory = useAppStore((state) => state.removeMemory)
  return (
    <Page>
      <header className="sub-header">
        <Link to="/profile">
          <ArrowLeft />
        </Link>
        <h1>AI 对我的了解</h1>
        <span />
      </header>
      <p className="muted page-intro">这些记忆帮助 AI 更自然地延续聊天。你可以随时删除。</p>
      <div className="memory-list">
        {memories.map((memory) => (
          <article key={memory.id}>
            <Sparkles />
            <div>
              <span>{memory.type}</span>
              <p>{memory.content}</p>
              {memory.expiresAt && <small>{memory.expiresAt}过期</small>}
            </div>
            <button onClick={() => removeMemory(memory.id)} aria-label="删除记忆">
              <Trash2 />
            </button>
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
        <Mic />
        <div>
          <h2>浏览器麦克风</h2>
          <p>首次录音时浏览器会询问权限。原始录音上线后保留 30 天。</p>
        </div>
      </section>
      <section className="settings-card">
        <Sparkles />
        <div>
          <h2>AI 朗读</h2>
          <p>当前使用浏览器语音预览，服务端接入后切换为 Qwen-TTS。</p>
        </div>
      </section>
    </Page>
  )
}

export function PrivacyPage() {
  const resetDemo = useAppStore((state) => state.resetDemo)
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
          <p>当前阶段的数据只保存在这台设备的浏览器中，不会上传。</p>
        </div>
      </section>
      <button className="button danger-button" onClick={resetDemo}>
        <RotateCcw />
        清空本地演示数据
      </button>
    </Page>
  )
}
