"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Loader2, Check, X, AlertTriangle, Inbox } from "lucide-react";

/* ============================================================
 * ALDIRXON Dashboard — UI kit مشترك
 * • ToastProvider/useToast — إشعار واضح بعد كل عملية
 * • confirmDanger — تأكيد قبل العمليات الخطرة (Promise)
 * • Spinner / StatCard / EmptyCard / ErrorCard
 * ============================================================ */

export const STATUS_AR: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

export const STATUS_STYLE: Record<string, string> = {
  pending: "bg-paper text-graphite ring-1 ring-mist",
  confirmed: "bg-emerald-50 text-emerald-700",
  processing: "bg-paper text-graphite ring-1 ring-mist",
  shipped: "bg-paper text-ink ring-1 ring-silver",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-mist text-steel",
};

export const PAYMENT_AR: Record<string, string> = {
  cod: "عند الاستلام",
  bank_transfer: "تحويل بنكي",
};

export const DELIVERY_AR: Record<string, string> = {
  standard: "عادي · مجاني",
  fast: "سريع · 2.500",
};

export function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <Loader2 className="spin-ring text-steel" size={24} />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone,
  ltr,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "danger";
  ltr?: boolean;
}) {
  const toneCls =
    tone === "danger"
      ? "text-red-600"
      : tone === "warn"
        ? "text-amber-600"
        : "text-ink";
  return (
    <div className="rounded-xl border border-mist bg-white p-5">
      <p className="text-xs text-steel">{label}</p>
      <p dir={ltr ? "ltr" : undefined} className={`mt-2 truncate text-2xl font-semibold tracking-tight ${toneCls}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-steel">{hint}</p>}
    </div>
  );
}

export function EmptyCard({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-mist bg-paper p-10 text-center">
      <Inbox size={22} strokeWidth={1.5} className="text-steel" />
      <p className="text-sm text-graphite">{text}</p>
    </div>
  );
}

export function ErrorCard({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-mist bg-paper p-10 text-center">
      <AlertTriangle size={22} strokeWidth={1.5} className="text-amber-600" />
      <p className="text-sm text-graphite">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-9 rounded-lg border border-mist bg-white px-4 text-xs font-medium text-ink transition-colors hover:border-steel"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function formatOMR(n: number) {
  return `${Number(n).toFixed(3)} ر.ع`;
}

/* ————————————————— Toasts ————————————————— */

type Toast = { id: number; kind: "success" | "error" | "info"; text: string };
type ToastCtx = {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
  confirmDanger: (message: string) => Promise<boolean>;
};

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let toastSeq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<
    { message: string; resolve: (v: boolean) => void } | null
  >(null);

  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = toastSeq++;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const api: ToastCtx = useMemo(
    () => ({
      success: (text: string) => push("success", text),
      error: (text: string) => push("error", text),
      info: (text: string) => push("info", text),
      confirmDanger: (message: string) =>
        new Promise<boolean>((resolve) => setConfirmState({ message, resolve })),
    }),
    [push]
  );

  const closeConfirm = (v: boolean) => {
    confirmState?.resolve(v);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toast stack */}
      <div className="pointer-events-none fixed bottom-4 start-4 z-[90] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg shadow-ink/5 ${
              t.kind === "success"
                ? "border-emerald-200 bg-white text-emerald-800"
                : t.kind === "error"
                  ? "border-red-200 bg-white text-red-700"
                  : "border-mist bg-white text-graphite"
            }`}
          >
            {t.kind === "success" ? (
              <Check size={16} strokeWidth={2.2} className="shrink-0 text-emerald-600" />
            ) : t.kind === "error" ? (
              <X size={16} strokeWidth={2.2} className="shrink-0 text-red-600" />
            ) : (
              <AlertTriangle size={16} strokeWidth={1.8} className="shrink-0 text-amber-500" />
            )}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-mist bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle size={18} strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">تأكيد العملية</h3>
                <p className="mt-1.5 text-sm leading-6 text-graphite">{confirmState.message}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="h-10 rounded-lg border border-mist px-5 text-sm text-graphite transition-colors hover:border-steel hover:text-ink"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className="h-10 rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                نعم، تابع
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
