import { useEffect } from "react";
import { CheckCircle2, X, AlertCircle, Info, Sparkles, HeartHandshake } from "lucide-react";
import { ToastMessage } from "../types";

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === "success" || !toast.type;
  const isWarning = toast.type === "warning";

  return (
    <div
      id={`toast-${toast.id}`}
      data-testid="claim-toast"
      className="pointer-events-auto w-full bg-white rounded-2xl shadow-xl border border-emerald-200 p-4 flex items-start gap-3 transform transition-all duration-300 ease-out animate-in slide-in-from-top-4 sm:slide-in-from-right-6 ring-1 ring-black/5"
    >
      {/* Icon badge */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
          isSuccess
            ? "bg-emerald-600 text-white shadow-emerald-600/30"
            : isWarning
            ? "bg-amber-500 text-white shadow-amber-500/30"
            : "bg-teal-600 text-white shadow-teal-600/30"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : isWarning ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <HeartHandshake className="w-5 h-5" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
            {toast.title}
          </h4>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Live
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        type="button"
        id={`toast-close-${toast.id}`}
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
        title="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
