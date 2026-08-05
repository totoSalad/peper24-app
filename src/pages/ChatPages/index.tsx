import {
  ArrowLeft,
  FileText,
  Languages,
  MessageCircle,
  Mic,
  Music2,
  Plane,
  Play,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Square,
  Stethoscope,
  Utensils,
  Volume2,
  X,
} from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import newTopicCharacter from '../../assets/new-topic-character.png'
import { Page } from '../../components'
import { detectGrammarPattern, mockTranscription, streamMockReply } from '../../mockApi'
import { useAppStore } from '../../store'
import type { Message } from '../../types'
import './index.less'

const makeId = () => crypto.randomUUID()

export function TopicsPage() {
  const navigate = useNavigate()
  const createConversation = useAppStore((state) => state.createConversation)
  const conversations = useAppStore((state) => state.conversations)
  const messages = useAppStore((state) => state.messages)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<'custom' | 'random'>('random')
  const [topic, setTopic] = useState('')
  const [randomIndex, setRandomIndex] = useState(0)
  const start = (value: string, scene = value) =>
    navigate(`/chat/${createConversation(value, scene)}`)
  const suggestions = [
    { name: '餐厅点餐', icon: Utensils },
    { name: '购物退货', icon: ShoppingBag },
    { name: '机场登机', icon: Plane },
    { name: '看病就医', icon: Stethoscope },
  ]
  const randomTopics = [
    {
      title: '音乐节偶遇',
      detail: '在音乐节上认识来自世界各地的新朋友，聊聊音乐、旅行和文化',
      icon: Music2,
    },
    {
      title: '周末咖啡馆',
      detail: '和刚认识的朋友坐下来，聊聊周末计划、兴趣爱好与最近的生活',
      icon: MessageCircle,
    },
    {
      title: '城市漫游',
      detail: '向当地人问路并交换旅行故事，发现这座城市不为人知的一面',
      icon: Plane,
    },
  ]
  const generated = randomTopics[randomIndex]
  const GeneratedIcon = generated.icon
  const openDialog = () => {
    setMode('custom')
    setDialogOpen(true)
  }
  const begin = (value: string) => {
    if (!value.trim()) return
    setDialogOpen(false)
    start(value.trim())
  }
  const fallbackConversations = [
    {
      id: '',
      topic: '餐厅点餐',
      preview: "I'd like to order a coffee and a sandwich please...",
      time: '10分钟前',
    },
    {
      id: '',
      topic: '酒店入住',
      preview: 'Can you tell me what time is the check-in?',
      time: '2小时前',
    },
    {
      id: '',
      topic: '机场登机',
      preview: 'Could you help me find the boarding gate for...',
      time: '昨天 14:30',
    },
    {
      id: '',
      topic: '购物退货',
      preview: "I bought this shirt yesterday but it's too small...",
      time: '昨天 10:15',
    },
    {
      id: '',
      topic: '看病就医',
      preview: "I've been having a headache for three days...",
      time: '3天前',
    },
  ]
  const list = conversations.length
    ? conversations.map((conversation) => ({
        ...conversation,
        preview: messages[conversation.id]?.at(-1)?.content ?? '开始一段新的对话',
        time: new Date(conversation.updatedAt).toLocaleDateString('zh-CN'),
      }))
    : fallbackConversations
  return (
    <Page className="topics-page">
      <header className="topics-header">
        <h1>聊天</h1>
        <div>
          <button aria-label="搜索">
            <Search />
          </button>
          <button aria-label="筛选">
            <SlidersHorizontal />
          </button>
        </div>
      </header>
      <button className="new-topic-card" onClick={openDialog}>
        <img className="new-topic-figure-absolute" src={newTopicCharacter} alt="" />
        <span className="new-topic-figure" aria-hidden="true" />
        <span className="new-topic-copy">
          <strong>开启新话题</strong>
          <small>自定义话题或让 AI 随机生成</small>
        </span>
        <span className="new-topic-plus">
          <Plus />
        </span>
      </button>
      <section className="conversation-section">
        <header>
          <h2>最近对话</h2>
          <button>查看全部</button>
        </header>
        <div className="conversation-list">
          {list.map((item, index) => (
            <button
              className="conversation-card"
              key={item.id || item.topic}
              onClick={() => (item.id ? navigate(`/chat/${item.id}`) : start(item.topic))}
            >
              <span className={`conversation-icon ${index === 0 ? 'active' : ''}`}>
                {index === 0 ? <MessageCircle /> : <FileText />}
              </span>
              <span className="conversation-copy">
                <strong>{item.topic}</strong>
                <small>{item.preview}</small>
              </span>
              <span className="conversation-time">
                {item.time}
                {index === 0 && <i />}
              </span>
            </button>
          ))}
        </div>
      </section>

      {dialogOpen && (
        <div
          className="topic-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-topic-title"
        >
          <header>
            <button className="dialog-close" onClick={() => setDialogOpen(false)} aria-label="关闭">
              <X />
            </button>
            <h2 id="new-topic-title">开启新话题</h2>
          </header>
          <div className="topic-tabs">
            <button className={mode === 'random' ? 'active' : ''} onClick={() => setMode('random')}>
              随机生成
            </button>
            <button className={mode === 'custom' ? 'active' : ''} onClick={() => setMode('custom')}>
              自定义话题
            </button>
          </div>
          {mode === 'custom' ? (
            <div className="custom-topic-panel">
              <label htmlFor="custom-topic">描述你想练习的场景</label>
              <textarea
                id="custom-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="例如：在咖啡店点餐、酒店入住、看病就医..."
              />
              <small className="suggestion-label">💡 推荐场景</small>
              <div className="topic-suggestions">
                {suggestions.map(({ name, icon: Icon }) => (
                  <button key={name} onClick={() => setTopic(name)}>
                    <Icon />
                    {name}
                  </button>
                ))}
              </div>
              <button
                className="start-topic-button"
                disabled={!topic.trim()}
                onClick={() => begin(topic)}
              >
                开始对话
              </button>
            </div>
          ) : (
            <div className="random-topic-panel">
              <p>AI 为你推荐了这个场景，不喜欢可以换</p>
              <article className="random-topic-card">
                <span className="random-sparkle">
                  <Sparkles />
                </span>
                <GeneratedIcon />
                <h3>{generated.title}</h3>
                <p>{generated.detail}</p>
                <div>
                  <button onClick={() => setRandomIndex((randomIndex + 1) % randomTopics.length)}>
                    <Shuffle />
                    换一个
                  </button>
                  <button onClick={() => begin(generated.title)}>
                    <Play />
                    就用这个
                  </button>
                </div>
              </article>
            </div>
          )}
        </div>
      )}
    </Page>
  )
}

function MessageBubble({
  message,
  onTranslate,
  onSpeak,
  onSelect,
}: {
  message: Message
  onTranslate: () => void
  onSpeak: () => void
  onSelect: () => void
}) {
  return (
    <article className={`message ${message.role}`} onMouseUp={onSelect}>
      <p>{message.content}</p>
      <time>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </time>
      <div className="message-tools">
        <button onClick={onSpeak} aria-label="朗读">
          <Volume2 />
        </button>
        <button onClick={onTranslate} aria-label="翻译">
          <Languages />
        </button>
      </div>
      {message.translation && <p className="translation">{message.translation}</p>}
      {message.correction && (
        <aside className="correction">
          <Sparkles />
          <div>
            <strong>一个小提示</strong>
            <p>
              <del>{message.correction.original}</del> → {message.correction.corrected}
            </p>
            <small>{message.correction.note}</small>
          </div>
        </aside>
      )}
    </article>
  )
}

export function ChatPage() {
  const { conversationId = '' } = useParams()
  const conversation = useAppStore((state) =>
    state.conversations.find((item) => item.id === conversationId),
  )
  const messages = useAppStore((state) => state.messages[conversationId] ?? [])
  const addMessage = useAppStore((state) => state.addMessage)
  const updateMessage = useAppStore((state) => state.updateMessage)
  const addVocabulary = useAppStore((state) => state.addVocabulary)
  const recordGrammarPattern = useAppStore((state) => state.recordGrammarPattern)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [selected, setSelected] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)

  const send = async (event?: FormEvent) => {
    event?.preventDefault()
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)
    const userMessage: Message = {
      id: makeId(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    addMessage(conversationId, userMessage)
    const assistantId = makeId()
    addMessage(conversationId, {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    })
    let reply = ''
    for await (const chunk of streamMockReply(content)) {
      reply += chunk
      updateMessage(conversationId, assistantId, { content: reply.trimStart() })
    }
    const detected = detectGrammarPattern(content)
    if (detected && recordGrammarPattern(detected.key).shouldCorrect)
      updateMessage(conversationId, assistantId, { correction: detected.correction })
    if (content.includes('怎么说') || content.includes('怎么表达'))
      addVocabulary('I was almost late today', '我今天差点迟到了', 'I was almost late today.')
    setSending(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        setInput(await mockTranscription())
        setRecording(false)
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    } catch {
      setInput('麦克风不可用，请检查浏览器权限。')
    }
  }
  const stopRecording = () => recorderRef.current?.stop()
  const speak = (message: Message) => {
    speechSynthesis.cancel()
    speechSynthesis.speak(new SpeechSynthesisUtterance(message.content))
  }
  const selectText = () => {
    const value = window.getSelection()?.toString().trim() ?? ''
    if (value) setSelected(value)
  }

  if (!conversation)
    return (
      <Page>
        <p>没有找到这个会话。</p>
        <Link to="/topics">返回话题</Link>
      </Page>
    )
  return (
    <div className="chat-page">
      <header className="chat-header">
        <Link to="/topics">
          <ArrowLeft />
        </Link>
        <strong>{conversation.topic}</strong>
        <span />
      </header>
      <div className="message-list">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSpeak={() => speak(message)}
            onTranslate={() =>
              updateMessage(conversationId, message.id, {
                translation: message.translation
                  ? undefined
                  : message.role === 'assistant'
                    ? '这是这条英文消息的中文翻译。'
                    : 'This is the English translation of your message.',
              })
            }
            onSelect={selectText}
          />
        ))}
        {sending && <span className="typing">AI 正在输入…</span>}
      </div>
      {selected && (
        <button
          className="selection-pill"
          onClick={() => {
            addVocabulary(selected, '选中的表达')
            setSelected('')
            window.getSelection()?.removeAllRanges()
          }}
        >
          收藏“{selected}”
        </button>
      )}
      <div className="quick-tools">
        <button onClick={() => setInput('“我今天差点迟到了”怎么说？')}>
          <Sparkles />
          这句话怎么说
        </button>
      </div>
      <form className="composer" onSubmit={send}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入消息…"
        />
        <button type="submit" disabled={sending} aria-label="发送">
          <Send />
        </button>
        <button
          className={recording ? 'recording' : ''}
          type="button"
          onClick={recording ? stopRecording : startRecording}
          aria-label={recording ? '停止录音' : '开始录音'}
        >
          {recording ? <Square /> : <Mic />}
        </button>
      </form>
    </div>
  )
}
