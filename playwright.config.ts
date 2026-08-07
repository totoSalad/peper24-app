import { defineConfig } from '@playwright/test'

/**
 * 端到端回归测试：验证「从服务端拉取场景」等功能。
 *
 * 前置条件：`peper24-server` 已在 7001 端口运行（本测试只负责拉起 Vite，
 * 服务端由外部启动；场景接口需要 Cookie Session 鉴权）。
 *
 * 使用独立端口 5174：
 *  - 5173 常被其他本地项目占用；
 *  - 5174 已在 peper24-server 的 ALLOWED_ORIGINS 中。
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5174',
    viewport: { width: 420, height: 900 },
    channel: 'chrome', // 复用系统 Chrome，无需下载 Playwright 浏览器
  },
  webServer: {
    command: 'pnpm dev --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
