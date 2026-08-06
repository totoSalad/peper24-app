import {
  ArrowLeft,
  FileText,
  Languages,
  LoaderCircle,
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
import { useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import newTopicCharacter from '../../assets/new-topic-character.png'
import { Page } from '../../components'
import {
  createServerConversation,
  streamConversationMessage,
  translateConversationMessage,
  useServerConversation,
} from '../../conversationApi'
import { detectMockGrammarCorrections, mockTranscription, streamMockReply } from '../../mockApi'
import { useAppStore } from '../../store'
import {
  chooseRecordingMime,
  getTranscription,
  requestMessageSpeech,
  startTranscription,
  uploadVoiceRecording,
} from '../../speechApi'
import type { Message } from '../../types'
import { useAddVocabulary, vocabularyKeys } from '../../vocabularyApi'
import './index.less'

const makeId = () => crypto.randomUUID()

export function TopicsPage() {
  const navigate = useNavigate()
  const createConversation = useAppStore((state) => state.createConversation)
  const hydrateConversation = useAppStore((state) => state.hydrateConversation)
  const conversations = useAppStore((state) => state.conversations)
  const messages = useAppStore((state) => state.messages)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<'custom' | 'random'>('random')
  const [topic, setTopic] = useState('')
  const [randomIndex, setRandomIndex] = useState(0)
  const start = async (value: string, scene = value) => {
    if (useServerConversation) {
      const created = await createServerConversation(value, scene)
      hydrateConversation(
        { ...created.conversation, scene: created.conversation.scene || scene },
        created.welcomeMessage,
      )
      navigate(`/chat/${created.conversation.id}`)
      return
    }
    navigate(`/chat/${createConversation(value, scene)}`)
  }
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
    void start(value.trim())
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
              onClick={() => (item.id ? navigate(`/chat/${item.id}`) : void start(item.topic))}
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
  speechState,
  onSelect,
  translating,
}: {
  message: Message
  onTranslate: () => void
  onSpeak: () => void
  speechState: 'idle' | 'loading' | 'playing'
  onSelect: () => void
  translating: boolean
}) {
  return (
    <article className={`message ${message.role}`} onMouseUp={onSelect}>
      <p>{message.content}</p>
      <time>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </time>
      <div className="message-tools">
        <button
          className={speechState === 'loading' ? 'loading' : ''}
          onClick={onSpeak}
          aria-label={speechState === 'playing' ? '停止朗读' : '朗读'}
          disabled={speechState === 'loading'}
        >
          {speechState === 'playing' ? (
            <Square />
          ) : speechState === 'loading' ? (
            <LoaderCircle />
          ) : (
            <Volume2 />
          )}
        </button>
        <button onClick={onTranslate} aria-label="翻译" disabled={translating}>
          {translating ? <LoaderCircle className="loading-icon" /> : <Languages />}
        </button>
      </div>
      {message.translation && <p className="translation">{message.translation}</p>}
      {message.corrections && message.corrections.length > 0 && (
        <div className="correction-list">
          {message.corrections.map((correction, index) => (
            <aside
              className="correction"
              key={`${correction.errorType}-${correction.original}-${index}`}
            >
              <Sparkles />
              <div>
                <strong>一个小提示</strong>
                <p>
                  <del>{correction.original}</del> → {correction.corrected}
                </p>
                <small>{correction.note}</small>
              </div>
            </aside>
          ))}
        </div>
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
  const addVocabulary = useAddVocabulary()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [recordingState, setRecordingState] = useState<
    'idle' | 'recording' | 'uploading' | 'transcribing'
  >('idle')
  const [speechError, setSpeechError] = useState('')
  const [pendingVoiceRecordingId, setPendingVoiceRecordingId] = useState<string>()
  const [playingMessageId, setPlayingMessageId] = useState<string>()
  const [loadingMessageId, setLoadingMessageId] = useState<string>()
  const [translatingMessageId, setTranslatingMessageId] = useState<string>()
  const [selected, setSelected] = useState<{ expression: string; messageId: string } | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef(0)
  const recordingTimerRef = useRef<number | undefined>(undefined)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playbackTokenRef = useRef(0)

  const stopPlayback = () => {
    playbackTokenRef.current += 1
    audioRef.current?.pause()
    audioRef.current = null
    speechSynthesis.cancel()
    setPlayingMessageId(undefined)
    setLoadingMessageId(undefined)
  }

  useEffect(() => stopPlayback, [])

  const send = async (event?: FormEvent) => {
    event?.preventDefault()
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)
    const clientRequestId = makeId()
    const voiceRecordingId = pendingVoiceRecordingId
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
    let activeAssistantId: string = assistantId
    try {
      if (useServerConversation) {
        let reply = ''
        let corrections: NonNullable<Message['corrections']> = []
        for await (const streamEvent of streamConversationMessage(conversationId, {
          content,
          clientRequestId,
          ...(voiceRecordingId ? { voiceRecordingId } : {}),
        })) {
          if (streamEvent.type === 'message.start') {
            updateMessage(conversationId, activeAssistantId, { id: streamEvent.messageId })
            activeAssistantId = streamEvent.messageId
          } else if (streamEvent.type === 'message.delta') {
            reply += streamEvent.delta
            updateMessage(conversationId, activeAssistantId, { content: reply.trimStart() })
          } else if (streamEvent.type === 'correction.ready') {
            corrections = [...corrections, streamEvent.correction]
            updateMessage(conversationId, activeAssistantId, { corrections })
          } else if (streamEvent.type === 'tool.result') {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: vocabularyKeys.all }),
              queryClient.invalidateQueries({ queryKey: vocabularyKeys.due }),
            ])
          } else if (streamEvent.type === 'error') {
            throw new Error(streamEvent.code)
          }
        }
        if (voiceRecordingId) setPendingVoiceRecordingId(undefined)
      } else {
        let reply = ''
        for await (const chunk of streamMockReply(content)) {
          reply += chunk
          updateMessage(conversationId, assistantId, { content: reply.trimStart() })
        }
        const corrections = detectMockGrammarCorrections(content)
        if (corrections.length) updateMessage(conversationId, assistantId, { corrections })
        if (content.includes('怎么说') || content.includes('怎么表达')) {
          await addVocabulary.mutateAsync({
            expression: 'almost late',
            sourceMessageId: assistantId,
          })
        }
      }
    } catch {
      updateMessage(conversationId, activeAssistantId, {
        content: '消息发送失败，请检查网络后重试。',
      })
    } finally {
      setSending(false)
    }
  }

  const startRecording = async () => {
    try {
      setSpeechError('')
      setPendingVoiceRecordingId(undefined)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = chooseRecordingMime()
      const recorder = new MediaRecorder(stream, { mimeType })
      recordingChunksRef.current = []
      recordingStartedAtRef.current = Date.now()
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        window.clearTimeout(recordingTimerRef.current)
        stream.getTracks().forEach((track) => track.stop())
        const durationMs = Math.min(60_000, Date.now() - recordingStartedAtRef.current)
        try {
          if (!useServerConversation) {
            setInput(await mockTranscription())
            setRecordingState('idle')
            return
          }
          const blob = new Blob(recordingChunksRef.current, { type: mimeType })
          setRecordingState('uploading')
          const upload = await uploadVoiceRecording(blob, mimeType)
          setRecordingState('transcribing')
          let result = await startTranscription(upload.recordingId, durationMs)
          const deadline = Date.now() + 60_000
          while (result.status === 'processing' && Date.now() < deadline) {
            const retryAfterMs = result.retryAfterMs || 1000
            await new Promise((resolve) => window.setTimeout(resolve, retryAfterMs))
            result = await getTranscription(upload.recordingId)
          }
          if (result.status !== 'completed') throw new Error('TRANSCRIPTION_FAILED')
          setInput(result.transcript)
          setPendingVoiceRecordingId(upload.recordingId)
        } catch {
          setSpeechError('语音识别失败，请重新录音或直接输入。')
        } finally {
          setRecordingState('idle')
          recorderRef.current = null
        }
      }
      recorder.start(250)
      recorderRef.current = recorder
      setRecordingState('recording')
      recordingTimerRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, 60_000)
    } catch {
      setSpeechError('麦克风不可用，请检查浏览器权限。')
      setRecordingState('idle')
    }
  }
  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }
  const playParts = async (messageId: string, urls: string[]) => {
    const token = ++playbackTokenRef.current
    setLoadingMessageId(undefined)
    setPlayingMessageId(messageId)
    try {
      for (const url of urls) {
        if (token !== playbackTokenRef.current) return
        const audio = new Audio(url)
        audioRef.current = audio
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve()
          audio.onerror = () => reject(new Error('AUDIO_PLAYBACK_FAILED'))
          void audio.play().catch(reject)
        })
      }
    } catch {
      setSpeechError('朗读失败，请稍后重试。')
    } finally {
      if (token === playbackTokenRef.current) {
        audioRef.current = null
        setPlayingMessageId(undefined)
      }
    }
  }
  const speak = async (message: Message) => {
    if (playingMessageId === message.id) {
      stopPlayback()
      return
    }
    stopPlayback()
    setSpeechError('')
    if (!useServerConversation) {
      setPlayingMessageId(message.id)
      const utterance = new SpeechSynthesisUtterance(message.content)
      utterance.lang = 'en-GB'
      utterance.onend = () => setPlayingMessageId(undefined)
      utterance.onerror = () => {
        setPlayingMessageId(undefined)
        setSpeechError('朗读失败，请稍后重试。')
      }
      speechSynthesis.speak(utterance)
      return
    }
    setLoadingMessageId(message.id)
    try {
      let result = await requestMessageSpeech(message.id)
      const deadline = Date.now() + 60_000
      while (result.status === 'processing' && Date.now() < deadline) {
        const retryAfterMs = result.retryAfterMs || 1000
        await new Promise((resolve) => window.setTimeout(resolve, retryAfterMs))
        result = await requestMessageSpeech(message.id)
      }
      if (result.status !== 'ready') throw new Error('SPEECH_TIMEOUT')
      await playParts(
        message.id,
        result.audio.parts.map((part) => part.url),
      )
    } catch {
      setLoadingMessageId(undefined)
      setSpeechError('朗读失败，请稍后重试。')
    }
  }
  const selectText = (messageId: string) => {
    const value = window.getSelection()?.toString().trim() ?? ''
    if (value) setSelected({ expression: value, messageId })
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
            speechState={
              playingMessageId === message.id
                ? 'playing'
                : loadingMessageId === message.id
                  ? 'loading'
                  : 'idle'
            }
            translating={translatingMessageId === message.id}
            onTranslate={async () => {
              if (message.translation) {
                updateMessage(conversationId, message.id, { translation: undefined })
                return
              }
              if (!useServerConversation) {
                updateMessage(conversationId, message.id, {
                  translation:
                    message.role === 'assistant'
                      ? '这是这条英文消息的中文翻译。'
                      : 'This is the English translation of your message.',
                })
                return
              }
              setTranslatingMessageId(message.id)
              try {
                const result = await translateConversationMessage(message.id)
                updateMessage(conversationId, message.id, { translation: result.translation })
              } catch {
                setSpeechError('翻译失败，请稍后重试。')
              } finally {
                setTranslatingMessageId(undefined)
              }
            }}
            onSelect={() => message.role === 'assistant' && selectText(message.id)}
          />
        ))}
        {sending && <span className="typing">AI 正在输入…</span>}
      </div>
      {selected && (
        <button
          className="selection-pill"
          disabled={addVocabulary.isPending}
          onClick={() => {
            addVocabulary.mutate(
              { expression: selected.expression, sourceMessageId: selected.messageId },
              {
                onSuccess: () => {
                  setSelected(null)
                  window.getSelection()?.removeAllRanges()
                },
              },
            )
          }}
        >
          {addVocabulary.isPending
            ? '正在补充释义…'
            : addVocabulary.isError
              ? `收藏失败，点击重试“${selected.expression}”`
              : `收藏“${selected.expression}”`}
        </button>
      )}
      <div className="quick-tools">
        <button onClick={() => setInput('“我今天差点迟到了”怎么说？')}>
          <Sparkles />
          这句话怎么说
        </button>
      </div>
      {(recordingState !== 'idle' || speechError) && (
        <div className={`speech-status ${speechError ? 'error' : ''}`} role="status">
          {speechError ||
            (recordingState === 'recording'
              ? '录音中，再次点击结束（最长 60 秒）'
              : recordingState === 'uploading'
                ? '上传中…'
                : '识别中…')}
        </div>
      )}
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
          className={recordingState === 'recording' ? 'recording' : ''}
          type="button"
          disabled={recordingState === 'uploading' || recordingState === 'transcribing'}
          onClick={recordingState === 'recording' ? stopRecording : startRecording}
          aria-label={recordingState === 'recording' ? '停止录音' : '开始录音'}
        >
          {recordingState === 'recording' ? <Square /> : <Mic />}
        </button>
      </form>
    </div>
  )
}
