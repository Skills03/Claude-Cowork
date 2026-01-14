import { useState, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import type { MCPServer, SkillInfo } from "../types";

type SettingsTab = "connectors" | "skills" | "preferences";

export function SettingsModal() {
  const { settings, showSettingsModal, setShowSettingsModal } = useAppStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("connectors");

  // Request settings when modal opens
  useEffect(() => {
    if (showSettingsModal && !settings) {
      window.electron.sendClientEvent({ type: "settings.get" });
    }
  }, [showSettingsModal, settings]);

  if (!showSettingsModal) return null;

  const handleToggleMCP = (serverId: string, enabled: boolean) => {
    window.electron.sendClientEvent({
      type: "settings.toggleMCP",
      payload: { serverId, enabled }
    });
  };

  const handleToggleSkill = (skillId: string, enabled: boolean) => {
    window.electron.sendClientEvent({
      type: "settings.toggleSkill",
      payload: { skillId, enabled }
    });
  };

  const handleUpdatePreferences = (updates: Partial<NonNullable<typeof settings>["preferences"]>) => {
    if (!settings) return;
    window.electron.sendClientEvent({
      type: "settings.update",
      payload: {
        settings: {
          preferences: { ...settings.preferences, ...updates }
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-700">
          {[
            { id: "connectors" as const, label: "Connectors", icon: "🔌" },
            { id: "skills" as const, label: "Skills", icon: "⚡" },
            { id: "preferences" as const, label: "Preferences", icon: "⚙️" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-orange-400 border-b-2 border-orange-400 bg-zinc-800/50"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {!settings ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : (
            <>
              {activeTab === "connectors" && (
                <ConnectorsTab servers={settings.mcpServers} onToggle={handleToggleMCP} />
              )}
              {activeTab === "skills" && (
                <SkillsTab skills={settings.skills} onToggle={handleToggleSkill} />
              )}
              {activeTab === "preferences" && (
                <PreferencesTab
                  preferences={settings.preferences}
                  onUpdate={handleUpdatePreferences}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectorsTab({
  servers,
  onToggle
}: {
  servers: MCPServer[];
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const builtIn = servers.filter(s => s.builtIn);
  const external = servers.filter(s => !s.builtIn);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Built-in Connectors</h3>
        <div className="space-y-2">
          {builtIn.map(server => (
            <ServerCard key={server.id} server={server} onToggle={onToggle} />
          ))}
        </div>
      </div>

      {external.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-300 mb-3">External Connectors</h3>
          <div className="space-y-2">
            {external.map(server => (
              <ServerCard key={server.id} server={server} onToggle={onToggle} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <p className="text-sm text-zinc-400">
          <span className="text-zinc-300 font-medium">Tip:</span> Add more connectors by editing{" "}
          <code className="text-orange-400 bg-zinc-800 px-1.5 py-0.5 rounded">~/.claude/settings.json</code>
        </p>
      </div>
    </div>
  );
}

function ServerCard({
  server,
  onToggle
}: {
  server: MCPServer;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          server.enabled ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-500"
        }`}>
          {server.name === "Filesystem" && "📁"}
          {server.name === "Web Fetch" && "🌐"}
          {server.name === "Memory" && "🧠"}
          {!["Filesystem", "Web Fetch", "Memory"].includes(server.name) && "🔌"}
        </div>
        <div>
          <h4 className="text-sm font-medium text-white">{server.name}</h4>
          <p className="text-xs text-zinc-400">{server.description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={server.enabled}
          onChange={(e) => onToggle(server.id, e.target.checked)}
        />
        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
      </label>
    </div>
  );
}

function SkillsTab({
  skills,
  onToggle
}: {
  skills: SkillInfo[];
  onToggle: (id: string, enabled: boolean) => void;
}) {
  if (skills.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">⚡</div>
        <h3 className="text-lg font-medium text-white mb-2">No Skills Found</h3>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto">
          Skills extend Claude's capabilities. Add skills to{" "}
          <code className="text-orange-400 bg-zinc-800 px-1.5 py-0.5 rounded">~/.claude/skills/</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {skills.map(skill => (
        <div
          key={skill.id}
          className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
              skill.enabled ? "bg-purple-500/20 text-purple-400" : "bg-zinc-700 text-zinc-500"
            }`}>
              ⚡
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">{skill.name}</h4>
              <p className="text-xs text-zinc-400 line-clamp-1">{skill.description}</p>
              {skill.triggers && skill.triggers.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {skill.triggers.slice(0, 3).map((trigger, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-400 rounded"
                    >
                      {trigger}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={skill.enabled}
              onChange={(e) => onToggle(skill.id, e.target.checked)}
            />
            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
          </label>
        </div>
      ))}
    </div>
  );
}

function PreferencesTab({
  preferences,
  onUpdate
}: {
  preferences: NonNullable<ReturnType<typeof useAppStore.getState>["settings"]>["preferences"];
  onUpdate: (updates: Partial<typeof preferences>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Max Concurrent Tasks */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Max Concurrent Tasks
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="5"
            value={preferences.maxConcurrentTasks}
            onChange={(e) => onUpdate({ maxConcurrentTasks: parseInt(e.target.value) })}
            className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <span className="text-lg font-medium text-white w-8 text-center">
            {preferences.maxConcurrentTasks}
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Number of tasks that can run simultaneously
        </p>
      </div>

      {/* Auto Start Tasks */}
      <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700">
        <div>
          <h4 className="text-sm font-medium text-white">Auto-start Tasks</h4>
          <p className="text-xs text-zinc-400">Automatically start queued tasks</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={preferences.autoStartTasks}
            onChange={(e) => onUpdate({ autoStartTasks: e.target.checked })}
          />
          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
        </label>
      </div>

      {/* Show Notifications */}
      <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700">
        <div>
          <h4 className="text-sm font-medium text-white">Show Notifications</h4>
          <p className="text-xs text-zinc-400">Toast notifications for task completion</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={preferences.showNotifications}
            onChange={(e) => onUpdate({ showNotifications: e.target.checked })}
          />
          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
        </label>
      </div>

      {/* Default Working Directory */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Default Working Directory
        </label>
        <input
          type="text"
          value={preferences.defaultCwd || ""}
          onChange={(e) => onUpdate({ defaultCwd: e.target.value || undefined })}
          placeholder="Leave empty to use current directory"
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
        />
      </div>
    </div>
  );
}
