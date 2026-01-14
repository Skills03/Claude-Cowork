# Claude Cowork - Project Context

A desktop AI assistant built with Electron, wrapping the Claude Agent SDK.

## Project Structure

```
src/
├── ui/              # React 19 frontend (Zustand, Tailwind CSS)
│   ├── components/  # React components
│   ├── store/       # Zustand state management
│   └── index.tsx    # Main entry
├── electron/        # Electron main process
│   ├── libs/        # Core libraries (runner, session store)
│   ├── main.ts      # Main entry
│   └── preload.cts  # Preload script
└── skills/          # Bundled skills (dev-browser)

.claude/             # Claude Code Infrastructure
├── skills/          # Domain skills with auto-activation
├── hooks/           # Automation hooks
├── agents/          # Specialized subagents
├── commands/        # Slash commands
└── settings.json    # Hook configuration

dev/                 # Dev docs for task tracking
└── active/          # Active task documentation
```

---

## Quick Commands

```bash
npm run dev          # Start development mode
npm run build        # Build for production
npm run dist:win     # Build Windows installer
```

---

## Infrastructure (from claude-code-infrastructure-showcase)

### Skills (Auto-Activation)

Skills auto-suggest based on keywords, file patterns, and content. Configuration: `.claude/skills/skill-rules.json`

| Skill | Purpose | Triggers |
|-------|---------|----------|
| `skill-developer` | Creating/managing skills | "create skill", "skill-rules" |
| `backend-dev-guidelines` | Electron/Node patterns | Editing `src/electron/**` |
| `frontend-dev-guidelines` | React 19 patterns | Editing `src/ui/**` |
| `error-tracking` | Error handling patterns | "error handling", try/catch |

### Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `skill-activation-prompt` | UserPromptSubmit | Auto-suggest relevant skills |
| `post-tool-use-tracker` | PostToolUse | Track edited files |
| `error-handling-reminder` | Stop | Remind about error handling |

### Agents (10 Available)

Use with Task tool: `subagent_type: "agent-name"`

| Agent | Purpose |
|-------|---------|
| `code-architecture-reviewer` | Review code for best practices |
| `auto-error-resolver` | Fix TypeScript errors |
| `refactor-planner` | Plan refactoring strategies |
| `web-research-specialist` | Research technical issues |
| `documentation-architect` | Create comprehensive docs |
| `frontend-error-fixer` | Debug frontend errors |

### Slash Commands

| Command | Purpose |
|---------|---------|
| `/dev-docs` | Create task documentation (plan, context, tasks) |
| `/dev-docs-update` | Update docs before context reset |

---

## Dev Docs Pattern

For complex tasks, create documentation in `dev/active/[task-name]/`:

```
dev/active/my-feature/
├── my-feature-plan.md      # Strategic plan
├── my-feature-context.md   # Key decisions, current state
└── my-feature-tasks.md     # Checklist for tracking
```

This survives context resets - Claude reads these to resume work.

---

## Dev Browser (Browser Automation)

Location: `~/.claude/skills/dev-browser/`

**Quick command:**
```bash
cd ~/.claude/skills/dev-browser && npx tsx scripts/browse.ts <url> [--screenshot <filename>]
```

**Examples:**
```bash
# Navigate and see content
cd ~/.claude/skills/dev-browser && npx tsx scripts/browse.ts https://google.com

# Take a screenshot
cd ~/.claude/skills/dev-browser && npx tsx scripts/browse.ts https://example.com --screenshot example.png
```

Screenshots saved to: `~/.claude/skills/dev-browser/tmp/`

**Server:** Auto-starts on port 9222 with Claude Cowork.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/electron/libs/runner.ts` | Claude Agent SDK runner |
| `src/electron/libs/sessionStore.ts` | SQLite session persistence |
| `src/ui/store/useAppStore.ts` | Zustand state management |
| `src/ui/components/EventCard.tsx` | Message/tool rendering with diff |
| `.claude/skills/skill-rules.json` | Skill auto-activation config |
| `.claude/settings.json` | Hook configuration |
