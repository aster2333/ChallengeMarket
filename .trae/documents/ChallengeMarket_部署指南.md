# ChallengeMarket 前端项目部署指南

## 1. 项目概述

ChallengeMarket 是一个基于 Solana 区块链的挑战市场平台前端应用，用户可以创建、参与和管理各种挑战活动。

### 技术栈
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **样式框架**: Tailwind CSS 3
- **UI 组件**: Radix UI + shadcn/ui
- **区块链集成**: Solana Web3.js + 多钱包适配器
- **国际化**: i18next + react-i18next
- **状态管理**: Zustand
- **路由**: React Router DOM 7
- **动画**: Framer Motion

### 核心功能
- 🔗 Solana 钱包集成（支持多种钱包）
- 🌍 国际化支持（中文/英文）
- 🌙 暗黑模式切换
- 📱 响应式设计
- 🎯 挑战创建与管理
- 💰 资金管理（充值/提现）
- 👤 用户中心
- 📊 数据统计

## 2. 部署前准备

### 2.1 环境要求
- Node.js 18+ 
- npm 或 yarn 包管理器
- Git（用于代码管理）

### 2.2 依赖安装
```bash
# 安装项目依赖
npm install

# 或使用 yarn
yarn install
```

### 2.3 构建测试
```bash
# 类型检查
npm run check

# 代码检查
npm run lint

# 本地开发服务器测试
npm run dev

# 生产构建测试
npm run build

# 预览构建结果
npm run preview
```

### 2.4 环境变量配置
创建 `.env.local` 文件（基于 `.env.example`）：
```env
# Solana 网络配置
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# 应用配置
VITE_APP_NAME=ChallengeMarket
VITE_APP_VERSION=1.0.0

# 钱包连接配置
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## 3. 部署方案

### 3.1 Vercel 部署（推荐）

#### 方案一：Vercel 网站部署
1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 导入你的 GitHub 仓库
5. 配置项目设置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. 添加环境变量
7. 点击 "Deploy"

#### 方案二：Vercel CLI 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel

# 生产部署
vercel --prod
```

#### Vercel 配置文件
项目已包含 `vercel.json` 配置：
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3.2 Netlify 部署

#### 网站部署
1. 访问 [netlify.com](https://netlify.com)
2. 连接 GitHub 仓库
3. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. 添加环境变量
5. 部署

#### CLI 部署
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy

# 生产部署
netlify deploy --prod
```

#### Netlify 配置文件
创建 `netlify.toml`：
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### 3.3 GitHub Pages 部署

#### 使用 GitHub Actions
创建 `.github/workflows/deploy.yml`：
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
      env:
        VITE_SOLANA_NETWORK: ${{ secrets.VITE_SOLANA_NETWORK }}
        VITE_SOLANA_RPC_URL: ${{ secrets.VITE_SOLANA_RPC_URL }}
    
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### 3.4 Firebase Hosting 部署

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 登录 Firebase
firebase login

# 初始化项目
firebase init hosting

# 构建项目
npm run build

# 部署
firebase deploy
```

#### Firebase 配置文件
`firebase.json`：
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 4. 环境变量配置指南

### 4.1 必需环境变量
| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `VITE_SOLANA_NETWORK` | Solana 网络 | `devnet` / `mainnet-beta` |
| `VITE_SOLANA_RPC_URL` | RPC 节点地址 | `https://api.devnet.solana.com` |

### 4.2 可选环境变量
| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `VITE_APP_NAME` | 应用名称 | `ChallengeMarket` |
| `VITE_APP_VERSION` | 应用版本 | `1.0.0` |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect 项目ID | - |

### 4.3 平台配置方法

#### Vercel
在项目设置 → Environment Variables 中添加

#### Netlify
在 Site settings → Environment variables 中添加

#### GitHub Pages
在仓库 Settings → Secrets and variables → Actions 中添加

## 5. 部署后验证

### 5.1 功能检查清单
- [ ] 页面正常加载
- [ ] 路由跳转正常
- [ ] 钱包连接功能
- [ ] 国际化切换
- [ ] 暗黑模式切换
- [ ] 响应式布局
- [ ] 挑战创建功能
- [ ] 用户中心功能

### 5.2 性能检查
```bash
# 使用 Lighthouse 检查
npx lighthouse https://your-domain.com --view

# 检查构建大小
npm run build
ls -la dist/
```

### 5.3 监控设置
- 设置 Vercel Analytics（如使用 Vercel）
- 配置错误监控（如 Sentry）
- 设置性能监控

## 6. 常见问题排查

### 6.1 构建失败
```bash
# 清理缓存
rm -rf node_modules package-lock.json
npm install

# 检查 TypeScript 错误
npm run check

# 检查 ESLint 错误
npm run lint
```

### 6.2 钱包连接问题
- 检查 Solana 网络配置
- 验证 RPC 节点可用性
- 确认钱包适配器版本兼容性

### 6.3 路由问题
- 确保部署平台配置了 SPA 重写规则
- 检查 `vercel.json` 或 `netlify.toml` 配置

### 6.4 环境变量问题
- 确保所有 `VITE_` 前缀的变量正确设置
- 重新部署以应用新的环境变量

## 7. 性能优化建议

### 7.1 构建优化
- 启用代码分割
- 优化图片资源
- 使用 CDN 加速

### 7.2 缓存策略
```javascript
// vite.config.ts 中配置
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          solana: ['@solana/web3.js', '@solana/wallet-adapter-react']
        }
      }
    }
  }
})
```

### 7.3 SEO 优化
- 配置 meta 标签
- 添加 sitemap.xml
- 设置 robots.txt

## 8. 安全注意事项

### 8.1 环境变量安全
- 不要在客户端暴露敏感信息
- 使用 `VITE_` 前缀的变量会被打包到客户端

### 8.2 钱包安全
- 提醒用户保护私钥
- 实现安全的签名验证
- 添加交易确认提示

### 8.3 网络安全
- 使用 HTTPS
- 配置 CSP 头部
- 启用 HSTS

## 9. 维护和更新

### 9.1 依赖更新
```bash
# 检查过时依赖
npm outdated

# 更新依赖
npm update

# 安全更新
npm audit fix
```

### 9.2 监控和日志
- 设置错误监控
- 配置性能监控
- 定期检查部署状态

### 9.3 备份策略
- 定期备份代码仓库
- 保存部署配置
- 记录环境变量设置

---

## 快速部署命令

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd ChallengeMarket

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件

# 4. 构建项目
npm run build

# 5. 部署到 Vercel
npx vercel --prod
```

🎉 **部署完成！** 你的 ChallengeMarket 应用现在已经可以在线访问了。