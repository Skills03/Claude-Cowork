import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import { useIPC } from "./hooks/useIPC";
import { useAppStore } from "./store/useAppStore";
import type { ServerEvent } from "./types";
import { Sidebar } from "./components/Sidebar";
import { StartSessionModal } from "./components/StartSessionModal";
import { PromptInput, usePromptActions } from "./components/PromptInput";
import { MessageCard } from "./components/EventCard";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ProgressPanel } from "./components/ProgressPanel";
import { TaskQueuePanel } from "./components/TaskQueuePanel";
import { QuickTaskInput } from "./components/QuickTaskInput";
import { ToastNotifications } from "./components/ToastNotifications";
import { SettingsModal } from "./components/SettingsModal";
import MDContent from "./render/markdown";

function App() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const partialMessageRef = useRef("");
  const [partialMessage, setPartialMessage] = useState("");
  const [showPartialMessage, setShowPartialMessage] = useState(false);

  const sessions = useAppStore((s) => s.sessions);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const showStartModal = useAppStore((s) => s.showStartModal);
  const setShowStartModal = useAppStore((s) => s.setShowStartModal);
  const globalError = useAppStore((s) => s.globalError);
  const setGlobalError = useAppStore((s) => s.setGlobalError);
  const historyRequested = useAppStore((s) => s.historyRequested);
  const markHistoryRequested = useAppStore((s) => s.markHistoryRequested);
  const resolvePermissionRequest = useAppStore((s) => s.resolvePermissionRequest);
  const handleServerEvent = useAppStore((s) => s.handleServerEvent);
  const prompt = useAppStore((s) => s.prompt);
  const setPrompt = useAppStore((s) => s.setPrompt);
  const cwd = useAppStore((s) => s.cwd);
  const setCwd = useAppStore((s) => s.setCwd);
  const pendingStart = useAppStore((s) => s.pendingStart);

  // Task Queue State
  const taskQueue = useAppStore((s) => s.taskQueue);
  const notifications = useAppStore((s) => s.notifications);
  const dismissNotification = useAppStore((s) => s.dismissNotification);

  // Helper function to extract partial message content
  const getPartialMessageContent = (eventMessage: any) => {
    try {
      const realType = eventMessage.delta.type.split("_")[0];
      return eventMessage.delta[realType];
    } catch (error) {
      console.error(error);
      return "";
    }
  };

  // Handle partial messages from stream events
  const handlePartialMessages = useCallback((partialEvent: ServerEvent) => {
    if (partialEvent.type !== "stream.message" || partialEvent.payload.message.type !== "stream_event") return;

    const message = partialEvent.payload.message as any;
    if (message.event.type === "content_block_start") {
      partialMessageRef.current = "";
      setPartialMessage(partialMessageRef.current);
      setShowPartialMessage(true);
    }

    if (message.event.type === "content_block_delta") {
      partialMessageRef.current += getPartialMessageContent(message.event) || "";
      setPartialMessage(partialMessageRef.current);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    if (message.event.type === "content_block_stop") {
      setShowPartialMessage(false);
      setTimeout(() => {
        partialMessageRef.current = "";
        setPartialMessage(partialMessageRef.current);
      }, 500);
    }
  }, []);

  // Combined event handler
  const onEvent = useCallback((event: ServerEvent) => {
    handleServerEvent(event);
    handlePartialMessages(event);
  }, [handleServerEvent, handlePartialMessages]);

  const { connected, sendEvent } = useIPC(onEvent);
  const { handleStartFromModal } = usePromptActions(sendEvent);

  const activeSession = activeSessionId ? sessions[activeSessionId] : undefined;
  const messages = activeSession?.messages ?? [];
  const permissionRequests = activeSession?.permissionRequests ?? [];
  const writeBeforeContent = activeSession?.writeBeforeContent ?? {};
  const isRunning = activeSession?.status === "running";

  // Check if we should show welcome screen (no sessions at all)
  const sessionList = useMemo(() => Object.values(sessions), [sessions]);
  const showWelcome = sessionList.length === 0 && !activeSessionId && !showStartModal;

  useEffect(() => {
    if (connected) {
      sendEvent({ type: "session.list" });
      sendEvent({ type: "task.list" });
      sendEvent({ type: "settings.get" });
    }
  }, [connected, sendEvent]);

  useEffect(() => {
    if (!activeSessionId || !connected) return;
    const session = sessions[activeSessionId];
    if (session && !session.hydrated && !historyRequested.has(activeSessionId)) {
      markHistoryRequested(activeSessionId);
      sendEvent({ type: "session.history", payload: { sessionId: activeSessionId } });
    }
  }, [activeSessionId, connected, sessions, historyRequested, markHistoryRequested, sendEvent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partialMessage]);

  const handleNewSession = useCallback(() => {
    useAppStore.getState().setActiveSessionId(null);
    setShowStartModal(true);
  }, [setShowStartModal]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    sendEvent({ type: "session.delete", payload: { sessionId } });
  }, [sendEvent]);

  const handlePermissionResult = useCallback((toolUseId: string, result: PermissionResult) => {
    if (!activeSessionId) return;
    sendEvent({ type: "permission.response", payload: { sessionId: activeSessionId, toolUseId, result } });
    resolvePermissionRequest(activeSessionId, toolUseId);
  }, [activeSessionId, sendEvent, resolvePermissionRequest]);

  // Handler for WelcomeScreen start
  const handleWelcomeStart = useCallback((welcomeCwd: string, welcomePrompt: string) => {
    setCwd(welcomeCwd);
    setPrompt(welcomePrompt);
    // Trigger the start
    setTimeout(() => {
      handleStartFromModal();
    }, 100);
  }, [setCwd, setPrompt, handleStartFromModal]);

  // Task Queue Handlers
  const handleQueueTask = useCallback((taskPrompt: string, taskCwd: string) => {
    sendEvent({ type: "task.queue", payload: { prompt: taskPrompt, cwd: taskCwd } });
  }, [sendEvent]);

  const handleCancelTask = useCallback((taskId: string) => {
    sendEvent({ type: "task.cancel", payload: { taskId } });
  }, [sendEvent]);

  const handleViewTaskSession = useCallback((sessionId: string) => {
    useAppStore.getState().setActiveSessionId(sessionId);
  }, []);

  const handleSelectDirectory = useCallback(async () => {
    const result = await window.electron.selectDirectory();
    if (result) setCwd(result);
  }, [setCwd]);

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar
        connected={connected}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main content area */}
      <div className="flex flex-1 ml-[280px]">
        {showWelcome ? (
          /* Welcome Screen for new users */
          <WelcomeScreen onStart={handleWelcomeStart} />
        ) : (
          /* Regular session view */
          <>
            <main className="flex flex-1 flex-col bg-surface-cream">
              <div
                className="flex items-center justify-center h-12 border-b border-ink-900/10 bg-surface-cream select-none"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
              >
                <span className="text-sm font-medium text-ink-700">{activeSession?.title || "Cowork"}</span>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pb-40 pt-6">
                <div className="mx-auto max-w-3xl">
                  {messages.length === 0 && activeSession ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                        <span className="text-2xl">💬</span>
                      </div>
                      <div className="text-lg font-medium text-ink-700">Ready to help</div>
                      <p className="mt-2 text-sm text-muted max-w-sm">
                        Claude is ready to work on your task. You can add more context or instructions below.
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="text-lg font-medium text-ink-700">Select a task</div>
                      <p className="mt-2 text-sm text-muted">Choose a task from the sidebar or create a new one</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <MessageCard
                        key={idx}
                        message={msg}
                        isLast={idx === messages.length - 1}
                        isRunning={isRunning}
                        permissionRequest={permissionRequests[0]}
                        onPermissionResult={handlePermissionResult}
                        writeBeforeContent={writeBeforeContent}
                      />
                    ))
                  )}

                  {/* Partial message display with skeleton loading */}
                  <div className="partial-message">
                    <MDContent text={partialMessage} />
                    {showPartialMessage && (
                      <div className="mt-3 flex flex-col gap-2 px-1">
                        <div className="relative h-3 w-2/12 overflow-hidden rounded-full bg-ink-900/10">
                          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-900/30 to-transparent animate-shimmer" />
                        </div>
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-ink-900/10">
                          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-900/30 to-transparent animate-shimmer" />
                        </div>
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-ink-900/10">
                          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-900/30 to-transparent animate-shimmer" />
                        </div>
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-ink-900/10">
                          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-900/30 to-transparent animate-shimmer" />
                        </div>
                        <div className="relative h-3 w-4/12 overflow-hidden rounded-full bg-ink-900/10">
                          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-900/30 to-transparent animate-shimmer" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <PromptInput sendEvent={sendEvent} />
            </main>

            {/* Progress Panel - shows on right side when there's an active session with messages */}
            {activeSession && messages.length > 0 && (
              <ProgressPanel
                messages={messages}
                isRunning={isRunning}
                cwd={activeSession.cwd}
              />
            )}
          </>
        )}
      </div>

      {showStartModal && (
        <StartSessionModal
          cwd={cwd}
          prompt={prompt}
          pendingStart={pendingStart}
          onCwdChange={setCwd}
          onPromptChange={setPrompt}
          onStart={handleStartFromModal}
          onClose={() => setShowStartModal(false)}
        />
      )}

      {globalError && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-error/20 bg-error-light px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm text-error">{globalError}</span>
            <button className="text-error hover:text-error/80" onClick={() => setGlobalError(null)}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Task Queue Components */}
      <ToastNotifications
        notifications={notifications}
        onDismiss={dismissNotification}
        onViewSession={handleViewTaskSession}
      />

      {taskQueue.length > 0 && (
        <TaskQueuePanel
          tasks={taskQueue}
          onCancelTask={handleCancelTask}
          onViewTask={handleViewTaskSession}
        />
      )}

      {/* Quick Add Task Button - only show when we have a folder selected and not on welcome screen */}
      {!showWelcome && cwd && (
        <QuickTaskInput
          currentCwd={cwd}
          onQueueTask={handleQueueTask}
          onChangeCwd={handleSelectDirectory}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}

export default App;
