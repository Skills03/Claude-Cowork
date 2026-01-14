import type { ToastNotification } from "../store/useAppStore";

interface ToastNotificationsProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  onViewSession?: (sessionId: string) => void;
}

function getTypeStyles(type: ToastNotification["type"]): {
  bg: string;
  border: string;
  icon: string;
  iconColor: string;
} {
  switch (type) {
    case "success":
      return {
        bg: "bg-success-light",
        border: "border-success/20",
        icon: "✅",
        iconColor: "text-success"
      };
    case "error":
      return {
        bg: "bg-error-light",
        border: "border-error/20",
        icon: "❌",
        iconColor: "text-error"
      };
    case "info":
    default:
      return {
        bg: "bg-info-light",
        border: "border-info/20",
        icon: "ℹ️",
        iconColor: "text-info"
      };
  }
}

function ToastItem({
  notification,
  onDismiss,
  onViewSession
}: {
  notification: ToastNotification;
  onDismiss: () => void;
  onViewSession?: (sessionId: string) => void;
}) {
  const styles = getTypeStyles(notification.type);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${styles.bg} ${styles.border} shadow-lg animate-fadeIn`}
    >
      <span className={`text-lg ${styles.iconColor}`}>{styles.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-800">{notification.title}</div>
        {notification.message && (
          <div className="text-xs text-muted mt-0.5 truncate">{notification.message}</div>
        )}
        {notification.sessionId && onViewSession && (
          <button
            onClick={() => onViewSession(notification.sessionId!)}
            className="text-xs text-accent hover:text-accent-hover mt-1"
          >
            View task →
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="p-1 text-muted hover:text-ink-700 rounded-full hover:bg-ink-900/10 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastNotifications({
  notifications,
  onDismiss,
  onViewSession
}: ToastNotificationsProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
      {notifications.map(notification => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
          onViewSession={onViewSession}
        />
      ))}
    </div>
  );
}
