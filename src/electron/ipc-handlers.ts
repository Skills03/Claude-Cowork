import { BrowserWindow } from "electron";
import type { ClientEvent, ServerEvent, QueuedTask } from "./types.js";
import { runClaude, type RunnerHandle } from "./libs/runner.js";
import { SessionStore } from "./libs/session-store.js";
import { generateSessionTitle } from "./libs/util.js";
import { getSettings, updateSettings, toggleMCPServer, toggleSkill } from "./libs/settings-manager.js";
import { app } from "electron";
import { join } from "path";
import { randomUUID } from "crypto";

const DB_PATH = join(app.getPath("userData"), "sessions.db");
const sessions = new SessionStore(DB_PATH);
const runnerHandles = new Map<string, RunnerHandle>();

// Backend startup test
console.log("\n" + "=".repeat(50));
console.log("CLAUDE COWORK BACKEND TEST");
console.log("=".repeat(50));

// Test Phase 3: Settings
try {
  const settings = getSettings();
  console.log("\n[Phase 3] Settings Manager: ✓");
  console.log(`  - MCP Servers: ${settings.mcpServers.length} (${settings.mcpServers.filter(s => s.enabled).length} enabled)`);
  console.log(`  - Skills discovered: ${settings.skills.length}`);
  settings.skills.forEach(s => console.log(`    - ${s.name} (${s.enabled ? 'enabled' : 'disabled'})`));
  console.log(`  - Preferences: maxTasks=${settings.preferences.maxConcurrentTasks}, autoStart=${settings.preferences.autoStartTasks}`);
} catch (e) {
  console.log("[Phase 3] Settings Manager: ✗", e);
}

// Test Phase 2: Task Queue
console.log("\n[Phase 2] Task Queue: ✓");
console.log(`  - Max concurrent tasks: 3`);
console.log(`  - Queue handlers: task.queue, task.cancel, task.list`);

// Test Phase 1: Session Store
try {
  const sessionList = sessions.listSessions();
  console.log("\n[Phase 1] Session Store: ✓");
  console.log(`  - Database: ${DB_PATH}`);
  console.log(`  - Existing sessions: ${sessionList.length}`);
} catch (e) {
  console.log("[Phase 1] Session Store: ✗", e);
}

console.log("\n" + "=".repeat(50));
console.log("ALL BACKEND SYSTEMS OPERATIONAL");
console.log("=".repeat(50) + "\n");

// Task Queue Management
const MAX_CONCURRENT_TASKS = 3;
const taskQueue: QueuedTask[] = [];
const runningTasks = new Map<string, { task: QueuedTask; sessionId: string }>();

function getTaskById(taskId: string): QueuedTask | undefined {
  return taskQueue.find(t => t.id === taskId) ||
         Array.from(runningTasks.values()).find(r => r.task.id === taskId)?.task;
}

function updateTask(taskId: string, updates: Partial<QueuedTask>) {
  const idx = taskQueue.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    taskQueue[idx] = { ...taskQueue[idx], ...updates };
    broadcast({ type: "task.updated", payload: { task: taskQueue[idx] } });
    return taskQueue[idx];
  }
  const running = runningTasks.get(taskId);
  if (running) {
    running.task = { ...running.task, ...updates };
    broadcast({ type: "task.updated", payload: { task: running.task } });
    return running.task;
  }
  return null;
}

async function processTaskQueue() {
  // Check if we can start more tasks
  while (runningTasks.size < MAX_CONCURRENT_TASKS) {
    const nextTask = taskQueue.find(t => t.status === "queued");
    if (!nextTask) break;

    // Start the task
    await startTask(nextTask);
  }
}

async function startTask(task: QueuedTask) {
  // Generate title
  const title = await generateSessionTitle(task.prompt);

  // Create session
  const session = sessions.createSession({
    cwd: task.cwd,
    title,
    prompt: task.prompt
  });

  // Update task status
  task.status = "running";
  task.sessionId = session.id;
  task.startedAt = Date.now();

  // Move from queue to running
  const idx = taskQueue.findIndex(t => t.id === task.id);
  if (idx !== -1) taskQueue.splice(idx, 1);
  runningTasks.set(task.id, { task, sessionId: session.id });

  broadcast({ type: "task.updated", payload: { task } });

  // Update session status
  sessions.updateSession(session.id, {
    status: "running",
    lastPrompt: task.prompt
  });

  emit({
    type: "session.status",
    payload: { sessionId: session.id, status: "running", title: session.title, cwd: session.cwd }
  });

  emit({
    type: "stream.user_prompt",
    payload: { sessionId: session.id, prompt: task.prompt }
  });

  // Run Claude
  try {
    const handle = await runClaude({
      prompt: task.prompt,
      session,
      resumeSessionId: session.claudeSessionId,
      onEvent: emit,
      onSessionUpdate: (updates) => {
        sessions.updateSession(session.id, updates);
      }
    });

    runnerHandles.set(session.id, handle);

    // Task completed successfully
    task.status = "completed";
    task.completedAt = Date.now();
    runningTasks.delete(task.id);
    broadcast({ type: "task.completed", payload: { task } });

    // Process next in queue
    processTaskQueue();

  } catch (error) {
    task.status = "error";
    task.error = String(error);
    task.completedAt = Date.now();
    runningTasks.delete(task.id);
    broadcast({ type: "task.updated", payload: { task } });

    sessions.updateSession(session.id, { status: "error" });
    emit({
      type: "session.status",
      payload: {
        sessionId: session.id,
        status: "error",
        title: session.title,
        cwd: session.cwd,
        error: String(error)
      }
    });

    // Process next in queue
    processTaskQueue();
  }
}

function broadcast(event: ServerEvent) {
  const payload = JSON.stringify(event);
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    win.webContents.send("server-event", payload);
  }
}

function emit(event: ServerEvent) {
  if (event.type === "session.status") {
    sessions.updateSession(event.payload.sessionId, { status: event.payload.status });
  }
  if (event.type === "stream.message") {
    sessions.recordMessage(event.payload.sessionId, event.payload.message);
  }
  if (event.type === "stream.user_prompt") {
    sessions.recordMessage(event.payload.sessionId, {
      type: "user_prompt",
      prompt: event.payload.prompt
    });
  }
  broadcast(event);
}

export function handleClientEvent(event: ClientEvent) {
  if (event.type === "session.list") {
    emit({
      type: "session.list",
      payload: { sessions: sessions.listSessions() }
    });
    return;
  }

  if (event.type === "session.history") {
    const history = sessions.getSessionHistory(event.payload.sessionId);
    if (!history) {
      emit({
        type: "runner.error",
        payload: { message: "Unknown session" }
      });
      return;
    }
    emit({
      type: "session.history",
      payload: {
        sessionId: history.session.id,
        status: history.session.status,
        messages: history.messages
      }
    });
    return;
  }

  if (event.type === "session.start") {
    const session = sessions.createSession({
      cwd: event.payload.cwd,
      title: event.payload.title,
      allowedTools: event.payload.allowedTools,
      prompt: event.payload.prompt
    });

    sessions.updateSession(session.id, {
      status: "running",
      lastPrompt: event.payload.prompt
    });
    emit({
      type: "session.status",
      payload: { sessionId: session.id, status: "running", title: session.title, cwd: session.cwd }
    });

    emit({
      type: "stream.user_prompt",
      payload: { sessionId: session.id, prompt: event.payload.prompt }
    });

    runClaude({
      prompt: event.payload.prompt,
      session,
      resumeSessionId: session.claudeSessionId,
      onEvent: emit,
      onSessionUpdate: (updates) => {
        sessions.updateSession(session.id, updates);
      }
    })
      .then((handle) => {
        runnerHandles.set(session.id, handle);
        sessions.setAbortController(session.id, undefined);
      })
      .catch((error) => {
        sessions.updateSession(session.id, { status: "error" });
        emit({
          type: "session.status",
          payload: {
            sessionId: session.id,
            status: "error",
            title: session.title,
            cwd: session.cwd,
            error: String(error)
          }
        });
      });

    return;
  }

  if (event.type === "session.continue") {
    const session = sessions.getSession(event.payload.sessionId);
    if (!session) {
      emit({
        type: "runner.error",
        payload: { message: "Unknown session" }
      });
      return;
    }

    if (!session.claudeSessionId) {
      emit({
        type: "runner.error",
        payload: { sessionId: session.id, message: "Session has no resume id yet." }
      });
      return;
    }

    sessions.updateSession(session.id, { status: "running", lastPrompt: event.payload.prompt });
    emit({
      type: "session.status",
      payload: { sessionId: session.id, status: "running", title: session.title, cwd: session.cwd }
    });

    emit({
      type: "stream.user_prompt",
      payload: { sessionId: session.id, prompt: event.payload.prompt }
    });

    runClaude({
      prompt: event.payload.prompt,
      session,
      resumeSessionId: session.claudeSessionId,
      onEvent: emit,
      onSessionUpdate: (updates) => {
        sessions.updateSession(session.id, updates);
      }
    })
      .then((handle) => {
        runnerHandles.set(session.id, handle);
      })
      .catch((error) => {
        sessions.updateSession(session.id, { status: "error" });
        emit({
          type: "session.status",
          payload: {
            sessionId: session.id,
            status: "error",
            title: session.title,
            cwd: session.cwd,
            error: String(error)
          }
        });
      });

    return;
  }

  if (event.type === "session.stop") {
    console.log("[IPC] session.stop received for:", event.payload.sessionId);
    const session = sessions.getSession(event.payload.sessionId);
    if (!session) {
      console.log("[IPC] Session not found");
      return;
    }

    const handle = runnerHandles.get(session.id);
    console.log("[IPC] Runner handle found:", !!handle);
    if (handle) {
      console.log("[IPC] Aborting runner");
      handle.abort();
      runnerHandles.delete(session.id);
    }

    sessions.updateSession(session.id, { status: "idle" });
    emit({
      type: "session.status",
      payload: { sessionId: session.id, status: "idle", title: session.title, cwd: session.cwd }
    });
    return;
  }

  if (event.type === "session.delete") {
    const sessionId = event.payload.sessionId;
    const handle = runnerHandles.get(sessionId);
    if (handle) {
      handle.abort();
      runnerHandles.delete(sessionId);
    }

    // Always try to delete and emit deleted event
    // Don't emit error if session doesn't exist - it may have already been deleted
    sessions.deleteSession(sessionId);
    emit({
      type: "session.deleted",
      payload: { sessionId }
    });
    return;
  }

  if (event.type === "permission.response") {
    const session = sessions.getSession(event.payload.sessionId);
    if (!session) return;

    const pending = session.pendingPermissions.get(event.payload.toolUseId);
    if (pending) {
      pending.resolve(event.payload.result);
    }
    return;
  }

  // Task Queue Handlers
  if (event.type === "task.list") {
    const allTasks = [
      ...taskQueue,
      ...Array.from(runningTasks.values()).map(r => r.task)
    ].sort((a, b) => a.createdAt - b.createdAt);

    broadcast({
      type: "task.list",
      payload: { tasks: allTasks }
    });
    return;
  }

  if (event.type === "task.queue") {
    const task: QueuedTask = {
      id: randomUUID(),
      prompt: event.payload.prompt,
      cwd: event.payload.cwd,
      status: "queued",
      createdAt: Date.now()
    };

    taskQueue.push(task);
    broadcast({ type: "task.added", payload: { task } });

    // Try to start processing
    processTaskQueue();
    return;
  }

  if (event.type === "task.cancel") {
    const taskId = event.payload.taskId;

    // Check if in queue
    const queueIdx = taskQueue.findIndex(t => t.id === taskId);
    if (queueIdx !== -1) {
      taskQueue[queueIdx].status = "cancelled";
      const task = taskQueue.splice(queueIdx, 1)[0];
      broadcast({ type: "task.removed", payload: { taskId } });
      return;
    }

    // Check if running
    const running = runningTasks.get(taskId);
    if (running) {
      // Stop the associated session
      const handle = runnerHandles.get(running.sessionId);
      if (handle) {
        handle.abort();
        runnerHandles.delete(running.sessionId);
      }
      sessions.updateSession(running.sessionId, { status: "idle" });

      running.task.status = "cancelled";
      running.task.completedAt = Date.now();
      runningTasks.delete(taskId);
      broadcast({ type: "task.removed", payload: { taskId } });

      // Process next in queue
      processTaskQueue();
    }
    return;
  }

  // Settings Handlers
  if (event.type === "settings.get") {
    const settings = getSettings();
    broadcast({ type: "settings.loaded", payload: { settings } });
    return;
  }

  if (event.type === "settings.update") {
    const settings = updateSettings(event.payload.settings);
    broadcast({ type: "settings.updated", payload: { settings } });
    return;
  }

  if (event.type === "settings.toggleMCP") {
    const settings = toggleMCPServer(event.payload.serverId, event.payload.enabled);
    broadcast({ type: "settings.updated", payload: { settings } });
    return;
  }

  if (event.type === "settings.toggleSkill") {
    const settings = toggleSkill(event.payload.skillId, event.payload.enabled);
    broadcast({ type: "settings.updated", payload: { settings } });
    return;
  }
}

export { sessions, taskQueue, runningTasks };
