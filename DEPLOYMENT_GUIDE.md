# 挑战市场前端项目部署指南

## 项目概述

这是一个基于 Solana 区块链的前端挑战市场应用，用户可以创建挑战、参与投注并获得奖励。

### 技术栈
- **前端**: React + TypeScript + Vite + Tailwind CSS
- **区块链**: Solana (Devnet)
- **UI组件**: shadcn/ui + Radix UI
- **国际化**: react-i18next
- **钱包集成**: Phantom, Solflare, OKX, Backpack 等

## 本地开发环境

### 前置要求
- Node.js 18+ 
- Git

### 启动步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd ChallengeMarket
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
- 前端: http://localhost:5173

## 部署到 Vercel

### 自动部署

1. **连接 GitHub 仓库**
   - 登录 Vercel 控制台
   - 导入 GitHub 仓库
   - 选择项目根目录

2. **配置构建设置**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **环境变量配置**
```
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

4. **部署配置文件**
项目已包含 `vercel.json` 配置文件，支持 SPA 路由。

### 手动部署

使用 Vercel CLI 进行部署：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel --prod
```

## 环境变量配置

### 前端环境变量 (.env)
```
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 功能特性

### 已实现功能
- ✅ 挑战列表展示
- ✅ 挑战详情页面
- ✅ 创建挑战
- ✅ 投注功能
- ✅ 钱包连接 (Phantom, Solflare, OKX, Backpack 等)
- ✅ 国际化支持 (中文/英文)
- ✅ 响应式设计
- ✅ 暗黑模式支持
- ✅ 错误处理
- ✅ 图片查看功能
- ✅ 分享和收藏功能
- ✅ 用户中心页面
- ✅ 通知系统

### 钱包功能
- 多钱包支持 (Phantom, Solflare, OKX, Backpack 等)
- 本地钱包创建和导入
- 私钥导入功能
- 安全提示和验证

## 构建和优化

### 构建命令
```bash
# 开发环境
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 类型检查
npm run check

# 代码检查
npm run lint
```

### 性能优化
- 代码分割和懒加载
- 图片优化
- 组件级别的错误边界
- 响应式设计适配移动端

## 故障排除

### 常见问题

1. **钱包连接失败**
   - 确保钱包扩展已安装
   - 检查网络连接
   - 确认 Solana 网络设置正确

2. **构建失败**
   - 检查 Node.js 版本 (需要 18+)
   - 清除 node_modules 并重新安装
   - 检查环境变量配置

3. **样式问题**
   - 确保 Tailwind CSS 配置正确
   - 检查暗黑模式切换功能

### 调试技巧
- 使用浏览器开发者工具
- 检查控制台错误信息
- 验证钱包连接状态
- 确认 Solana 网络连接

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── ui/             # UI 基础组件
│   └── ...
├── pages/              # 页面组件
├── hooks/              # 自定义 Hooks
├── providers/          # Context Providers
├── store/              # 状态管理
├── lib/                # 工具库
├── locales/            # 国际化文件
└── assets/             # 静态资源
```

## 支持和贡献

如有问题或建议，请提交 Issue 或 Pull Request。

---

**注意**: 这是一个纯前端项目，所有数据都存储在本地状态中，用于演示和开发目的。