import { query, type SDKMessage, type PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import type { ServerEvent } from "../types.js";
import type { Session } from "./session-store.js";
import { claudeCodePath, enhancedEnv} from "./util.js";
import * as fs from "fs";
import * as path from "path";


export type RunnerOptions = {
  prompt: string;
  session: Session;
  resumeSessionId?: string;
  onEvent: (event: ServerEvent) => void;
  onSessionUpdate?: (updates: Partial<Session>) => void;
};

export type RunnerHandle = {
  abort: () => void;
};

const DEFAULT_CWD = process.cwd();


export async function runClaude(options: RunnerOptions): Promise<RunnerHandle> {
  const { prompt, session, resumeSessionId, onEvent, onSessionUpdate } = options;
  const abortController = new AbortController();

  // Helper to normalize Unix-style paths on Windows (e.g., /c/Users -> C:\Users)
  const normalizePath = (filePath: string): string => {
    if (process.platform === "win32" && filePath.startsWith("/")) {
      // Convert /c/Users/... to C:\Users\...
      const match = filePath.match(/^\/([a-zA-Z])\/(.*)/);
      if (match) {
        return `${match[1].toUpperCase()}:\\${match[2].replace(/\//g, "\\")}`;
      }
    }
    return filePath;
  };

  // Helper to read file content safely
  const readFileContent = (filePath: string): string | null => {
    try {
      const normalized = normalizePath(filePath);
      const resolvedPath = path.isAbsolute(normalized)
        ? normalized
        : path.join(session.cwd ?? DEFAULT_CWD, normalized);
      return fs.readFileSync(resolvedPath, "utf-8");
    } catch {
      return null; // File doesn't exist or can't be read
    }
  };

  const sendMessage = (message: SDKMessage) => {
    onEvent({
      type: "stream.message",
      payload: { sessionId: session.id, message }
    });
  };

  // Send before content for Write operations (called from canUseTool)
  const sendWriteBefore = (filePath: string, beforeContent: string | null) => {
    onEvent({
      type: "tool.write_before",
      payload: { sessionId: session.id, filePath, beforeContent }
    });
  };

  const sendPermissionRequest = (toolUseId: string, toolName: string, input: unknown) => {
    onEvent({
      type: "permission.request",
      payload: { sessionId: session.id, toolUseId, toolName, input }
    });
  };

  // Start the query in the background
  (async () => {
    try {
      const q = query({
        prompt,
        options: {
          cwd: session.cwd ?? DEFAULT_CWD,
          resume: resumeSessionId,
          abortController,
          env: enhancedEnv,
          pathToClaudeCodeExecutable: claudeCodePath,
          permissionMode: "default",
          includePartialMessages: true,
          canUseTool: async (toolName, input, { signal }) => {
            // Capture and send file state before Write operations for diff visualization
            if (toolName === "Write") {
              const writeInput = input as { file_path?: string };
              if (writeInput.file_path) {
                const beforeContent = readFileContent(writeInput.file_path);
                sendWriteBefore(writeInput.file_path, beforeContent);
                console.log("[DiffCapture] Write tool - path:", writeInput.file_path, "beforeContent:", beforeContent === null ? "NEW FILE" : `${beforeContent.length} chars`);
              }
            }

            // For AskUserQuestion, we need to wait for user response
            if (toolName === "AskUserQuestion") {
              const toolUseId = crypto.randomUUID();

              // Send permission request to frontend
              sendPermissionRequest(toolUseId, toolName, input);

              // Create a promise that will be resolved when user responds
              return new Promise<PermissionResult>((resolve) => {
                session.pendingPermissions.set(toolUseId, {
                  toolUseId,
                  toolName,
                  input,
                  resolve: (result) => {
                    session.pendingPermissions.delete(toolUseId);
                    resolve(result as PermissionResult);
                  }
                });

                // Handle abort
                signal.addEventListener("abort", () => {
                  session.pendingPermissions.delete(toolUseId);
                  resolve({ behavior: "deny", message: "Session aborted" });
                });
              });
            }

            // Auto-approve other tools
            return { behavior: "allow", updatedInput: input };
          }
        }
      });

      // Capture session_id from init message
      for await (const message of q) {
        // Extract session_id from system init message
        if (message.type === "system" && "subtype" in message && message.subtype === "init") {
          const sdkSessionId = message.session_id;
          if (sdkSessionId) {
            session.claudeSessionId = sdkSessionId;
            onSessionUpdate?.({ claudeSessionId: sdkSessionId });
          }
        }

        // Send message to frontend
        sendMessage(message);

        // Check for result to update session status
        if (message.type === "result") {
          const status = message.subtype === "success" ? "completed" : "error";
          onEvent({
            type: "session.status",
            payload: { sessionId: session.id, status, title: session.title }
          });
        }
      }

      // Query completed normally
      if (session.status === "running") {
        onEvent({
          type: "session.status",
          payload: { sessionId: session.id, status: "completed", title: session.title }
        });
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // Session was aborted, don't treat as error
        return;
      }
      onEvent({
        type: "session.status",
        payload: { sessionId: session.id, status: "error", title: session.title, error: String(error) }
      });
    }
  })();

  return {
    abort: () => abortController.abort()
  };
}
