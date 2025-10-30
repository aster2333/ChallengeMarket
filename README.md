# ActionFi — Like Pumpfun for Real World UGC prediction market for action. Act, bet, vote and win.
### Problem
In Web3, belief and execution are disconnected:
•	Prediction markets price opinions but not real actions.
•	Task platforms reward completion but lack transparency and market dynamics.
There’s no native way to monetize credibility, accountability, or proof of action on-chain.
________________________________________
### Solution
ActionFi creates a market for human execution.
Anyone can launch a public challenge, back outcomes with YES/NO staking, and let the market price belief in real-world actions.
Every challenge is a verifiable on-chain statement — success is rewarded, failure redistributes trust.
________________________________________
### Mechanism
1.	Launch Challenge — Creator deposits ≥0.05 SOL, sets time limit (1 h – 5 d, optional random stop).
2.	Stake Belief — Users stake on YES / NO pools via constant-product AMM.
3.	Host Bidding — Others may outbid the host (+0.1 SOL) to “take the stage.”
4.	Resolution — Chain verifies proof (video / on-chain evidence).
o	YES wins → supporters share NO pool.
o	NO wins → skeptics share YES pool.
5.	Rewards
o	Creator earns 1 % of total pool if challenge succeeds.
o	5 % of pot → JP reward pool for top challengers.
o	Host (if NO wins) gets 2 % of JP.
6.	Second-Round Challenge — Winner may reopen next round with 10 % of prior profit → perpetual loop.
________________________________________
### Economic Model
Layer	Function	Incentive
YES/NO Pools	Belief pricing	Early conviction = higher upside
JP Pool	Action reward	Execution proof bonus
Host Bidding	Ownership game	Adds liquidity + social tension
1 % Creator Fee	Quality incentive	Drives real, verifiable actions
Rolling Rounds	Perpetual liquidity	Continuous market cycle
Platform 1 %	Sustainability	Maintenance & auditing
________________________________________
### Why It Matters
•	Turns action into a financial primitive.
•	Enables proof-of-credibility for individuals and DAOs.
•	Blends DeFi, social identity, and prediction markets into one composable layer.
________________________________________
### Tagline
ActionFi — Launch Challenges. Prove Yourself. Let the Market Decide.


## 🚀 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS + shadcn/ui
- **区块链**: Solana (Devnet)
- **钱包集成**: Phantom, Solflare, OKX, Backpack 等
- **国际化**: react-i18next (中文/英文)
- **状态管理**: Zustand
- **路由**: React Router DOM
- **UI 组件**: Radix UI + Lucide React

## ✨ 功能特性

### 核心功能
- 🎯 **挑战管理**: 创建、浏览、参与挑战
- 💰 **投注系统**: 支持/反对投注，实时赔率计算
- 👛 **多钱包支持**: 集成主流 Solana 钱包
- 🌍 **国际化**: 中英文双语支持
- 🌙 **主题切换**: 明暗主题自由切换
- 📱 **响应式设计**: 完美适配移动端

### 钱包功能
- 多钱包连接 (Phantom, Solflare, OKX, Backpack 等)
- 本地钱包创建和导入
- 私钥导入功能
- 安全提示和验证
- 钱包余额查看

### 用户体验
- 用户中心页面
- 通知系统
- 图片查看功能
- 分享和收藏功能
- 错误边界和异常处理

## 🛠️ 开发环境

### 前置要求
- Node.js 18+
- npm 或 yarn
- Git

### 安装和启动

```bash
# 克隆项目
git clone <repository-url>
cd ChallengeMarket

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问应用
# http://localhost:5173
```

### 可用脚本

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

## 🚀 部署

### Vercel 部署

1. **自动部署**
   - 连接 GitHub 仓库到 Vercel
   - 自动检测 Vite 项目配置
   - 推送代码即可自动部署

2. **手动部署**
   ```bash
   # 安装 Vercel CLI
   npm i -g vercel
   
   # 登录并部署
   vercel login
   vercel --prod
   ```

### 环境变量

```bash
# .env
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── ui/             # UI 基础组件 (shadcn/ui)
│   ├── ChallengeCard.tsx
│   ├── Navbar.tsx
│   └── ...
├── pages/              # 页面组件
│   ├── Home.tsx
│   ├── ChallengeDetail.tsx
│   ├── CreateChallenge.tsx
│   ├── Profile.tsx
│   └── ...
├── hooks/              # 自定义 Hooks
├── providers/          # Context Providers
├── store/              # Zustand 状态管理
├── lib/                # 工具库和配置
├── locales/            # 国际化文件
│   ├── en/
│   └── zh/
└── assets/             # 静态资源
```

## 🔧 开发指南

### 添加新组件

使用 shadcn/ui 添加组件：
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
```

### 国际化

1. 在 `src/locales/zh/` 和 `src/locales/en/` 中添加翻译
2. 在组件中使用：
   ```tsx
   import { useTranslation } from 'react-i18next';
   
   const { t } = useTranslation();
   return <div>{t('key')}</div>;
   ```

### 状态管理

使用 Zustand 进行状态管理：
```tsx
import { useStore } from '../store/useStore';

const { challenges, addChallenge } = useStore();
```

## 🐛 故障排除

### 常见问题

1. **钱包连接失败**
   - 确保钱包扩展已安装
   - 检查网络设置 (Devnet)
   - 查看浏览器控制台错误

2. **构建失败**
   - 检查 Node.js 版本 (需要 18+)
   - 清除缓存：`rm -rf node_modules package-lock.json && npm install`
   - 检查 TypeScript 类型错误

3. **样式问题**
   - 确保 Tailwind CSS 配置正确
   - 检查暗黑模式类名
   - 验证 shadcn/ui 组件导入

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Solana](https://solana.com/) - 高性能区块链平台
- [shadcn/ui](https://ui.shadcn.com/) - 优秀的 UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Vite](https://vitejs.dev/) - 快速的构建工具

---

**注意**: 这是一个演示项目，所有数据都存储在本地状态中。在生产环境中使用前，请进行充分的测试和安全审计。
