import {
  ArrowLeft,
  BookMarked,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, ScreenHeader } from '../../components'
import { useAppStore } from '../../store'
import './index.less'

export function LearnPage() {
  const vocabulary = useAppStore((state) => state.vocabulary)
  const due = vocabulary.filter((item) => !item.reviewed).length
  return (
    <Page>
      <ScreenHeader title="学习" />
      <section className="review-card">
        <div>
          <h2>今日复习</h2>
          <span>{due} 个待复习</span>
        </div>
        <p>
          今日已完成 {vocabulary.length - due}/{vocabulary.length}
        </p>
        <div className="progress">
          <i
            style={{
              width: `${vocabulary.length ? ((vocabulary.length - due) / vocabulary.length) * 100 : 0}%`,
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
  const vocabulary = useAppStore((state) => state.vocabulary)
  const remove = useAppStore((state) => state.removeVocabulary)
  return (
    <Page>
      <header className="sub-header">
        <Link to="/learn">
          <ArrowLeft />
        </Link>
        <h1>词汇本</h1>
        <span>{vocabulary.length} 条</span>
      </header>
      <div className="vocabulary-list">
        {vocabulary.map((item) => (
          <article key={item.id}>
            <div>
              <h2>{item.expression}</h2>
              <span>{item.phonetic}</span>
              <p>{item.meaning}</p>
              <small>{item.example}</small>
            </div>
            <button onClick={() => remove(item.id)} aria-label={`删除 ${item.expression}`}>
              <Trash2 />
            </button>
          </article>
        ))}
      </div>
      {vocabulary.length === 0 && (
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
  const vocabulary = useAppStore((state) => state.vocabulary)
  const completeReview = useAppStore((state) => state.completeReview)
  const [queue, setQueue] = useState(() => vocabulary.filter((item) => !item.reviewed).slice(0, 10))
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const current = queue[index]
  const rate = (rating: (typeof reviewRatings)[number]['value']) => {
    if (!current) return
    if (rating === 'again') setQueue((items) => [...items, current])
    else completeReview(current.id)
    setIndex((value) => value + 1)
    setRevealed(false)
  }
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
          {index + 1}/{queue.length}
        </span>
      </header>
      <div className="review-progress">
        <i style={{ width: `${((index + 1) / queue.length) * 100}%` }} />
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
                    onClick={() => rate(rating.value)}
                  >
                    <strong>{rating.label}</strong>
                    <span>{rating.hint}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </Page>
  )
}
