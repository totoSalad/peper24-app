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
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import newTopicCharacter from '../../assets/new-topic-character.png'
import { createEnglishUtterance } from '../../browserSpeech'
import { createClientId } from '../../clientId'
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
import type { Message } from '../../types'
import { useAddVocabulary } from '../../vocabularyApi'
import { getVoiceRecordingUrl, uploadAndTranscribeVoice } from '../../voiceApi'
import './index.less'

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
    preview:
      messages[conversation.id]?.at(-1)?.content ??
      conversation.lastMessage?.content ??
      '开始一段新的对话',
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
  speechState: 'idle' | 'playing'
  onSelect: () => void
  translating: boolean
}) {
  return (
    <article className={`message ${message.role}`} onMouseUp={onSelect}>
      {message.voiceRecording?.status === 'available' ? (
        <button className="voice-message-text" onClick={onSpeak} aria-label="播放原音">
          {speechState === 'playing' ? <Square /> : <Play />}
          <span>{message.content}</span>
        </button>
      ) : (
        <p>{message.content}</p>
      )}
      {message.voiceRecording?.status === 'expired' && (
        <small className="voice-expired">原音已过期</small>
      )}
      <time>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </time>
      <div className="message-tools">
        <button
          onClick={onSpeak}
          disabled={
            message.voiceRecording?.status === 'sending' ||
            message.voiceRecording?.status === 'expired'
          }
          aria-label={speechState === 'playing' ? '停止朗读' : '朗读'}
        >
          {speechState === 'playing' ? <Square /> : <Volume2 />}
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
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [voiceStage, setVoiceStage] = useState<'closed' | 'starting' | 'recording' | 'sending'>(
    'closed',
  )
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [speechError, setSpeechError] = useState('')
  const [playingMessageId, setPlayingMessageId] = useState<string>()
  const [translatingMessageId, setTranslatingMessageId] = useState<string>()
  const [selected, setSelected] = useState<{
    expression: string
    messageId: string
    x: number
    y: number
    above: boolean
  } | null>(null)
  const [loadingConversation, setLoadingConversation] = useState(true)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const microphoneRef = useRef<MediaStream | null>(null)
  const recordingStartedAtRef = useRef(0)
  const recordingFinishingRef = useRef(false)
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordingSessionRef = useRef(0)
  const finishRecordingRef = useRef<() => Promise<void>>(async () => {})
  const playbackTokenRef = useRef(0)
  const messageListRef = useRef<HTMLDivElement>(null)
  // 是否跟随消息滚动到底。用户手动上滑阅读历史时暂停跟随,回到底部后恢复。
  const stickToBottom = useRef(true)

  const stopPlayback = () => {
    playbackTokenRef.current += 1
    utteranceRef.current = null
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    audioRef.current?.pause()
    audioRef.current = null
    setPlayingMessageId(undefined)
  }

  useEffect(
    () => () => {
      recordingSessionRef.current += 1
      stopPlayback()
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      microphoneRef.current?.getTracks().forEach((track) => track.stop())
    },
    [],
  )

  useEffect(() => {
    if (voiceStage !== 'recording') return
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - recordingStartedAtRef.current) / 1000)
      setRecordingSeconds(Math.min(seconds, 60))
      if (seconds >= 60) void finishRecordingRef.current()
    }, 250)
    return () => window.clearInterval(timer)
  }, [voiceStage])

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

  // 新消息到来时自动滚动到消息列表底部(停留在底部时才跟随,
  // 避免用户上滑阅读历史时被拽回去)。
  useEffect(() => {
    const el = messageListRef.current
    if (!el) return
    const onScroll = () => {
      stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!stickToBottom.current) return
    const el = messageListRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const sendMessage = async (
    request: { content: string } | { voiceRecordingId: string },
    content: string,
    voiceRecordingId?: string,
  ) => {
    if (sending) return
    setSending(true)
    stickToBottom.current = true
    const clientRequestId = createClientId()
    const userMessage: Message = {
      id: createClientId(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      ...(voiceRecordingId
        ? {
            voiceRecording: {
              id: voiceRecordingId,
              status: 'sending' as const,
              expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
            },
          }
        : {}),
    }
    addMessage(conversationId, userMessage)
    const assistantId = createClientId()
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
        ...request,
        clientRequestId,
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
        } else if (streamEvent.type === 'error') {
          throw new Error(streamEvent.message ?? streamEvent.code)
        }
      }
    } catch (error) {
      console.error('[chat-stream] send failed', error)
      if (voiceRecordingId) setSpeechError('语音消息发送失败，请稍后重试。')
      updateMessage(conversationId, activeAssistantId, {
        content:
          error instanceof Error && error.message
            ? `消息发送失败：${error.message}`
            : '消息发送失败，请检查网络后重试。',
      })
    } finally {
      if (voiceRecordingId) {
        try {
          const history = await listConversationMessages(conversationId)
          useAppStore.getState().setMessages(conversationId, history)
        } catch {
          /* 留下当前消息，后续重新进入会话时同步。 */
        }
      }
      setSending(false)
    }
  }

  const send = (event: FormEvent) => {
    event.preventDefault()
    const content = input.trim()
    if (!content || sending || voiceStage !== 'closed') return
    setInput('')
    void sendMessage({ content }, content)
  }

  const startRecording = async () => {
    if (voiceStage !== 'closed' || sending) return
    const session = ++recordingSessionRef.current
    recordingFinishingRef.current = false
    setSpeechError('')
    setVoiceStage('starting')
    try {
      if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('当前浏览器不支持录音，请使用支持录音的浏览器。')
      }
      const contentType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) =>
        MediaRecorder.isTypeSupported(type),
      )
      if (!contentType) {
        throw new Error('当前浏览器不支持录音，请使用支持录音的浏览器。')
      }
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (session !== recordingSessionRef.current) {
        microphone.getTracks().forEach((track) => track.stop())
        return
      }
      microphoneRef.current = microphone
      const recorder = new MediaRecorder(microphone, { mimeType: contentType })
      recorderRef.current = recorder
      recorder.start()
      recordingStartedAtRef.current = Date.now()
      setRecordingSeconds(0)
      setVoiceStage('recording')
    } catch (error) {
      if (session !== recordingSessionRef.current) return
      microphoneRef.current?.getTracks().forEach((track) => track.stop())
      microphoneRef.current = null
      setVoiceStage('closed')
      setSpeechError(error instanceof Error ? error.message : '无法启动录音，请检查麦克风权限。')
    }
  }

  const stopRecorder = () =>
    new Promise<Blob>((resolve, reject) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state !== 'recording') return reject(new Error('录音未启动。'))
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data)
      }
      recorder.onerror = () => reject(new Error('录音失败，请重试。'))
      recorder.onstop = () => {
        microphoneRef.current?.getTracks().forEach((track) => track.stop())
        microphoneRef.current = null
        recorderRef.current = null
        resolve(new Blob(chunks, { type: recorder.mimeType }))
      }
      recorder.stop()
    })

  const finishRecording = async () => {
    if (voiceStage !== 'recording' || recordingFinishingRef.current) return
    recordingFinishingRef.current = true
    setVoiceStage('sending')
    const durationMs = Math.min(60_000, Date.now() - recordingStartedAtRef.current)
    try {
      const blob = await stopRecorder()
      if (!blob.size || durationMs < 300) throw new Error('录音太短，请重试。')
      if (blob.size > 10 * 1024 * 1024) throw new Error('录音超过 10 MB，请重试。')
      const result = await uploadAndTranscribeVoice(blob, durationMs)
      setVoiceStage('closed')
      await sendMessage(
        { voiceRecordingId: result.recordingId },
        result.transcript,
        result.recordingId,
      )
    } catch (error) {
      microphoneRef.current?.getTracks().forEach((track) => track.stop())
      microphoneRef.current = null
      setVoiceStage('closed')
      setSpeechError(error instanceof Error ? error.message : '语音发送失败，请重试。')
    }
  }
  finishRecordingRef.current = finishRecording

  const cancelRecording = () => {
    recordingSessionRef.current += 1
    if (voiceStage === 'recording' && recorderRef.current) {
      recorderRef.current.ondataavailable = null
      recorderRef.current.onstop = null
      recorderRef.current.stop()
    }
    microphoneRef.current?.getTracks().forEach((track) => track.stop())
    microphoneRef.current = null
    recorderRef.current = null
    setVoiceStage('closed')
  }

  const speak = async (message: Message) => {
    if (playingMessageId === message.id) {
      stopPlayback()
      return
    }
    stopPlayback()
    setSpeechError('')
    try {
      if (message.voiceRecording) {
        if (message.voiceRecording.status === 'expired') return
        const token = playbackTokenRef.current
        const { url } = await getVoiceRecordingUrl(message.id)
        if (token !== playbackTokenRef.current) return
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => {
          if (token === playbackTokenRef.current) stopPlayback()
        }
        audio.onerror = () => {
          if (token === playbackTokenRef.current) {
            stopPlayback()
            setSpeechError('原音播放失败，请稍后重试。')
          }
        }
        setPlayingMessageId(message.id)
        await audio.play()
        return
      }
      const token = playbackTokenRef.current
      const utterance = createEnglishUtterance(message.content)
      const finish = () => {
        if (token !== playbackTokenRef.current) return
        utteranceRef.current = null
        setPlayingMessageId(undefined)
      }
      utterance.onend = finish
      utterance.onerror = (event) => {
        if (!['canceled', 'interrupted'].includes(event.error)) {
          setSpeechError('浏览器朗读失败，请检查系统语音设置。')
        }
        finish()
      }
      utteranceRef.current = utterance
      setPlayingMessageId(message.id)
      window.speechSynthesis.speak(utterance)
    } catch {
      setSpeechError(
        message.voiceRecording ? '原音播放失败，请稍后重试。' : '当前浏览器不支持文字朗读。',
      )
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
      <div ref={messageListRef} className="message-list">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSpeak={() => speak(message)}
            speechState={playingMessageId === message.id ? 'playing' : 'idle'}
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
      <footer className="chat-footer">
        <div className="quick-tools">
          <button
            onClick={() => {
              const text = input.trim()
              setInput(
                /^How do you say/i.test(text)
                  ? text
                  : text
                    ? `How do you say "${text}" in english`
                    : 'How do you say "xxx" in english',
              )
            }}
          >
            <Sparkles />
            这句话怎么说
          </button>
        </div>
        {speechError && (
          <div className="speech-status error" role="status">
            {speechError}
          </div>
        )}
        <form className="composer" onSubmit={send}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onFocus={() => {
              if (!stickToBottom.current) return
              window.requestAnimationFrame(() => {
                const el = messageListRef.current
                if (el) el.scrollTop = el.scrollHeight
              })
            }}
            placeholder="输入消息…"
          />
          <button
            className="voice-trigger"
            type="button"
            disabled={sending || voiceStage !== 'closed'}
            aria-label="长按语音输入"
            onPointerDown={() => {
              pressTimerRef.current = setTimeout(() => void startRecording(), 350)
            }}
            onPointerUp={() => {
              if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
            }}
            onPointerLeave={() => {
              if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
            }}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') void startRecording()
            }}
          >
            <Mic />
          </button>
          <button type="submit" disabled={sending || voiceStage !== 'closed'} aria-label="发送">
            <Send />
          </button>
        </form>
      </footer>
      {voiceStage !== 'closed' && (
        <div className="voice-overlay" role="dialog" aria-modal="true" aria-label="语音输入">
          <header>
            <button
              onClick={cancelRecording}
              disabled={voiceStage === 'sending'}
              aria-label="取消录音"
            >
              <X />
            </button>
            <strong>语音输入</strong>
            <span />
          </header>
          <div className="voice-panel">
            <span className={`voice-orb ${voiceStage === 'recording' ? 'active' : ''}`}>
              <Mic />
            </span>
            <strong>
              {voiceStage === 'starting'
                ? '正在打开麦克风…'
                : voiceStage === 'sending'
                  ? '正在识别并发送…'
                  : '正在录音'}
            </strong>
            <time>
              {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
              {String(recordingSeconds % 60).padStart(2, '0')} / 01:00
            </time>
            <p>说完后点击下方按钮，自动发送语音消息</p>
          </div>
          <div className="voice-actions">
            <button onClick={cancelRecording} disabled={voiceStage === 'sending'}>
              取消
            </button>
            <button onClick={() => void finishRecording()} disabled={voiceStage !== 'recording'}>
              结束并发送
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
