"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import Link from "next/link";

type ToastType = "success" | "error" | "info";

interface ToastAction {
  label: string;
  href: string;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

let toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(
  message: string,
  type: ToastType = "info",
  action?: ToastAction
) {
  const toast: Toast = {
    id: Math.random().toString(36).slice(2),
    message,
    type,
    action,
  };
  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />,
    info: <Info className="h-4 w-4 text-blue-500 shrink-0" />,
  };

  const bgColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${bgColors[toast.type]} animate-in slide-in-from-right`}
          role="status"
        >
          {icons[toast.type]}
          <span className="text-sm text-surface-700 flex-1">{toast.message}</span>
          {toast.action && (
            <Link
              href={toast.action.href}
              className="text-sm font-medium text-primary hover:text-primary-700 underline whitespace-nowrap"
            >
              {toast.action.label}
            </Link>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 p-1 hover:bg-surface-100 rounded shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="h-3 w-3 text-surface-400" />
          </button>
        </div>
      ))}
    </div>
  );
}
