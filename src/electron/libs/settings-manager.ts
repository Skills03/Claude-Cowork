import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { app } from "electron";
import type { CoworkSettings, MCPServer, SkillInfo } from "../types.js";

const CLAUDE_DIR = join(homedir(), ".claude");
const CLAUDE_SETTINGS_PATH = join(CLAUDE_DIR, "settings.json");
const COWORK_SETTINGS_PATH = join(app.getPath("userData"), "cowork-settings.json");

// Built-in MCP servers that Cowork supports
const BUILT_IN_MCP_SERVERS: MCPServer[] = [
  {
    id: "filesystem",
    name: "Filesystem",
    description: "Read and write files on your computer",
    enabled: true,
    builtIn: true,
    config: {
      command: "npx",
      args: ["-y", "@anthropic-ai/mcp-server-filesystem"]
    }
  },
  {
    id: "fetch",
    name: "Web Fetch",
    description: "Fetch content from URLs",
    enabled: false,
    builtIn: true,
    config: {
      command: "npx",
      args: ["-y", "@anthropic-ai/mcp-server-fetch"]
    }
  },
  {
    id: "memory",
    name: "Memory",
    description: "Persistent key-value memory across sessions",
    enabled: false,
    builtIn: true,
    config: {
      command: "npx",
      args: ["-y", "@anthropic-ai/mcp-server-memory"]
    }
  }
];

// Default settings
const DEFAULT_SETTINGS: CoworkSettings = {
  mcpServers: BUILT_IN_MCP_SERVERS,
  skills: [],
  preferences: {
    maxConcurrentTasks: 3,
    autoStartTasks: true,
    showNotifications: true
  }
};

/**
 * Discover skills from the .claude/skills directory
 */
function discoverSkills(): SkillInfo[] {
  const skills: SkillInfo[] = [];
  const skillsDirs = [
    join(CLAUDE_DIR, "skills"),
    join(process.cwd(), ".claude", "skills")
  ];

  for (const skillsDir of skillsDirs) {
    if (!existsSync(skillsDir)) continue;

    try {
      const entries = readdirSync(skillsDir);
      for (const entry of entries) {
        const skillPath = join(skillsDir, entry);
        const stat = statSync(skillPath);

        if (!stat.isDirectory()) continue;

        // Look for SKILL.md or skill.md
        const skillMdPath = existsSync(join(skillPath, "SKILL.md"))
          ? join(skillPath, "SKILL.md")
          : existsSync(join(skillPath, "skill.md"))
            ? join(skillPath, "skill.md")
            : null;

        if (!skillMdPath) continue;

        // Parse skill metadata from markdown
        try {
          const content = readFileSync(skillMdPath, "utf-8");
          const nameMatch = content.match(/^#\s+(.+)$/m);
          const descMatch = content.match(/(?:^|\n)([^#\n][^\n]+)/);

          skills.push({
            id: entry,
            name: nameMatch ? nameMatch[1].trim() : entry,
            description: descMatch ? descMatch[1].trim().slice(0, 100) : `Skill: ${entry}`,
            path: skillPath,
            enabled: true,
            builtIn: skillPath.includes(join(CLAUDE_DIR, "skills")),
            triggers: extractTriggers(content)
          });
        } catch {
          // Skip unreadable skills
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  return skills;
}

/**
 * Extract trigger keywords from skill content
 */
function extractTriggers(content: string): string[] {
  const triggers: string[] = [];

  // Look for keywords in description or trigger section
  const keywordsMatch = content.match(/keywords?[:\s]+([^\n]+)/i);
  if (keywordsMatch) {
    triggers.push(...keywordsMatch[1].split(/[,;]/).map(t => t.trim()).filter(Boolean));
  }

  // Look for "use when" or "triggers" section
  const triggersMatch = content.match(/(?:use when|triggers?)[:\s]+([^\n]+)/i);
  if (triggersMatch) {
    triggers.push(...triggersMatch[1].split(/[,;]/).map(t => t.trim()).filter(Boolean));
  }

  return triggers.slice(0, 10); // Limit to 10 triggers
}

/**
 * Load MCP servers from Claude's settings.json
 */
function loadClaudeMCPServers(): MCPServer[] {
  const servers: MCPServer[] = [];

  try {
    if (existsSync(CLAUDE_SETTINGS_PATH)) {
      const content = readFileSync(CLAUDE_SETTINGS_PATH, "utf-8");
      const settings = JSON.parse(content);

      if (settings.mcpServers && typeof settings.mcpServers === "object") {
        for (const [name, config] of Object.entries(settings.mcpServers)) {
          const serverConfig = config as any;
          servers.push({
            id: `claude-${name}`,
            name: name,
            description: `MCP server from Claude Code settings`,
            enabled: true,
            builtIn: false,
            config: {
              command: serverConfig.command || "",
              args: serverConfig.args || [],
              env: serverConfig.env
            }
          });
        }
      }
    }
  } catch {
    // Ignore errors reading Claude settings
  }

  return servers;
}

/**
 * Load Cowork-specific settings
 */
function loadCoworkSettings(): Partial<CoworkSettings> {
  try {
    if (existsSync(COWORK_SETTINGS_PATH)) {
      const content = readFileSync(COWORK_SETTINGS_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // Return empty if can't read
  }
  return {};
}

/**
 * Save Cowork-specific settings
 */
function saveCoworkSettings(settings: Partial<CoworkSettings>): void {
  try {
    writeFileSync(COWORK_SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error("Failed to save Cowork settings:", err);
  }
}

/**
 * Get full settings combining all sources
 */
export function getSettings(): CoworkSettings {
  // Start with defaults
  const settings: CoworkSettings = { ...DEFAULT_SETTINGS };

  // Load saved Cowork settings
  const savedSettings = loadCoworkSettings();

  // Merge preferences
  if (savedSettings.preferences) {
    settings.preferences = { ...settings.preferences, ...savedSettings.preferences };
  }

  // Discover skills
  settings.skills = discoverSkills();

  // Apply saved skill states
  if (savedSettings.skills) {
    for (const savedSkill of savedSettings.skills) {
      const skill = settings.skills.find(s => s.id === savedSkill.id);
      if (skill) {
        skill.enabled = savedSkill.enabled;
      }
    }
  }

  // Combine MCP servers: built-in + Claude's + saved states
  const claudeServers = loadClaudeMCPServers();
  const allServers = [...BUILT_IN_MCP_SERVERS, ...claudeServers];

  // Apply saved MCP states
  if (savedSettings.mcpServers) {
    for (const savedServer of savedSettings.mcpServers) {
      const server = allServers.find(s => s.id === savedServer.id);
      if (server) {
        server.enabled = savedServer.enabled;
      }
    }
  }

  settings.mcpServers = allServers;

  return settings;
}

/**
 * Update settings
 */
export function updateSettings(updates: Partial<CoworkSettings>): CoworkSettings {
  const current = loadCoworkSettings();

  // Merge updates
  const newSettings: Partial<CoworkSettings> = {
    ...current,
    ...updates
  };

  // Only save state info for skills and MCP servers (not full config)
  if (updates.skills) {
    newSettings.skills = updates.skills.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      path: s.path,
      enabled: s.enabled
    }));
  }

  if (updates.mcpServers) {
    newSettings.mcpServers = updates.mcpServers.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      enabled: s.enabled,
      config: s.config,
      builtIn: s.builtIn
    }));
  }

  saveCoworkSettings(newSettings);

  return getSettings();
}

/**
 * Toggle MCP server enabled state
 */
export function toggleMCPServer(serverId: string, enabled: boolean): CoworkSettings {
  const settings = getSettings();
  const server = settings.mcpServers.find(s => s.id === serverId);

  if (server) {
    server.enabled = enabled;
    updateSettings({ mcpServers: settings.mcpServers });
  }

  return getSettings();
}

/**
 * Toggle skill enabled state
 */
export function toggleSkill(skillId: string, enabled: boolean): CoworkSettings {
  const settings = getSettings();
  const skill = settings.skills.find(s => s.id === skillId);

  if (skill) {
    skill.enabled = enabled;
    updateSettings({ skills: settings.skills });
  }

  return getSettings();
}

/**
 * Get enabled MCP servers for session
 */
export function getEnabledMCPServers(): MCPServer[] {
  const settings = getSettings();
  return settings.mcpServers.filter(s => s.enabled);
}

/**
 * Get enabled skills for session
 */
export function getEnabledSkills(): SkillInfo[] {
  const settings = getSettings();
  return settings.skills.filter(s => s.enabled);
}
