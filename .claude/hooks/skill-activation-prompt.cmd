@echo off
cd /d "%CLAUDE_PROJECT_DIR%\.claude\hooks"
npx tsx skill-activation-prompt.ts
