# Challenge Market 部署指南

本文档提供了 Challenge Market 项目的详细部署说明，支持多个主流部署平台。

## 项目概述

Challenge Market 是一个基于 Solana 区块链的挑战市场应用，使用 React + TypeScript + Vite 构建。

## 部署前准备

### 1. 环境要求
- Node.js 18+ 
- npm 或 yarn
- Git

### 2. 项目构建测试
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 本地预览构建结果
npm run preview
```

### 3. 环境变量配置
复制 `.env.example` 文件为 `.env` 并配置相应的环境变量：

```bash
cp .env.example .env
```

主要环境变量说明：
- `VITE_SOLANA_NETWORK`: Solana 网络 (mainnet-beta/testnet/devnet)
- `VITE_SOLANA_RPC_URL`: 自定义 RPC 端点 (可选)
- `VITE_APP_NAME`: 应用名称
- `VITE_APP_VERSION`: 应用版本

## 部署选项

### 选项 1: Vercel 部署 (推荐)

Vercel 对 React 项目支持最好，部署简单快速。

#### 方法 A: 通过 Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel

# 生产环境部署
vercel --prod
```

#### 方法 B: 通过 GitHub 集成
1. 将代码推送到 GitHub 仓库
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "New Project"
4. 导入 GitHub 仓库
5. Vercel 会自动检测项目配置并部署

#### Vercel 配置文件
项目已包含 `vercel.json` 配置文件，包含以下设置：
- 自动 SPA 路由重定向
- 静态资源缓存优化
- 构建配置

### 选项 2: Netlify 部署

Netlify 提供慷慨的免费额度，适合个人项目。

#### 方法 A: 通过 Netlify CLI
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 构建并部署
npm run build
netlify deploy --dir=dist

# 生产环境部署
netlify deploy --prod --dir=dist
```

#### 方法 B: 通过拖拽部署
1. 运行 `npm run build` 构建项目
2. 访问 [netlify.com](https://netlify.com)
3. 将 `dist` 文件夹拖拽到部署区域

#### 方法 C: 通过 Git 集成
1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 在 Netlify 中连接仓库
3. 设置构建命令: `npm run build`
4. 设置发布目录: `dist`

#### Netlify 配置文件
项目已包含以下配置文件：
- `_redirects`: SPA 路由重定向规则
- `netlify.toml`: 构建和缓存配置

### 选项 3: GitHub Pages 部署

适合开源项目，完全免费但功能有限。

#### 配置步骤
1. 在 `vite.config.ts` 中设置正确的 base 路径：
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... 其他配置
})
```

2. 创建 GitHub Actions 工作流 (`.github/workflows/deploy.yml`)：
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

3. 在仓库设置中启用 GitHub Pages

## 部署后验证

### 1. 功能测试
- [ ] 页面正常加载
- [ ] 路由导航正常
- [ ] Solana 钱包连接功能
- [ ] 挑战列表显示
- [ ] 搜索功能
- [ ] 响应式设计

### 2. 性能检查
- [ ] 页面加载速度
- [ ] 静态资源缓存
- [ ] 移动端适配

### 3. SEO 优化
- [ ] 页面标题和描述
- [ ] Open Graph 标签
- [ ] 网站图标

## 常见问题

### Q: 部署后页面刷新出现 404 错误
A: 这是 SPA 应用的常见问题，需要配置服务器将所有路由重定向到 `index.html`。项目已包含相应的配置文件。

### Q: 静态资源加载失败
A: 检查 `vite.config.ts` 中的 `base` 配置是否正确。

### Q: Solana 钱包连接失败
A: 确保在生产环境中使用正确的 Solana 网络配置，检查 RPC 端点是否可用。

### Q: 构建时出现内存不足错误
A: 可以增加 Node.js 内存限制：
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## 监控和维护

### 1. 错误监控
建议集成错误监控服务如 Sentry：
```bash
npm install @sentry/react @sentry/tracing
```

### 2. 性能监控
使用 Web Vitals 监控页面性能：
```bash
npm install web-vitals
```

### 3. 更新部署
- 定期更新依赖包
- 监控 Solana 网络状态
- 备份重要配置

## 安全注意事项

1. **环境变量**: 不要在代码中硬编码敏感信息
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **CSP**: 配置内容安全策略
4. **依赖安全**: 定期检查依赖包安全漏洞

```bash
npm audit
npm audit fix
```

## 支持

如果在部署过程中遇到问题，请检查：
1. 项目构建是否成功
2. 环境变量配置是否正确
3. 部署平台的文档和限制
4. 网络连接和权限设置

---

**注意**: 本项目使用 Solana 区块链技术，部署到生产环境前请确保充分测试所有区块链相关功能。