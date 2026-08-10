import { expect, test, type BrowserContext } from '@playwright/test'

/**
 * 端到端回归：场景从服务端获取 + 随机卡片选择场景创建会话。
 *
 * 前置条件：peper24-server 已在 7001 运行（本测试只拉起 Vite 前端，
 * `/api` 由 Vite 代理到服务端）。通过注册接口拿到 Cookie Session，
 * 再以浏览器会话访问页面，避免依赖注册/资料表单的具体 UI。
 */
const BACKEND = process.env.E2E_BACKEND ?? 'http://localhost:7001'

test.beforeAll(async ({ request }) => {
  const health = await request.get(`${BACKEND}/api/health`).catch(() => null)
  expect(health?.ok(), 'peper24-server 未运行（默认 7001），请先启动服务端再跑 e2e').toBeTruthy()
})

async function registerUser(context: BrowserContext): Promise<void> {
  const email = `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`
  // 走 Vite 代理（localhost:5174），Set-Cookie 自动落入浏览器会话
  const response = await context.request.post('/api/v1/auth/register', {
    data: {
      email,
      password: 'password123',
      profile: { displayName: 'E2E Tester', englishLevel: 'B1' },
    },
  })
  expect(response.ok(), `注册接口应成功，实际 ${response.status()}`).toBeTruthy()
}

/** 卡片标题形如「✈️ Airport」，去掉 emoji 前缀取小写 topic。 */
function topicFromTitle(title: string): string {
  return title
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .trim()
    .toLowerCase()
}

test('场景从服务端拉取，随机卡片展示而非列表', async ({ context, page }) => {
  await registerUser(context)

  // useScenes 在话题页挂载时就发起请求，需在 goto 前捕获
  const scenesRequest = page.waitForRequest((req) => req.url().includes('/api/v1/scenes'))
  await page.goto('/topics')
  const scenesResponse = await (await scenesRequest).response()
  expect(scenesResponse?.status()).toBe(200)

  // 服务端返回 30 个场景
  const payload = await scenesResponse?.json()
  const scenes = payload?.data?.scenes ?? []
  expect(scenes).toHaveLength(30)

  // 新账号的真实会话列表应为空
  await expect(page.locator('.conversation-card')).toHaveCount(0)

  // 弹窗是设计稿的单卡片 UI（不是场景列表）
  await page.click('.new-topic-card')
  const card = page.locator('.random-topic-card')
  await expect(card).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.scene-card')).toHaveCount(0)

  const firstTitle = (await card.locator('h3').textContent())?.trim() ?? ''
  expect(firstTitle.length).toBeGreaterThan(0)

  // 「换一个」应切换场景
  await page.click('.random-topic-card button:has-text("换一个")')
  await expect(card.locator('h3')).not.toHaveText(firstTitle)
})

test('选择场景后创建服务端会话并进入聊天', async ({ context, page }) => {
  await registerUser(context)
  await page.goto('/topics')
  await page.click('.new-topic-card')
  const card = page.locator('.random-topic-card')
  await expect(card).toBeVisible({ timeout: 15_000 })

  const title = (await card.locator('h3').textContent())?.trim() ?? ''
  const topic = topicFromTitle(title)
  expect(topic.length).toBeGreaterThan(0)

  await page.click('.random-topic-card button:has-text("就用这个")')
  await page.waitForURL('**/chat/**')

  await expect(page.locator('.chat-header strong')).toHaveText(topic)

  // 服务端应返回非空的 AI 欢迎语
  const welcome = page.locator('.message.assistant p').first()
  await expect(welcome).toBeVisible({ timeout: 20_000 })
  await expect(welcome).not.toBeEmpty()
})

test('学习与记忆页面从真实 API 加载数据', async ({ context, page }) => {
  await registerUser(context)

  const reviewsResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/reviews/today'),
  )
  await page.goto('/learn')
  expect((await reviewsResponse).status()).toBe(200)

  const vocabulariesResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/vocabularies'),
  )
  await page.goto('/vocabulary')
  expect((await vocabulariesResponse).status()).toBe(200)

  const memoriesResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/memories'),
  )
  await page.goto('/memories')
  expect((await memoriesResponse).status()).toBe(200)
})

test('登出后另一账号登录,列表不再显示上一个账号的会话(防跨用户泄漏)', async ({ context, page }) => {
  // 账号 A:注册 + 通过 UI 创建一条服务端会话
  const emailA = `leak_a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`
  const registerA = await context.request.post('/api/v1/auth/register', {
    data: {
      email: emailA,
      password: 'password123',
      profile: { displayName: 'Leak A', englishLevel: 'B1' },
    },
  })
  expect(registerA.ok()).toBeTruthy()

  await page.goto('/topics')
  await page.click('.new-topic-card')
  const card = page.locator('.random-topic-card')
  await expect(card).toBeVisible({ timeout: 15_000 })
  await page.click('.random-topic-card button:has-text("就用这个")')
  await page.waitForURL('**/chat/**')
  // 等 AI 欢迎语落库，回列表应能从服务端看到这一条
  await expect(page.locator('.message.assistant p').first()).toBeVisible({ timeout: 20_000 })
  await page.goto('/topics')
  await expect(page.locator('.conversation-card')).toHaveCount(1)

  // 登出 A（清掉会话 cookie 和内存中的 A 账号数据）
  const logout = await context.request.post('/api/v1/auth/logout', { data: {} })
  expect(logout.ok()).toBeTruthy()

  // 同一浏览器上下文注册账号 B —— 这是跨用户泄漏的复现场景
  const emailB = `leak_b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`
  const registerB = await context.request.post('/api/v1/auth/register', {
    data: {
      email: emailB,
      password: 'password123',
      profile: { displayName: 'Leak B', englishLevel: 'B1' },
    },
  })
  expect(registerB.ok()).toBeTruthy()

  // B 的会话列表不应出现 A 的会话
  await page.goto('/topics')
  await expect(page.locator('.conversation-card')).toHaveCount(0)
})
