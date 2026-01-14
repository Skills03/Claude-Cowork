[English](README.md)

# Claude Cowork

**桌面 AI 助手**，帮助你完成**编程、文件管理以及任何你能描述的任务**。

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
- 复用你**现有的 `~/.claude/settings.json`**
- 与 Claude Code **100% 兼容**

如果 Claude Code 在你的机器上能用 — **Claude Cowork 也能用。**

---

## 功能特性

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
git clone <your-repo-url>
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

---

## 路线图

- GUI 配置界面（模型和 API 密钥）
- 多智能体协作
- 自动检查点（Git 集成）
- 项目记忆和上下文持久化

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
