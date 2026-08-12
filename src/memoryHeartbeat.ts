export const MEMORY_HEARTBEAT_INTERVAL_MS = 20 * 60 * 1000

export function startMemoryHeartbeat(
  trigger: () => Promise<unknown>,
  intervalMs = MEMORY_HEARTBEAT_INTERVAL_MS,
) {
  let requestInFlight = false
  const tick = () => {
    if (requestInFlight) return
    requestInFlight = true
    void trigger()
      .catch(() => {
        // 心跳失败留给下一轮重试；401 会由统一请求处理器清理登录态。
      })
      .finally(() => {
        requestInFlight = false
      })
  }
  const intervalId = window.setInterval(tick, intervalMs)
  return () => window.clearInterval(intervalId)
}
