import { useMemo } from "react";
import type { StreamMessage } from "../types";

interface ProgressPanelProps {
  messages: StreamMessage[];
  isRunning: boolean;
  cwd?: string;
}

interface TaskStep {
  type: "thinking" | "reading" | "writing" | "editing" | "running" | "searching" | "complete";
  description: string;
  status: "pending" | "active" | "done";
  file?: string;
}

// Extract tool actions from messages to show progress
function extractSteps(messages: StreamMessage[]): TaskStep[] {
  const steps: TaskStep[] = [];

  for (const msg of messages) {
    // Check for assistant messages which contain tool_use
    if (msg.type !== "assistant") continue;
    if (!("message" in msg) || !msg.message?.content) continue;

    for (const content of msg.message.content) {
      if (content.type === "tool_use") {
        const toolName = content.name;
        const input = content.input as Record<string, any>;

        let step: TaskStep | null = null;

        switch (toolName) {
          case "Read":
            step = {
              type: "reading",
              description: `Reading ${getFileName(input.file_path)}`,
              status: "done",
              file: input.file_path
            };
            break;
          case "Write":
            step = {
              type: "writing",
              description: `Creating ${getFileName(input.file_path)}`,
              status: "done",
              file: input.file_path
            };
            break;
          case "Edit":
            step = {
              type: "editing",
              description: `Editing ${getFileName(input.file_path)}`,
              status: "done",
              file: input.file_path
            };
            break;
          case "Bash":
            step = {
              type: "running",
              description: `Running command`,
              status: "done"
            };
            break;
          case "Glob":
          case "Grep":
            step = {
              type: "searching",
              description: `Searching files`,
              status: "done"
            };
            break;
          case "TodoWrite":
            // Skip internal task tracking
            break;
          default:
            step = {
              type: "complete",
              description: `Used ${toolName}`,
              status: "done"
            };
        }

        if (step) {
          // Avoid duplicates
          const exists = steps.some(s =>
            s.description === step!.description && s.file === step!.file
          );
          if (!exists) {
            steps.push(step);
          }
        }
      }
    }
  }

  return steps;
}

function getFileName(path?: string): string {
  if (!path) return "file";
  return path.split(/[\\/]/).pop() || path;
}

function getStepIcon(type: TaskStep["type"]): string {
  switch (type) {
    case "thinking": return "🤔";
    case "reading": return "📖";
    case "writing": return "✏️";
    case "editing": return "📝";
    case "running": return "⚡";
    case "searching": return "🔍";
    case "complete": return "✅";
    default: return "•";
  }
}

export function ProgressPanel({ messages, isRunning, cwd }: ProgressPanelProps) {
  const steps = useMemo(() => extractSteps(messages), [messages]);

  // Get folder name from cwd
  const folderName = cwd?.split(/[\\/]/).pop() || "Project";

  // Count stats
  const filesRead = steps.filter(s => s.type === "reading").length;
  const filesModified = steps.filter(s => s.type === "writing" || s.type === "editing").length;
  const commandsRun = steps.filter(s => s.type === "running").length;

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="w-72 border-l border-ink-900/10 bg-surface flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-ink-900/10">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-sm font-medium text-ink-800 truncate">{folderName}</span>
        </div>
        {cwd && (
          <div className="text-xs text-muted mt-1 truncate" title={cwd}>{cwd}</div>
        )}
      </div>

      {/* Status */}
      <div className="p-4 border-b border-ink-900/10">
        <div className="flex items-center gap-2 mb-3">
          {isRunning ? (
            <>
              <div className="w-2 h-2 rounded-full bg-info animate-pulse" />
              <span className="text-sm font-medium text-info">Working...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm font-medium text-success">Ready</span>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-surface-secondary">
            <div className="text-lg font-semibold text-ink-800">{filesRead}</div>
            <div className="text-[10px] text-muted">Read</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-surface-secondary">
            <div className="text-lg font-semibold text-ink-800">{filesModified}</div>
            <div className="text-[10px] text-muted">Modified</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-surface-secondary">
            <div className="text-lg font-semibold text-ink-800">{commandsRun}</div>
            <div className="text-[10px] text-muted">Commands</div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
          Recent Activity
        </div>

        {steps.length === 0 ? (
          <div className="text-sm text-muted text-center py-4">
            No activity yet
          </div>
        ) : (
          <div className="space-y-2">
            {steps.slice(-10).reverse().map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg bg-surface-secondary/50"
              >
                <span className="text-sm flex-shrink-0">{getStepIcon(step.type)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-ink-700 truncate">{step.description}</div>
                  {step.file && (
                    <div className="text-[10px] text-muted truncate" title={step.file}>
                      {step.file}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Safety Notice */}
      <div className="p-3 border-t border-ink-900/10 bg-surface-secondary/30">
        <div className="flex items-start gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 9v2m0 4h.01M12 3l9 16H3L12 3z" />
          </svg>
          <div className="text-[10px] text-muted leading-relaxed">
            Claude asks permission before making significant changes to your files.
          </div>
        </div>
      </div>
    </div>
  );
}
