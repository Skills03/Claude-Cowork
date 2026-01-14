#!/usr/bin/env npx tsx
/**
 * Post Tool Use Tracker
 * Logs edited files for context tracking and potential build checks
 */

import * as fs from 'fs';
import * as path from 'path';

interface ToolInput {
    tool_name: string;
    tool_input: {
        file_path?: string;
        command?: string;
    };
    session_id?: string;
}

async function main() {
    // Read JSON from stdin
    let input = '';
    for await (const chunk of process.stdin) {
        input += chunk;
    }

    if (!input.trim()) {
        process.exit(0);
    }

    let data: ToolInput;
    try {
        data = JSON.parse(input);
    } catch {
        process.exit(0);
    }

    const { tool_name, tool_input, session_id } = data;

    // Only track file editing tools
    if (!['Edit', 'Write', 'MultiEdit'].includes(tool_name)) {
        process.exit(0);
    }

    const filePath = tool_input?.file_path;
    if (!filePath) {
        process.exit(0);
    }

    // Get project directory
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const stateDir = path.join(projectDir, '.claude', 'hooks', 'state');

    // Ensure state directory exists
    if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
    }

    // Log the edited file
    const logFile = path.join(stateDir, 'edited-files.log');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${tool_name}: ${filePath}\n`;

    fs.appendFileSync(logFile, logEntry);

    // Also track by session if available
    if (session_id) {
        const sessionLog = path.join(stateDir, `session-${session_id}-edits.log`);
        fs.appendFileSync(sessionLog, logEntry);
    }

    process.exit(0);
}

main().catch(() => process.exit(0));
