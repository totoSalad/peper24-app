# GitHub Actions 自动部署

当前生产环境使用 Nginx 直接提供 Vite 静态文件：

- 当前版本：`/opt/peper24/current/app`
- 历史版本：`/opt/peper24/releases/app`
- Nginx 配置：`/etc/nginx/nginx.conf`

推送 `main` 后，GitHub Actions 会执行 unit tests 和 production build，只上传 `dist` 压缩包。服务器切换软链接并 reload Nginx；健康检查失败时自动恢复上一个版本。

## GitHub Actions Secrets

在仓库的 `Settings > Secrets and variables > Actions` 添加与 server 仓库相同的四项：

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_KNOWN_HOSTS`

## 手动检查

```bash
systemctl status nginx
curl -fsS http://127.0.0.1/healthz
curl -fsS http://127.0.0.1/api/health
readlink -f /opt/peper24/current/app
```
