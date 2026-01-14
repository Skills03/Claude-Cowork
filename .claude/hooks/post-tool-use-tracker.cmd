@echo off
REM Post tool use tracker - logs edited files
REM Input is JSON with tool_name and tool_input from stdin
setlocal enabledelayedexpansion

set "LOG_DIR=%CLAUDE_PROJECT_DIR%\.claude\hooks\state"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

set "LOG_FILE=%LOG_DIR%\edited-files.log"

REM Read JSON from stdin and extract file_path if present
for /f "tokens=*" %%i in ('findstr /r "file_path"') do (
    echo [%date% %time%] %%i >> "%LOG_FILE%"
)
