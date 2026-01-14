@echo off
cd /d "%CLAUDE_PROJECT_DIR%\.claude\hooks"
npx tsx error-handling-reminder.ts
