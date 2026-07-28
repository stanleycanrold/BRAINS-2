"use client";

import * as React from "react";
import { XIcon, CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/**
 * Design system §3.8.
 *
 * Reversible, low-consequence confirmations only ("Draft saved", "Response
 * logged"). Bottom-right, 4s auto-dismiss, manually dismissible.
 *
 * Explicitly NEVER used for the decision-gate outcome - that gets a full page,
 * not something that can be missed.
 */

type ToastTone = "default" | "success" | "danger";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    (message: string, tone: ToastTone = "default") => {
      const id = nextId++;
      setItems((prev) => [...prev, { id, message, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4000),
      );
    },
    [dismiss],
  );

  React.useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(360px,calc(100vw-32px))] flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "animate-rise pointer-events-auto flex items-start gap-2.5 rounded-[8px] border border-line",
              "bg-raised px-4 py-3 shadow-[var(--shadow-overlay)]",
            )}
          >
            {item.tone === "success" ? (
              <CheckCircleIcon
                size={20}
                className="mt-px shrink-0 text-success"
                aria-hidden="true"
              />
            ) : item.tone === "danger" ? (
              <WarningCircleIcon
                size={20}
                className="mt-px shrink-0 text-danger"
                aria-hidden="true"
              />
            ) : null}
            <p className="type-body-m flex-1 text-primary">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="-m-1 shrink-0 rounded p-1 text-tertiary transition-colors duration-[120ms] hover:text-primary"
            >
              <XIcon size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
