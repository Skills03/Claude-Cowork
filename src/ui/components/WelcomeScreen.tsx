import { useState } from "react";

interface WelcomeScreenProps {
  onStart: (cwd: string, prompt: string) => void;
}

const QUICK_TASKS = [
  {
    icon: "📁",
    title: "Organize files",
    description: "Sort and rename files in a folder",
    prompt: "Help me organize the files in this folder. Sort them by type and rename them with clear, consistent names."
  },
  {
    icon: "📝",
    title: "Write a document",
    description: "Create reports, summaries, or notes",
    prompt: "Help me write a document. I'll describe what I need and you can create it for me."
  },
  {
    icon: "📊",
    title: "Analyze data",
    description: "Process spreadsheets or data files",
    prompt: "Help me analyze the data files in this folder. Summarize the key findings and create a report."
  },
  {
    icon: "🔍",
    title: "Research & summarize",
    description: "Gather info from multiple files",
    prompt: "Help me research and summarize information from the files in this folder."
  }
];

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [cwd, setCwd] = useState("");
  const [prompt, setPrompt] = useState("");
  const [step, setStep] = useState<"folder" | "task">("folder");

  const handleSelectDirectory = async () => {
    const result = await window.electron.selectDirectory();
    if (result) {
      setCwd(result);
      setStep("task");
    }
  };

  const handleQuickTask = (taskPrompt: string) => {
    setPrompt(taskPrompt);
  };

  const handleStart = () => {
    if (cwd && prompt) {
      onStart(cwd, prompt);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-surface-cream">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <h1 className="text-2xl font-semibold text-ink-800 mb-2">
            Welcome to Cowork
          </h1>
          <p className="text-muted max-w-md mx-auto">
            Give Claude access to a folder and describe what you'd like help with. Claude will make a plan and work through it with you.
          </p>
        </div>

        {/* Step 1: Select Folder */}
        <div className={`mb-6 transition-opacity ${step === "task" ? "opacity-60" : ""}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${cwd ? "bg-success text-white" : "bg-accent text-white"}`}>
              {cwd ? "✓" : "1"}
            </div>
            <span className="text-sm font-medium text-ink-700">Choose a folder</span>
          </div>

          <button
            onClick={handleSelectDirectory}
            className="w-full rounded-2xl border-2 border-dashed border-ink-900/20 bg-surface hover:bg-surface-tertiary hover:border-accent/40 transition-all p-6 text-center group"
          >
            {cwd ? (
              <div className="flex items-center justify-center gap-3">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <div className="text-left">
                  <div className="text-sm font-medium text-ink-800">{cwd.split(/[\\/]/).pop()}</div>
                  <div className="text-xs text-muted truncate max-w-[300px]">{cwd}</div>
                </div>
                <span className="text-xs text-accent ml-auto">Change</span>
              </div>
            ) : (
              <div>
                <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-ink-400 group-hover:text-accent transition-colors mb-2" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  <path d="M12 11v6M9 14h6" />
                </svg>
                <div className="text-sm font-medium text-ink-700 group-hover:text-ink-800">
                  Click to select a folder
                </div>
                <div className="text-xs text-muted mt-1">
                  Claude will be able to read and edit files in this folder
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Step 2: Describe Task */}
        {step === "task" && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${prompt ? "bg-success text-white" : "bg-accent text-white"}`}>
                {prompt ? "✓" : "2"}
              </div>
              <span className="text-sm font-medium text-ink-700">What would you like help with?</span>
            </div>

            {/* Quick Tasks */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {QUICK_TASKS.map((task) => (
                <button
                  key={task.title}
                  onClick={() => handleQuickTask(task.prompt)}
                  className={`p-4 rounded-xl border text-left transition-all hover:shadow-sm ${
                    prompt === task.prompt
                      ? "border-accent bg-accent/5"
                      : "border-ink-900/10 bg-surface hover:border-ink-900/20"
                  }`}
                >
                  <span className="text-xl mb-2 block">{task.icon}</span>
                  <div className="text-sm font-medium text-ink-800">{task.title}</div>
                  <div className="text-xs text-muted mt-0.5">{task.description}</div>
                </button>
              ))}
            </div>

            {/* Custom Prompt */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Or describe your task in your own words..."
                rows={3}
                className="w-full rounded-xl border border-ink-900/10 bg-surface p-4 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
              />
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={!prompt.trim()}
              className="w-full mt-4 rounded-xl bg-accent px-6 py-3.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Working
            </button>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 rounded-xl bg-surface border border-ink-900/5">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <div className="text-sm font-medium text-ink-700">Tips for best results</div>
              <ul className="text-xs text-muted mt-1 space-y-1">
                <li>• Be specific about what you want Claude to do</li>
                <li>• Claude will ask for permission before making changes</li>
                <li>• You can give feedback as Claude works</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
