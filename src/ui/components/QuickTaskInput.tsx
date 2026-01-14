import { useState, useRef, useEffect } from "react";

interface QuickTaskInputProps {
  currentCwd: string;
  onQueueTask: (prompt: string, cwd: string) => void;
  onChangeCwd: () => void;
  disabled?: boolean;
}

export function QuickTaskInput({
  currentCwd,
  onQueueTask,
  onChangeCwd,
  disabled = false
}: QuickTaskInputProps) {
  const [prompt, setPrompt] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!prompt.trim() || !currentCwd) return;
    onQueueTask(prompt.trim(), currentCwd);
    setPrompt("");
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setIsExpanded(false);
      setPrompt("");
    }
  };

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const folderName = currentCwd?.split(/[\\/]/).pop() || "Select folder";

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 bg-accent text-white rounded-full shadow-lg hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed z-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-sm font-medium">Add Task</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-surface rounded-2xl shadow-elevated border border-ink-900/10 z-50 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-900/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="text-sm font-medium text-ink-800">New Task</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(false);
            setPrompt("");
          }}
          className="p-2 text-muted hover:text-ink-700 rounded-full hover:bg-surface-tertiary transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Folder selector */}
        <button
          onClick={onChangeCwd}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-ink-900/10 bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
        >
          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-sm text-ink-700 truncate flex-1">{folderName}</span>
          <span className="text-xs text-muted">Change</span>
        </button>

        {/* Task input */}
        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want Claude to do..."
          rows={3}
          className="w-full rounded-xl border border-ink-900/10 bg-surface p-3 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
        />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-muted">
            Press Enter to add • Shift+Enter for new line
          </div>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || !currentCwd}
            className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Queue
          </button>
        </div>
      </div>
    </div>
  );
}
