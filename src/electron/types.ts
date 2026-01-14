import type { SDKMessage, PermissionResult } from "@anthropic-ai/claude-agent-sdk";

// MCP Server Types
export type MCPServerConfig = {
  command: string;
  args?: string[];
  env?: Record<string, string>;
};

export type MCPServer = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  config: MCPServerConfig;
  builtIn?: boolean;
};

// Skill Types
export type SkillInfo = {
  id: string;
  name: string;
  description: string;
  path: string;
  enabled: boolean;
  builtIn?: boolean;
  triggers?: string[];
};

// App Settings
export type CoworkSettings = {
  mcpServers: MCPServer[];
  skills: SkillInfo[];
  preferences: {
    maxConcurrentTasks: number;
    autoStartTasks: boolean;
    showNotifications: boolean;
    defaultCwd?: string;
  };
};

// Task Queue Types
export type TaskStatus = "queued" | "running" | "completed" | "error" | "cancelled";

export type QueuedTask = {
  id: string;
  prompt: string;
  cwd: string;
  status: TaskStatus;
  sessionId?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
};

export type ClaudeSettingsEnv = {
  ANTHROPIC_AUTH_TOKEN: string;
  ANTHROPIC_BASE_URL: string;
  ANTHROPIC_DEFAULT_HAIKU_MODEL: string;
  ANTHROPIC_DEFAULT_OPUS_MODEL: string;
  ANTHROPIC_DEFAULT_SONNET_MODEL: string;
  ANTHROPIC_MODEL: string;
  API_TIMEOUT_MS: string;
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: string;
};

export type UserPromptMessage = {
  type: "user_prompt";
  prompt: string;
};

export type StreamMessage = SDKMessage | UserPromptMessage;

export type SessionStatus = "idle" | "running" | "completed" | "error";

export type SessionInfo = {
  id: string;
  title: string;
  status: SessionStatus;
  claudeSessionId?: string;
  cwd?: string;
  createdAt: number;
  updatedAt: number;
};

// Server -> Client events
export type ServerEvent =
  | { type: "stream.message"; payload: { sessionId: string; message: StreamMessage } }
  | { type: "stream.user_prompt"; payload: { sessionId: string; prompt: string } }
  | { type: "session.status"; payload: { sessionId: string; status: SessionStatus; title?: string; cwd?: string; error?: string } }
  | { type: "session.list"; payload: { sessions: SessionInfo[] } }
  | { type: "session.history"; payload: { sessionId: string; status: SessionStatus; messages: StreamMessage[] } }
  | { type: "session.deleted"; payload: { sessionId: string } }
  | { type: "permission.request"; payload: { sessionId: string; toolUseId: string; toolName: string; input: unknown } }
  | { type: "runner.error"; payload: { sessionId?: string; message: string } }
  | { type: "tool.write_before"; payload: { sessionId: string; filePath: string; beforeContent: string | null } }
  // Task Queue Events
  | { type: "task.list"; payload: { tasks: QueuedTask[] } }
  | { type: "task.added"; payload: { task: QueuedTask } }
  | { type: "task.updated"; payload: { task: QueuedTask } }
  | { type: "task.removed"; payload: { taskId: string } }
  | { type: "task.completed"; payload: { task: QueuedTask } }
  // Settings Events
  | { type: "settings.loaded"; payload: { settings: CoworkSettings } }
  | { type: "settings.updated"; payload: { settings: CoworkSettings } };

// Client -> Server events
export type ClientEvent =
  | { type: "session.start"; payload: { title: string; prompt: string; cwd?: string; allowedTools?: string } }
  | { type: "session.continue"; payload: { sessionId: string; prompt: string } }
  | { type: "session.stop"; payload: { sessionId: string } }
  | { type: "session.delete"; payload: { sessionId: string } }
  | { type: "session.list" }
  | { type: "session.history"; payload: { sessionId: string } }
  | { type: "permission.response"; payload: { sessionId: string; toolUseId: string; result: PermissionResult } }
  // Task Queue Events
  | { type: "task.queue"; payload: { prompt: string; cwd: string } }
  | { type: "task.cancel"; payload: { taskId: string } }
  | { type: "task.list" }
  // Settings Events
  | { type: "settings.get" }
  | { type: "settings.update"; payload: { settings: Partial<CoworkSettings> } }
  | { type: "settings.toggleMCP"; payload: { serverId: string; enabled: boolean } }
  | { type: "settings.toggleSkill"; payload: { skillId: string; enabled: boolean } };
