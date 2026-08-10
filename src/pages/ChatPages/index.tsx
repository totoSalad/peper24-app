import {
  ArrowLeft,
  BookmarkPlus,
  FileText,
  Languages,
  LoaderCircle,
  MessageCircle,
  Mic,
  Play,
  Plus,
  Search,
  Send,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Square,
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
  listConversationMessages,
  listServerConversations,
  streamConversationMessage,
  translateConversationMessage,
  useScenes,
} from '../../conversationApi'
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

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

// 选择器里的稳定空引用:避免 `?? []` 每次渲染都生成新数组,
// 让 useSyncExternalStore 认为快照在变,从而无限重渲染。
const EMPTY_MESSAGES: Message[] = []

export function TopicsPage() {
  const navigate = useNavigate()
  const hydrateConversation = useAppStore((state) => state.hydrateConversation)
  const setConversations = useAppStore((state) => state.setConversations)
  const conversations = useAppStore((state) => state.conversations)

  useEffect(() => {
    let active = true
    void listServerConversations()
      .then((list) => {
        if (active) setConversations(list)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [setConversations])
  const messages = useAppStore((state) => state.messages)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [randomIndex, setRandomIndex] = useState(0)
  const scenes = useScenes()
  const sceneList = scenes.data ?? []
  const currentScene = sceneList[randomIndex % Math.max(sceneList.length, 1)]
  const shuffle = () => {
    if (sceneList.length <= 1) return
    let next = randomIndex
    while (next === randomIndex) next = Math.floor(Math.random() * sceneList.length)
    setRandomIndex(next)
  }
  const start = async (value: string, scene?: string) => {
    const created = await createServerConversation(value)
    hydrateConversation(
      { ...created.conversation, scene: created.conversation.scene || scene || '' },
      created.welcomeMessage,
    )
    navigate(`/chat/${created.conversation.id}`)
  }
  const openDialog = () => {
    setDialogOpen(true)
  }
  const begin = (value: string) => {
    if (!value.trim()) return
    setDialogOpen(false)
    void start(value.trim())
  }
  const list = conversations.map((conversation) => ({
    ...conversation,
    preview: messages[conversation.id]?.at(-1)?.content ?? '开始一段新的对话',
    time: new Date(conversation.updatedAt).toLocaleDateString('zh-CN'),
  }))
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
          <small>AI 随机推荐一个场景</small>
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
          <div className="random-topic-panel">
            <p>AI 为你推荐了这个场景，不喜欢可以换</p>
            {scenes.isLoading ? (
              <p className="scene-empty">加载中…</p>
            ) : !currentScene ? (
              <p className="scene-empty">暂时没有可用的场景</p>
            ) : (
              <article className="random-topic-card">
                <span className="random-sparkle">
                  <Sparkles />
                </span>
                <h3>
                  {currentScene.icon} {titleCase(currentScene.topic)}
                </h3>
                <p>{currentScene.scene}</p>
                <div>
                  <button onClick={shuffle}>
                    <Shuffle />
                    换一个
                  </button>
                  <button onClick={() => begin(currentScene.topic)}>
                    <Play />
                    就用这个
                  </button>
                </div>
              </article>
            )}
          </div>
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
  const messages = useAppStore((state) => state.messages[conversationId] ?? EMPTY_MESSAGES)
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
  const [selected, setSelected] = useState<{
    expression: string
    messageId: string
    x: number
    y: number
    above: boolean
  } | null>(null)
  const [loadingConversation, setLoadingConversation] = useState(true)
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

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const store = useAppStore.getState()
        if (!store.conversations.some((item) => item.id === conversationId)) {
          const list = await listServerConversations()
          const found = list.find((item) => item.id === conversationId)
          if (!found) {
            if (active) setLoadingConversation(false)
            return
          }
          if (active) useAppStore.getState().upsertConversation(found)
        }
        const history = await listConversationMessages(conversationId)
        if (active) {
          useAppStore.getState().setMessages(conversationId, history)
          setLoadingConversation(false)
        }
      } catch {
        if (active) setLoadingConversation(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [conversationId])

  // 选中 tooltip 在滚动或按下 ESC 时自动关闭
  useEffect(() => {
    if (!selected) return
    const close = () => setSelected(null)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selected])

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
          throw new Error(streamEvent.message ?? streamEvent.code)
        }
      }
      if (voiceRecordingId) setPendingVoiceRecordingId(undefined)
    } catch (error) {
      console.error('[chat-stream] send failed', error)
      updateMessage(conversationId, activeAssistantId, {
        content:
          error instanceof Error && error.message
            ? `消息发送失败：${error.message}`
            : '消息发送失败，请检查网络后重试。',
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
    const selection = window.getSelection()
    const value = selection?.toString().trim() ?? ''
    if (!value || !selection || selection.rangeCount === 0) {
      setSelected(null)
      return
    }
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    const above = rect.top > 64
    setSelected({
      expression: value,
      messageId,
      x: rect.left + rect.width / 2,
      y: above ? rect.top : rect.bottom,
      above,
    })
  }

  if (!conversation) {
    if (loadingConversation)
      return (
        <Page>
          <p>加载中…</p>
        </Page>
      )
    return (
      <Page>
        <p>没有找到这个会话。</p>
        <Link to="/topics">返回话题</Link>
      </Page>
    )
  }
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
        <div
          className={`selection-tooltip${selected.above ? '' : ' below'}`}
          style={{ left: selected.x, top: selected.y }}
          role="tooltip"
          onMouseDown={(event) => event.preventDefault()}
        >
          <button
            aria-label={addVocabulary.isError ? '收藏失败，点击重试' : '收藏到词本'}
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
            {addVocabulary.isPending ? (
              <LoaderCircle />
            ) : (
              <BookmarkPlus className={addVocabulary.isError ? 'error' : ''} />
            )}
          </button>
          {addVocabulary.isError && <small>重试</small>}
        </div>
      )}
      <div className="quick-tools">
        <button
          onClick={() => {
            const text = input.trim()
            setInput(
              /^How do you say/i.test(text) ? text : text ? `How do you say "${text}" in english` : 'How do you say "xxx" in english',
            )
          }}
        >
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
