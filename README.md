# Peper24 App

Peper24 英语口语陪练的 Web 前端。账号、会话、Vocabulary / Review、Speech、翻译和 Memory 均已提供真实服务端 API 接入，同时保留独立演示模式。

设置 `VITE_USE_SERVER_API=true` 后启用 Cookie Session 账号、OSS 录音直传、Paraformer 转写和消息 TTS。默认视觉演示模式继续使用本地账号、mock 转写和浏览器 `speechSynthesis`。语音输入最长 60 秒、最大 10 MB，转写只填入输入框；朗读不会改变正文样式。

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

默认使用内存开发适配器，方便单独检查界面。连接 `peper24-server` 时复制 `.env.example` 为 `.env.local`，设置 `VITE_USE_SERVER_API=true`；Vite 会将 `/api` 代理到本地服务端，生产同源部署时同样保持 `VITE_API_BASE_URL` 为空。

生产构建与静态检查：

```bash
pnpm build
pnpm lint
```

## 演示流程

1. 首页选择注册。
2. 输入合法邮箱和不少于 8 位的密码，直接创建账号，不经过邮箱验证码。
3. 完成昵称和 A1-C2 英语水平设置。
4. 选择话题进入聊天，也可从“学习”和“我的”进入词汇、复习、记忆及设置页面。

开发适配器下 AI 回复采用本地流式模拟；启用服务端模式后，账号通过 HttpOnly Cookie Session 恢复，会话回复改用 Egg.js SSE，语法纠正和词汇工具结果由服务端提供。服务端登录状态不写入 `localStorage`；本地演示模式仍保存界面状态。

## 当前边界

- 固定一个 AI 陪练角色。
- 同一语法错误第二次出现时提醒一次，之后保持静默。
- 复习题采用“看英文选中文”，评分由答题结果自动计算。
- 当前仅实现一个产品版本，不包含免费版或 Max 版分层。
- Memory 自动提取 Worker、生产限流、监控和云端部署仍在后续阶段。
