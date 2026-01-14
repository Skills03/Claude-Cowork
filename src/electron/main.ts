import { app, BrowserWindow, ipcMain, dialog } from "electron"
import { ipcMainHandle, isDev, DEV_PORT } from "./util.js";
import { getPreloadPath, getUIPath, getIconPath, getSkillsPath } from "./pathResolver.js";
import { getStaticData, pollResources } from "./test.js";
import { handleClientEvent, sessions } from "./ipc-handlers.js";
import { generateSessionTitle } from "./libs/util.js";
import type { ClientEvent } from "./types.js";
import "./libs/claude-settings.js";
import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

let devBrowserProcess: ChildProcess | null = null;

function ensureSkillInClaudeDir() {
    const homeDir = os.homedir();
    const claudeSkillsDir = path.join(homeDir, ".claude", "skills");
    const targetSkillDir = path.join(claudeSkillsDir, "dev-browser");
    const sourceSkillDir = path.join(getSkillsPath(), "dev-browser");

    // Create .claude/skills directory if it doesn't exist
    if (!fs.existsSync(claudeSkillsDir)) {
        fs.mkdirSync(claudeSkillsDir, { recursive: true });
        console.log("[DevBrowser] Created ~/.claude/skills directory");
    }

    // Check if skill already exists
    if (fs.existsSync(targetSkillDir)) {
        console.log("[DevBrowser] Skill already exists in ~/.claude/skills/");
        return;
    }

    // Copy the skill to Claude's skills directory
    try {
        fs.cpSync(sourceSkillDir, targetSkillDir, { recursive: true });
        console.log("[DevBrowser] Copied skill to ~/.claude/skills/dev-browser");
    } catch (error) {
        console.error("[DevBrowser] Failed to copy skill:", error);
    }
}

function startDevBrowserServer() {
    const homeDir = os.homedir();
    const skillPath = path.join(homeDir, ".claude", "skills", "dev-browser");
    const serverScript = path.join(skillPath, "scripts", "start-server.ts");

    // Check if node_modules exists, if not use the bundled skill
    if (!fs.existsSync(path.join(skillPath, "node_modules"))) {
        console.log("[DevBrowser] node_modules not found, using bundled skill");
        const bundledPath = path.join(getSkillsPath(), "dev-browser");
        startDevBrowserFromPath(bundledPath);
        return;
    }

    console.log("[DevBrowser] Starting server from:", skillPath);
    startDevBrowserFromPath(skillPath);
}

function startDevBrowserFromPath(skillPath: string) {
    const serverScript = path.join(skillPath, "scripts", "start-server.ts");

    console.log("[DevBrowser] Starting server, script:", serverScript);

    devBrowserProcess = spawn("npx", ["tsx", serverScript], {
        cwd: skillPath,
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, HEADLESS: "false" }
    });

    devBrowserProcess.stdout?.on("data", (data) => {
        console.log("[DevBrowser]", data.toString().trim());
    });

    devBrowserProcess.stderr?.on("data", (data) => {
        console.error("[DevBrowser Error]", data.toString().trim());
    });

    devBrowserProcess.on("exit", (code) => {
        console.log("[DevBrowser] Server exited with code:", code);
        devBrowserProcess = null;
    });
}

function stopDevBrowserServer() {
    if (devBrowserProcess) {
        console.log("[DevBrowser] Stopping server...");
        devBrowserProcess.kill();
        devBrowserProcess = null;
    }
}

app.on("ready", () => {
    // Ensure skill is in Claude's skills directory
    ensureSkillInClaudeDir();

    // Start dev-browser server
    startDevBrowserServer();

    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: getPreloadPath(),
        },
        icon: getIconPath(),
        titleBarStyle: "hiddenInset",
        backgroundColor: "#FAF9F6",
        trafficLightPosition: { x: 15, y: 18 }
    });

    if (isDev()) mainWindow.loadURL(`http://localhost:${DEV_PORT}`)
    else mainWindow.loadFile(getUIPath());

    pollResources(mainWindow);

    ipcMainHandle("getStaticData", () => {
        return getStaticData();
    });

    // Handle client events
    ipcMain.on("client-event", (_, event: ClientEvent) => {
        handleClientEvent(event);
    });

    // Handle session title generation
    ipcMainHandle("generate-session-title", async (_: any, userInput: string | null) => {
        return await generateSessionTitle(userInput);
    });

    // Handle recent cwds request
    ipcMainHandle("get-recent-cwds", (_: any, limit?: number) => {
        const boundedLimit = limit ? Math.min(Math.max(limit, 1), 20) : 8;
        return sessions.listRecentCwds(boundedLimit);
    });

    // Handle directory selection
    ipcMainHandle("select-directory", async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        
        if (result.canceled) {
            return null;
        }
        
        return result.filePaths[0];
    });
});

// Cleanup on quit
app.on("before-quit", () => {
    stopDevBrowserServer();
});

app.on("window-all-closed", () => {
    stopDevBrowserServer();
    if (process.platform !== "darwin") {
        app.quit();
    }
});
