[English](README.md)

# Claude Cowork

**桌面 AI 助手**，帮助你完成**编程、文件管理以及任何你能描述的任务**。

灵感来自 [Anthropic 的 Cowork](https://www.anthropic.com/news/cowork) — 通过友好的 GUI 并行运行多个 AI 任务。

完全兼容 **Claude Code 配置**，可使用任意兼容 Anthropic 的大模型。

> 不只是一个 GUI。
> 是真正的 AI 协作伙伴。
> 无需学习 Claude Agent SDK，用自然语言描述任务即可。

https://github.com/user-attachments/assets/8ce58c8b-4024-4c01-82ee-f8d8ed6d4bba

---

## 为什么选择 Claude Cowork？

Claude Code 很强大 — 但它**只能在终端中运行**。

这意味着：
- 复杂任务没有可视化反馈
- 难以追踪多个会话
- 查看工具输出很不方便

**Claude Cowork 解决了这些问题：**

- 作为**原生桌面应用**运行
- 成为你的 **AI 协作伙伴**
- **最多 3 个任务并行运行**
- 复用你**现有的 `~/.claude/settings.json`**
- 与 Claude Code **100% 兼容**

如果 Claude Code 在你的机器上能用 — **Claude Cowork 也能用。**

---

## 功能特性

### 并行任务队列

排队多个任务并同时运行：
- **最多 3 个并发任务**并行运行
- 浮动按钮快速添加任务
- 实时任务状态追踪
- 任务完成时弹出通知
- 随时取消任务

### 连接器与技能

通过设置面板管理 MCP 服务器和技能：
- **内置 MCP 服务器**：文件系统、Web 抓取、内存
- 从 `~/.claude/skills/` **自动发现技能**
- 开关连接器和技能
- 配置偏好设置（最大任务数、自动启动、通知）

### 实时 Diff 可视化

直观查看 Claude 对文件的修改：
- 编辑操作显示修改前后对比
- 写入操作显示完整文件差异
- 语法高亮，大型差异可折叠

### 集成浏览器自动化

内置 dev-browser 技能用于 Web 任务：
- 浏览网站并截图
- 测试 Web 应用
- 填写表单并与页面交互

### 友好的用户体验

- 新用户**欢迎界面**，含快速任务建议
- **进度面板**显示实时活动和统计
- **简化的工具显示**，使用友好的描述
- 简洁、现代的界面

### 会话管理

- 创建会话并指定**自定义工作目录**
- 恢复任何之前的对话
- 完整的本地会话历史（SQLite 存储）
- 安全删除和自动持久化

### 实时流式输出

- **逐字流式输出**
- 查看 Claude 的思考过程
- Markdown + 语法高亮代码渲染
- 工具调用可视化及状态指示

### 工具权限控制

- 敏感操作需要明确批准
- 按工具允许/拒绝
- 交互式决策面板
- 完全控制 Claude 能做什么

---

## 快速开始

### 前置要求

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 已安装并完成认证
- Node.js 18+（或 [Bun](https://bun.sh/)）

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/nicekid1/Claude-Cowork.git
cd claude-cowork

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 或构建生产版本
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

---

## 配置

Claude Cowork **与 Claude Code 共享配置**。

直接复用：

```
~/.claude/settings.json
```

这意味着：
- 相同的 API 密钥
- 相同的 Base URL
- 相同的模型
- 相同的行为

> 配置一次 Claude Code — 到处使用。

### 设置面板

通过侧边栏访问设置进行配置：

| 设置 | 描述 |
|------|------|
| 连接器 | 启用/禁用 MCP 服务器 |
| 技能 | 切换已发现的技能 |
| 最大并发任务 | 1-5 个并行任务 |
| 自动启动任务 | 自动启动排队的任务 |
| 显示通知 | 任务完成时弹出提示 |

---

## 内置技能

Claude Cowork 自动从 `~/.claude/skills/` 发现技能：

| 技能 | 描述 |
|------|------|
| Dev Browser | 使用 Playwright 的浏览器自动化 |
| Office Documents | 创建 Word、Excel、PowerPoint 文件 |
| Backend Guidelines | Electron/Node.js 开发模式 |
| Frontend Guidelines | React 19/TypeScript 最佳实践 |
| Error Tracking | 错误处理模式 |
| Skill Developer | 创建自定义技能 |

---

## 架构概览

| 层级 | 技术 |
|------|------|
| 框架 | Electron 39 |
| 前端 | React 19, Tailwind CSS 4 |
| 状态管理 | Zustand |
| 数据库 | better-sqlite3 (WAL 模式) |
| AI | @anthropic-ai/claude-agent-sdk |
| 构建 | Vite, electron-builder |

---

## 开发

```bash
# 启动开发服务器（热重载）
npm run dev

# 类型检查
npm run build

# 代码检查
npm run lint
```

### 项目结构

```
src/
├── ui/              # React 19 前端
│   ├── components/  # UI 组件
│   ├── store/       # Zustand 状态
│   └── hooks/       # 自定义 hooks
├── electron/        # Electron 主进程
│   ├── libs/        # 核心库
│   └── types.ts     # 共享类型
└── skills/          # 打包的技能

.claude/
├── skills/          # 自动发现的技能
├── hooks/           # 自动化钩子
└── settings.json    # Claude Code 配置
```

---

## 路线图

- [x] 并行任务队列（最多 3 个并发）
- [x] 连接器和技能设置面板
- [x] 欢迎界面和进度面板
- [x] Office 文档创建技能
- [ ] GUI 配置界面（模型和 API 密钥）
- [ ] 多智能体协作
- [ ] 自动检查点（Git 集成）
- [ ] 项目记忆和上下文持久化

---

## 贡献

欢迎提交 PR。

1. Fork 本仓库
2. 创建你的功能分支
3. 提交你的更改
4. 发起 Pull Request

---

## 许可证

MIT
