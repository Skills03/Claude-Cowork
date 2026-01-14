[简体中文](README_ZH.md)

# Claude Cowork

A **desktop AI assistant** for **programming, file management, and any task you can describe**.

Fully compatible with **Claude Code configuration**, meaning you can use any Anthropic-compatible LLM.

> Not just a GUI.
> A real AI collaboration partner.
> No need to learn the Claude Agent SDK — just describe tasks in natural language.

https://github.com/user-attachments/assets/8ce58c8b-4024-4c01-82ee-f8d8ed6d4bba

---

## Why Claude Cowork?

Claude Code is powerful — but it **only runs in the terminal**.

That means:
- No visual feedback for complex tasks
- Hard to track multiple sessions
- Tool outputs are inconvenient to inspect

**Claude Cowork solves these:**

- Runs as a **native desktop application**
- Acts as your **AI collaboration partner**
- Reuses your **existing `~/.claude/settings.json`**
- **100% compatible** with Claude Code

If Claude Code works on your machine — **Claude Cowork works too.**

---

## Features

### Live Diff Visualization

See exactly what Claude is changing in your files with inline diffs:
- Edit operations show before/after comparisons
- Write operations show full file diffs
- Syntax highlighting and collapsible large diffs

### Integrated Browser Automation

Built-in dev-browser skill for web tasks:
- Navigate websites and take screenshots
- Test web applications
- Fill forms and interact with pages

### Session Management

- Create sessions with **custom working directories**
- Resume any previous conversation
- Complete local session history (SQLite)
- Safe deletion and automatic persistence

### Real-Time Streaming

- **Token-by-token streaming output**
- View Claude's reasoning process
- Markdown rendering with syntax-highlighted code
- Visualized tool calls with status indicators

### Tool Permission Control

- Explicit approval for sensitive actions
- Allow or deny per tool
- Interactive decision panels
- Full control over what Claude can do

---

## Quick Start

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- Node.js 18+ (or [Bun](https://bun.sh/))

### Build from Source

```bash
# Clone the repository
git clone <your-repo-url>
cd claude-cowork

# Install dependencies
npm install

# Run in development mode
npm run dev

# Or build production binaries
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

---

## Configuration

Claude Cowork **shares configuration with Claude Code**.

It directly reuses:

```
~/.claude/settings.json
```

This means:
- Same API keys
- Same base URL
- Same models
- Same behavior

> Configure Claude Code once — use it everywhere.

---

## Architecture

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Framework        | Electron 39                    |
| Frontend         | React 19, Tailwind CSS 4       |
| State Management | Zustand                        |
| Database         | better-sqlite3 (WAL mode)      |
| AI               | @anthropic-ai/claude-agent-sdk |
| Build            | Vite, electron-builder         |

---

## Development

```bash
# Start development server (hot reload)
npm run dev

# Type checking
npm run build

# Lint
npm run lint
```

---

## Roadmap

- GUI-based configuration for models and API keys
- Multi-agent orchestration
- Autonomous checkpoints with git integration
- Project memory and context persistence

---

## Contributing

Pull requests are welcome.

1. Fork this repository
2. Create your feature branch
3. Commit your changes
4. Open a Pull Request

---

## License

MIT
