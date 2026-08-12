import {
  ArrowLeft,
  BookMarked,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  MessageCircle,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createClientId } from '../../clientId'
import { Page, ScreenHeader } from '../../components'
import {
  useAnswerReview,
  useDueReviews,
  useRemoveVocabulary,
  useVocabularies,
} from '../../vocabularyApi'
import type { ReviewResult, Vocabulary } from '../../types'
import type { DailyLearningSummary } from '../../types'
import {
  useLearningSummary,
  useLearningSummaryHistory,
  useTodayLearningSummary,
} from '../../learningSummaryApi'
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
        <Link to="/summaries/today">
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
        <Link to="/summaries">
          <CalendarDays />
          <div>
            <strong>历史小结</strong>
            <span>回顾过去的每日学习记录</span>
          </div>
          <ChevronRight />
        </Link>
      </div>
    </Page>
  )
}

const grammarLabels: Record<string, string> = {
  subject_verb_agreement: '主谓一致',
  tense: '时态',
  article: '冠词',
  singular_plural: '单复数',
  countable_uncountable: '可数与不可数',
  preposition_collocation: '介词搭配',
  adjective_adverb: '形容词与副词',
  comparative: '比较级',
  pronoun: '代词',
  infinitive_gerund: '不定式与动名词',
  modal_verb_form: '情态动词',
  double_negative: '双重否定',
  sentence_fragment: '句子片段',
  chinese_word_order: '中式语序',
  there_be_have: 'There be / have',
  duplicate_conjunction: '重复连词',
}

function formatSummaryDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(`${date}T00:00:00+08:00`))
}

function SummaryView({ summary }: { summary: DailyLearningSummary }) {
  const content = summary.content
  return (
    <div className="summary-content">
      <section className="summary-hero">
        <span>{formatSummaryDate(summary.date)}</span>
        <h2>{content?.headline ?? '今日学习小结'}</h2>
        <p>{summary.finalized ? '已完成' : '今天的数据会随学习进度更新'}</p>
      </section>
      <section className="summary-metrics" aria-label="学习数据">
        <div>
          <MessageCircle />
          <strong>{summary.metrics.conversationCount}</strong>
          <span>次对话</span>
        </div>
        <div>
          <ClipboardList />
          <strong>{summary.metrics.userMessageCount}</strong>
          <span>条消息</span>
        </div>
        <div>
          <BookMarked />
          <strong>{summary.metrics.newVocabularyCount}</strong>
          <span>个新表达</span>
        </div>
      </section>
      {content && (
        <section className="summary-section">
          <h3>今日亮点</h3>
          <ul>
            {content.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="summary-section">
        <h3>语法反馈</h3>
        {summary.metrics.grammar.length ? (
          <div className="grammar-summary-list">
            {summary.metrics.grammar.map((item) => (
              <article key={item.errorType}>
                <div>
                  <strong>{grammarLabels[item.errorType] ?? item.errorType}</strong>
                  <span>{item.count} 次</span>
                </div>
                {item.examples[0] && (
                  <p>
                    <del>{item.examples[0].original}</del>
                    <ins>{item.examples[0].corrected}</ins>
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="summary-muted">今天没有发现需要主动提醒的语法问题。</p>
        )}
      </section>
      {content && (
        <>
          <section className="summary-section">
            <h3>继续改进</h3>
            <ul>
              {content.improvements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className="summary-section next-steps">
            <h3>
              <Target /> 明日建议
            </h3>
            <ul>
              {content.nextSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

export function LearningSummaryPage({ today = false }: { today?: boolean }) {
  const { date = '' } = useParams()
  const todayQuery = useTodayLearningSummary(today)
  const dateQuery = useLearningSummary(today ? '' : date)
  const query = today ? todayQuery : dateQuery
  return (
    <Page className="summary-page">
      <header className="sub-header">
        <Link to={today ? '/learn' : '/summaries'}>
          <ArrowLeft />
        </Link>
        <h1>{today ? '今日小结' : '学习小结'}</h1>
        <span />
      </header>
      {query.isLoading && <p className="data-state">正在整理学习记录…</p>}
      {query.error && <p className="data-state error">小结加载失败，请稍后重试。</p>}
      {!query.isLoading && !query.error && !query.data && (
        <div className="empty summary-empty">
          <ClipboardList />
          <h2>今天还没有学习记录</h2>
          <p>完成一次英语对话后，这里会生成你的学习小结。</p>
          <Link className="button primary" to="/topics">
            开始聊天
          </Link>
        </div>
      )}
      {query.data && <SummaryView summary={query.data} />}
    </Page>
  )
}

export function LearningSummaryHistoryPage() {
  const { data: summaries = [], isLoading, error } = useLearningSummaryHistory()
  return (
    <Page className="summary-page">
      <header className="sub-header">
        <Link to="/learn">
          <ArrowLeft />
        </Link>
        <h1>历史小结</h1>
        <span>{summaries.length || ''}</span>
      </header>
      {isLoading && <p className="data-state">正在加载历史小结…</p>}
      {error && <p className="data-state error">历史小结加载失败，请稍后重试。</p>}
      {!isLoading && !error && summaries.length === 0 && (
        <div className="empty summary-empty">
          <CalendarDays />
          <h2>还没有历史小结</h2>
          <p>每天完成练习后，小结会保存在这里。</p>
        </div>
      )}
      <div className="summary-history-list">
        {summaries.map((summary) => (
          <Link key={summary.id} to={`/summaries/${summary.date}`}>
            <CalendarDays />
            <div>
              <strong>{formatSummaryDate(summary.date)}</strong>
              <span>
                {summary.content?.headline ?? `${summary.metrics.userMessageCount} 条练习消息`}
              </span>
            </div>
            <ChevronRight />
          </Link>
        ))}
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
  const requestIdRef = useRef(createClientId())
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
          requestIdRef.current = createClientId()
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
