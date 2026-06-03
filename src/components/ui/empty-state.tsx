import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-4">
        {icon || <Inbox className="h-6 w-6 text-surface-500" />}
      </div>
      <h3 className="font-heading text-lg font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-surface-500 text-sm mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

interface ToastProps {
  type: "success" | "error" | "info";
  message: string;
  className?: string;
}

function Toast({ type, message, className }: ToastProps) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    error: <AlertCircle className="h-4 w-4 text-destructive" />,
    info: <AlertCircle className="h-4 w-4 text-accent" />,
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-destructive-50 border-destructive-100",
    info: "bg-accent-50 border-accent-200",
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 z-50",
        "flex items-center gap-2 p-3 rounded-lg border shadow-elevated",
        bgColors[type],
        className
      )}
      role="alert"
    >
      {icons[type]}
      <span className="text-sm text-surface-700">{message}</span>
    </div>
  );
}

export { EmptyState, Toast };
