[简体中文](README_ZH.md)

# Claude Cowork

A **desktop AI assistant** for **programming, file management, and any task you can describe**.

Inspired by [Anthropic's Cowork](https://www.anthropic.com/news/cowork) — run multiple AI tasks in parallel with a friendly GUI.

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
- **Run up to 3 tasks in parallel**
- Reuses your **existing `~/.claude/settings.json`**
- **100% compatible** with Claude Code

If Claude Code works on your machine — **Claude Cowork works too.**

---

## Features

### Parallel Task Queue

Queue multiple tasks and run them simultaneously:
- **Up to 3 concurrent tasks** running in parallel
- Quick task input with floating action button
- Real-time task status tracking
- Toast notifications when tasks complete
- Cancel tasks at any time

### Connectors & Skills

Manage MCP servers and skills through Settings:
- **Built-in MCP Servers**: Filesystem, Web Fetch, Memory
- **Auto-discover skills** from `~/.claude/skills/`
- Toggle connectors and skills on/off
- Configure preferences (max tasks, auto-start, notifications)

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

### Friendly User Experience

- **Welcome Screen** for new users with quick task suggestions
- **Progress Panel** showing real-time activity and stats
- **Simplified tool display** with friendly descriptions
- Clean, modern interface

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
git clone https://github.com/nicekid1/Claude-Cowork.git
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

### Settings Panel

Access settings via the sidebar to configure:

| Setting | Description |
|---------|-------------|
| Connectors | Enable/disable MCP servers |
| Skills | Toggle discovered skills |
| Max Concurrent Tasks | 1-5 parallel tasks |
| Auto-start Tasks | Automatically start queued tasks |
| Show Notifications | Toast alerts for task completion |

---

## Built-in Skills

Claude Cowork auto-discovers skills from `~/.claude/skills/`:

| Skill | Description |
|-------|-------------|
| Dev Browser | Browser automation with Playwright |
| Office Documents | Create Word, Excel, PowerPoint files |
| Backend Guidelines | Electron/Node.js development patterns |
| Frontend Guidelines | React 19/TypeScript best practices |
| Error Tracking | Error handling patterns |
| Skill Developer | Create custom skills |

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

### Project Structure

```
src/
├── ui/              # React 19 frontend
│   ├── components/  # UI components
│   ├── store/       # Zustand state
│   └── hooks/       # Custom hooks
├── electron/        # Electron main process
│   ├── libs/        # Core libraries
│   └── types.ts     # Shared types
└── skills/          # Bundled skills

.claude/
├── skills/          # Auto-discovered skills
├── hooks/           # Automation hooks
└── settings.json    # Claude Code config
```

---

## Roadmap

- [x] Parallel task queue (up to 3 concurrent)
- [x] Settings panel for connectors & skills
- [x] Welcome screen & progress panel
- [x] Office document creation skill
- [ ] GUI-based configuration for models and API keys
- [ ] Multi-agent orchestration
- [ ] Autonomous checkpoints with git integration
- [ ] Project memory and context persistence

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
