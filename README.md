# Peper24 App

Peper24 英语口语陪练的 Web 前端。账号、场景、会话、Vocabulary / Review、Speech、翻译和 Memory 全部使用 `peper24-server` 的真实 API。

前端使用 Cookie Session 账号、OSS 录音直传、Paraformer 转写和消息 TTS。语音输入最长 60 秒、最大 10 MB，转写只填入输入框；朗读不会改变正文样式。

## 技术栈

- React 19 + TypeScript + Vite
- React Router
- Zustand（当前账号快照与本地界面状态）
- TanStack Query（词汇、复习和记忆服务端状态）
- Lucide React

## 本地运行

```bash
pnpm install
pnpm dev
```

先启动本地 `peper24-server`，再启动前端。Vite 会将 `/api` 代理到 `http://127.0.0.1:7001`；生产同源部署时保持 `VITE_API_BASE_URL` 为空，跨域部署时将它设置为服务端地址。

生产构建与静态检查：

```bash
pnpm build
pnpm lint
```

## 端到端回归测试

`e2e/` 下用 Playwright 验证「场景从服务端获取」等关键流程。前置条件：

1. `peper24-server` 已在 7001 端口运行（测试只负责拉起 Vite 前端，`/api` 由 Vite 代理到服务端）。
2. 本机已安装 Google Chrome（测试复用系统 Chrome，无需下载 Playwright 浏览器）。

运行：

```bash
pnpm test:e2e
```

测试使用独立端口 `5174`（已在服务端 `ALLOWED_ORIGINS` 中，也避免与其他项目抢占 5173）。默认通过注册接口建立 Cookie Session 再访问页面；如需指定后端地址可用 `E2E_BACKEND=http://localhost:7001 pnpm test:e2e`。

## 使用流程

1. 首页选择注册。
2. 输入合法邮箱和不少于 8 位的密码，直接创建账号，不经过邮箱验证码。
3. 完成昵称和 A1-C2 英语水平设置。
4. 选择话题进入聊天，也可从“学习”和“我的”进入词汇、复习、记忆及设置页面。

账号通过 HttpOnly Cookie Session 恢复，会话回复使用 Egg.js SSE，语法纠正和词汇工具结果由服务端提供。登录状态、账号、对话和学习数据不写入 `localStorage`；浏览器只暂存注册后的资料完善状态。

## 当前边界

- 固定一个 AI 陪练角色。
- 同一语法错误第二次出现时提醒一次，之后保持静默。
- 复习题采用“看英文选中文”，评分由答题结果自动计算。
- 当前仅实现一个产品版本，不包含免费版或 Max 版分层。
- Memory 自动提取 Worker、生产限流、监控和云端部署仍在后续阶段。
