# Claude Cowork - Project Context

## Available Skills

### Dev Browser (Browser Automation)
Location: `~/.claude/skills/dev-browser/`

**Quick command for browsing:**
```bash
cd ~/.claude/skills/dev-browser && npx tsx scripts/browse.ts <url> [--screenshot <filename>]
```

**Examples:**
```bash
# Navigate to a URL and see content
cd ~/.claude/skills/dev-browser && npx tsx scripts/browse.ts https://google.com

# Take a screenshot
cd ~/.claude/skills/dev-browser && npx tsx scripts/browse.ts https://example.com --screenshot example.png
```

Screenshots saved to: `~/.claude/skills/dev-browser/tmp/`

**When to use:** For navigating websites, taking screenshots, testing web apps, filling forms, or any browser automation task.

**Server:** The dev-browser server runs automatically on port 9222 when Claude Cowork starts.
