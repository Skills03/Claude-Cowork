import { useState } from "react";
import type { QueuedTask, TaskStatus } from "../types";

interface TaskQueuePanelProps {
  tasks: QueuedTask[];
  onCancelTask: (taskId: string) => void;
  onViewTask: (sessionId: string) => void;
}

function getStatusIcon(status: TaskStatus): string {
  switch (status) {
    case "queued": return "⏳";
    case "running": return "🔄";
    case "completed": return "✅";
    case "error": return "❌";
    case "cancelled": return "🚫";
    default: return "•";
  }
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case "queued": return "text-muted";
    case "running": return "text-info";
    case "completed": return "text-success";
    case "error": return "text-error";
    case "cancelled": return "text-muted";
    default: return "text-ink-700";
  }
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function TaskCard({
  task,
  onCancel,
  onView
}: {
  task: QueuedTask;
  onCancel: () => void;
  onView: () => void;
}) {
  const isRunning = task.status === "running";
  const isQueued = task.status === "queued";
  const canCancel = isRunning || isQueued;
  const canView = task.sessionId !== undefined;

  return (
    <div className="p-3 rounded-xl bg-surface border border-ink-900/10 hover:border-ink-900/20 transition-colors">
      <div className="flex items-start gap-3">
        <span className={`text-lg ${isRunning ? "animate-spin" : ""}`}>
          {getStatusIcon(task.status)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
            <span className="text-[10px] text-muted">
              {formatTimeAgo(task.createdAt)}
            </span>
          </div>
          <p className="text-sm text-ink-700 mt-1 line-clamp-2">{task.prompt}</p>
          <div className="text-[10px] text-muted mt-1 truncate" title={task.cwd}>
            {task.cwd.split(/[\\/]/).slice(-2).join("/")}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-ink-900/5">
        {canView && (
          <button
            onClick={onView}
            className="flex-1 text-xs text-accent hover:text-accent-hover py-1 rounded transition-colors"
          >
            View
          </button>
        )}
        {canCancel && (
          <button
            onClick={onCancel}
            className="flex-1 text-xs text-error/70 hover:text-error py-1 rounded transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function TaskQueuePanel({ tasks, onCancelTask, onViewTask }: TaskQueuePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const runningTasks = tasks.filter(t => t.status === "running");
  const queuedTasks = tasks.filter(t => t.status === "queued");
  const totalActive = runningTasks.length + queuedTasks.length;

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 z-40">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-t-xl bg-surface border border-ink-900/10 border-b-0 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-sm font-medium text-ink-800">Task Queue</span>
          {totalActive > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded-full">
              {totalActive} active
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Task List - Collapsible */}
      {isExpanded && (
        <div className="bg-surface-secondary border border-ink-900/10 border-t-0 rounded-b-xl shadow-lg max-h-80 overflow-y-auto">
          <div className="p-3 space-y-2">
            {/* Running Tasks */}
            {runningTasks.length > 0 && (
              <div>
                <div className="text-[10px] font-medium text-muted uppercase tracking-wide mb-2">
                  Running ({runningTasks.length})
                </div>
                {runningTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onCancel={() => onCancelTask(task.id)}
                    onView={() => task.sessionId && onViewTask(task.sessionId)}
                  />
                ))}
              </div>
            )}

            {/* Queued Tasks */}
            {queuedTasks.length > 0 && (
              <div className={runningTasks.length > 0 ? "mt-3" : ""}>
                <div className="text-[10px] font-medium text-muted uppercase tracking-wide mb-2">
                  Queued ({queuedTasks.length})
                </div>
                {queuedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onCancel={() => onCancelTask(task.id)}
                    onView={() => task.sessionId && onViewTask(task.sessionId)}
                  />
                ))}
              </div>
            )}

            {totalActive === 0 && (
              <div className="text-center py-4 text-sm text-muted">
                All tasks completed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
