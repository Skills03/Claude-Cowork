import { useState, useMemo, type ReactNode } from "react";
import { diffLines, type Change } from "diff";

interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  fileName?: string;
  replaceAll?: boolean;
  defaultCollapsed?: boolean;
}

interface DiffStats {
  additions: number;
  deletions: number;
}

function computeDiffStats(changes: Change[]): DiffStats {
  let additions = 0;
  let deletions = 0;

  for (const change of changes) {
    const lines = change.value.split("\n").filter(l => l !== "");
    if (change.added) {
      additions += lines.length;
    } else if (change.removed) {
      deletions += lines.length;
    }
  }

  return { additions, deletions };
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    css: "css",
    scss: "scss",
    html: "html",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sql: "sql",
    sh: "bash",
    bash: "bash",
  };
  return langMap[ext] ?? "plaintext";
}

const COLLAPSE_THRESHOLD = 20;

export function DiffViewer({
  oldValue,
  newValue,
  fileName,
  replaceAll = false,
  defaultCollapsed
}: DiffViewerProps) {
  const changes = useMemo(() => diffLines(oldValue, newValue), [oldValue, newValue]);
  const stats = useMemo(() => computeDiffStats(changes), [changes]);
  const totalLines = stats.additions + stats.deletions;

  const shouldDefaultCollapse = defaultCollapsed ?? totalLines > COLLAPSE_THRESHOLD;
  const [isCollapsed, setIsCollapsed] = useState(shouldDefaultCollapse);

  // Generate line numbers for the diff
  const renderDiff = () => {
    const lines: ReactNode[] = [];
    let lineNum = 1;

    for (const change of changes) {
      const changeLines = change.value.split("\n");
      // Remove empty last line from split
      if (changeLines[changeLines.length - 1] === "") {
        changeLines.pop();
      }

      for (const line of changeLines) {
        if (change.added) {
          lines.push(
            <div key={`add-${lineNum}-${lines.length}`} className="diff-line diff-added">
              <span className="diff-gutter diff-gutter-add">+</span>
              <span className="diff-content">{line || " "}</span>
            </div>
          );
        } else if (change.removed) {
          lines.push(
            <div key={`rem-${lineNum}-${lines.length}`} className="diff-line diff-removed">
              <span className="diff-gutter diff-gutter-remove">-</span>
              <span className="diff-content">{line || " "}</span>
            </div>
          );
        } else {
          lines.push(
            <div key={`ctx-${lineNum}-${lines.length}`} className="diff-line diff-context">
              <span className="diff-gutter"> </span>
              <span className="diff-content">{line || " "}</span>
            </div>
          );
        }
        lineNum++;
      }
    }

    return lines;
  };

  if (!oldValue && !newValue) {
    return null;
  }

  return (
    <div className="diff-viewer mt-2">
      {/* Header */}
      <div className="diff-header">
        <span className="diff-title">Changes</span>
        <div className="diff-stats">
          {stats.additions > 0 && (
            <span className="diff-stat diff-stat-add">+{stats.additions}</span>
          )}
          {stats.deletions > 0 && (
            <span className="diff-stat diff-stat-remove">-{stats.deletions}</span>
          )}
        </div>
      </div>

      {/* Replace all note */}
      {replaceAll && (
        <div className="diff-note">
          Replaced all occurrences in file
        </div>
      )}

      {/* Diff content */}
      {!isCollapsed && (
        <div className="diff-body">
          <pre className="diff-pre">
            <code className={`language-${fileName ? getLanguageFromFileName(fileName) : "plaintext"}`}>
              {renderDiff()}
            </code>
          </pre>
        </div>
      )}

      {/* Collapse toggle */}
      {totalLines > 3 && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="diff-toggle"
        >
          <span>{isCollapsed ? "▼" : "▲"}</span>
          <span>{isCollapsed ? `Show ${totalLines} lines` : "Collapse"}</span>
        </button>
      )}
    </div>
  );
}

export default DiffViewer;
