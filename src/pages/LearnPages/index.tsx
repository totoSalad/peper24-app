import {
  ArrowLeft,
  BookMarked,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, ScreenHeader } from '../../components'
import {
  useAnswerReview,
  useDueReviews,
  useRemoveVocabulary,
  useVocabularies,
} from '../../vocabularyApi'
import type { ReviewResult, Vocabulary } from '../../types'
import './index.less'

export function LearnPage() {
  const { data: reviews = [] } = useDueReviews()
  const due = reviews.length
  return (
    <Page>
      <ScreenHeader title="学习" />
      <section className="review-card">
        <div>
          <h2>今日复习</h2>
          <span>{due} 个待复习</span>
        </div>
        <p>每次最多 10 个，按记忆状态自动安排</p>
        <div className="progress">
          <i
            style={{
              width: `${due ? 0 : 100}%`,
            }}
          />
        </div>
        <Link className="button soft" to="/review">
          开始复习
        </Link>
      </section>
      <div className="menu-list">
        <Link to="/review">
          <ClipboardList />
          <div>
            <strong>今日小结</strong>
            <span>查看今天的学习总结和语法反馈</span>
          </div>
          <ChevronRight />
        </Link>
        <Link to="/vocabulary">
          <BookMarked />
          <div>
            <strong>词汇本</strong>
            <span>管理已收藏的单词和短语</span>
          </div>
          <ChevronRight />
        </Link>
        <button>
          <CalendarDays />
          <div>
            <strong>历史小结</strong>
            <span>回顾过去的每日学习记录</span>
          </div>
          <ChevronRight />
        </button>
      </div>
    </Page>
  )
}

export function VocabularyPage() {
  const { data: vocabulary = [], isLoading, error } = useVocabularies()
  const remove = useRemoveVocabulary()
  return (
    <Page>
      <header className="sub-header">
        <Link to="/learn">
          <ArrowLeft />
        </Link>
        <h1>词汇本</h1>
        <span>{vocabulary.length} 条</span>
      </header>
      {isLoading && <p className="data-state">正在加载词汇…</p>}
      {error && <p className="data-state error">词汇加载失败，请稍后重试。</p>}
      <div className="vocabulary-list">
        {vocabulary.map((item) => (
          <article key={item.id}>
            <div>
              {/* 一行：单词 + 音标横向排列 */}
              <div className="vocab-head">
                <h2>{item.expression}</h2>
                {item.phonetic && <span>{item.phonetic}</span>}
              </div>
              <p>
                <b>中文含义</b>
                {item.meaning}
              </p>
              <small>
                <b>英文例句</b>
                {item.example}
              </small>
            </div>
            <button
              onClick={() => remove.mutate(item.id)}
              disabled={remove.isPending}
              aria-label={`删除 ${item.expression}`}
            >
              <Trash2 />
            </button>
          </article>
        ))}
      </div>
      {!isLoading && !error && vocabulary.length === 0 && (
        <div className="empty">
          <BookMarked />
          <h2>词汇本还是空的</h2>
          <p>在聊天中选中表达，就能收藏到这里。</p>
        </div>
      )}
    </Page>
  )
}

const reviewRatings = [
  { value: 'again', label: '再来', hint: '没想起来' },
  { value: 'hard', label: '有点难', hint: '看到答案后认识' },
  { value: 'good', label: '还行', hint: '不看答案想起来' },
  { value: 'easy', label: '轻松', hint: '很快想起含义和用法' },
] as const

export function ReviewPage() {
  const { data: reviews = [], isLoading, error } = useDueReviews()
  const answer = useAnswerReview()
  const [queue, setQueue] = useState<Vocabulary[]>([])
  const [completed, setCompleted] = useState(0)
  const totalRef = useRef(0)
  const initialized = useRef(false)
  const [revealed, setRevealed] = useState(false)
  const requestIdRef = useRef(crypto.randomUUID())
  useEffect(() => {
    if (!initialized.current && reviews.length) {
      initialized.current = true
      totalRef.current = reviews.length
      setQueue(reviews)
    }
  }, [reviews])
  const current = queue[0]
  const rate = (result: ReviewResult) => {
    if (!current) return
    answer.mutate(
      { vocabularyId: current.id, result, clientRequestId: requestIdRef.current },
      {
        onSuccess: () => {
          setQueue((items) => (result === 'again' ? [...items.slice(1), current] : items.slice(1)))
          if (result !== 'again') setCompleted((value) => value + 1)
          setRevealed(false)
          requestIdRef.current = crypto.randomUUID()
        },
      },
    )
  }
  if (isLoading)
    return (
      <Page className="review-page">
        <p className="data-state">正在准备今日复习…</p>
      </Page>
    )
  if (!initialized.current && reviews.length)
    return (
      <Page className="review-page">
        <p className="data-state">正在准备今日复习…</p>
      </Page>
    )
  if (error)
    return (
      <Page className="review-page">
        <p className="data-state error">复习计划加载失败，请稍后重试。</p>
      </Page>
    )
  if (!current)
    return (
      <Page className="review-page">
        <div className="completion">
          <Sparkles />
          <h1>今天完成啦！</h1>
          <p>已经没有待复习的词汇，去聊几句积累新的表达吧。</p>
          <Link className="button primary" to="/topics">
            回到聊天
          </Link>
        </div>
      </Page>
    )
  return (
    <Page className="review-page">
      <header className="sub-header">
        <Link to="/learn">
          <ArrowLeft />
        </Link>
        <h1>今日复习</h1>
        <span>
          {Math.min(completed + 1, totalRef.current)}/{totalRef.current}
        </span>
      </header>
      <div className="review-progress">
        <i style={{ width: `${totalRef.current ? (completed / totalRef.current) * 100 : 0}%` }} />
      </div>
      <div className="review-content">
        <section className="review-question">
          <span>这个表达是什么意思？</span>
          <h2>{current.expression}</h2>
          <button onClick={() => setRevealed(true)} aria-expanded={revealed}>
            {revealed ? '已显示含义和例句' : '点击查看含义和例句'}
          </button>
        </section>
        {revealed && (
          <>
            <section className="review-answer">
              <span>中文含义</span>
              <strong>{current.meaning}</strong>
              <span>英文例句</span>
              <p>{current.example}</p>
            </section>
            <section className="review-rating">
              <h2>你记得怎么样？</h2>
              <div className="rating-grid">
                {reviewRatings.map((rating) => (
                  <button
                    key={rating.value}
                    className={rating.value}
                    disabled={answer.isPending}
                    onClick={() => rate(rating.value)}
                  >
                    <strong>{rating.label}</strong>
                    <span>{rating.hint}</span>
                  </button>
                ))}
              </div>
              {answer.isError && <p className="review-error">提交失败，请重试当前选择。</p>}
            </section>
          </>
        )}
      </div>
    </Page>
  )
}
