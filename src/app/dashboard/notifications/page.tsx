"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Send, FileText } from "lucide-react";
import { Spinner, EmptyCard, ErrorCard, useToast, formatOMR } from "../ui";

/* ============================================================
 * ALDIRXON Dashboard — متابعة الإشعارات
 * • آخر الطلبات مع حالة (بريد العميل/واتساب العميل/إيميل الإدارة/واتساب الإدارة)
 * • إعادة إرسال أي قناة بضغطة — وفتح الفاتورة مباشرة
 * ============================================================ */

type LogRow = { channel: string; status: string; error: string | null; created_at: string };
type OrderRow = {
  id: string;
  ship_name: string;
  ship_phone: string;
  total: number | string;
  status: string;
  placed_at: string;
};

const CHANNEL_AR: Record<string, string> = {
  email: "بريد العميل",
  whatsapp: "واتساب العميل",
  admin_email: "بريد الإدارة",
  admin_whatsapp: "واتساب الإدارة",
};
const CHANNEL_ICON: Record<string, string> = {
  email: "📧",
  whatsapp: "💬",
  admin_email: "🔔",
  admin_whatsapp: "🔔",
};

export default function NotificationsPage() {
  const { success, error } = useToast();
  const [rows, setRows] = useState<
    { order: OrderRow; logs: LogRow[]; invoiceUrl: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const d = await fetch("/api/admin/notify/logs", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .catch(() => ({}));
      setRows(d.rows ?? []);
    } catch {
      setErr("تعذّر تحميل سجل الإشعارات.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resend = async (orderId: string, channel: string) => {
    setBusyId(`${orderId}:${channel}`);
    try {
      const r = await fetch("/api/admin/notify/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, channel }),
      }).then((r) => r.json());
      if (r.ok) {
        const res = r.results?.[channel] ?? r.results;
        if (res?.ok || (channel === "all" && r.results)) {
          const failed = Object.entries(r.results ?? {})
            .filter(([, v]) => !(v as { ok: boolean }).ok)
            .map(([k]) => k);
          if (failed.length === 0) success("أُعيد الإرسال بنجاح ✓");
          else if (failed.length < Object.keys(r.results ?? {}).length)
            error(`أُرسلت بعض القنوات — فشل: ${failed.join(", ")}`);
          else error(`فشل الإرسال — راجع حالة القنوات.`);
        } else {
          error("تعذّر إعادة الإرسال.");
        }
        load();
      } else {
        error("تعذّر إعادة الإرسال.");
      }
    } catch {
      error("تعذّر الاتصال.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorCard text={err} onRetry={load} />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">متابعة الإشعارات</h2>
          <p className="mt-1 text-xs text-steel">
            حالة كل إرسال لكل طلب — اضغط أي قناة لإعادة الإرسال
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex h-9 items-center gap-2 rounded-lg border border-mist bg-white px-4 text-xs font-medium text-ink transition-colors hover:border-steel"
        >
          <RefreshCw size={14} strokeWidth={1.8} className={loading ? "spin-ring" : ""} />
          تحديث
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyCard text="لا توجد إشعارات بعد — ستظهر هنا بعد أول طلب." />
      ) : (
        <div className="space-y-3">
          {rows.map(({ order, logs, invoiceUrl }) => (
            <div key={order.id} className="rounded-xl border border-mist bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    <span dir="ltr">{order.id}</span> — {order.ship_name} —{" "}
                    {formatOMR(Number(order.total))}
                  </p>
                  <p className="mt-0.5 text-xs text-steel">
                    {new Date(order.placed_at).toLocaleString("ar-OM", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {invoiceUrl && (
                    <a
                      href={invoiceUrl}
                      target="_blank"
                      rel="noopener"
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-mist bg-white px-3 text-xs font-medium text-ink transition-colors hover:border-steel"
                    >
                      <FileText size={13} strokeWidth={1.8} />
                      الفاتورة
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => resend(order.id, "all")}
                    disabled={busyId !== null}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-medium text-white transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <Send size={13} strokeWidth={1.8} />
                    إعادة إرسال الكل
                  </button>
                </div>
              </div>

              {/* حالة القنوات — كل زر يعيد الإرسال */}
              <div className="mt-3 flex flex-wrap gap-2">
                {["email", "whatsapp", "admin_email", "admin_whatsapp"].map((ch) => {
                  const log = logs.find((l) => l.channel === ch);
                  const status = log?.status;
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => resend(order.id, ch)}
                      disabled={busyId !== null}
                      title="اضغط لإعادة الإرسال"
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                        status === "sent"
                          ? "bg-emerald-50 text-emerald-700"
                          : status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-paper text-steel"
                      }`}
                    >
                      <span>{CHANNEL_ICON[ch]}</span>
                      {CHANNEL_AR[ch]}
                      <span className="text-[10px] opacity-70">
                        {status === "sent" ? "✓" : status === "failed" ? "✗" : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {logs.some((l) => l.status === "failed" && l.error) && (
                <p className="mt-2 text-[11px] text-steel">
                  {(() => {
                    const e = logs.find((l) => l.status === "failed" && l.error)?.error;
                    if (e === "email_not_configured")
                      return "⚠️ RESEND_API_KEY غير مضبوط — أضفه كـ Secret على الـ Worker ثم اضغط إعادة الإرسال.";
                    if (e === "whatsapp_not_configured" || e === "whatsapp_admin_not_configured")
                      return "⚠️ WhatsApp Cloud API غير مضبوط — أضف الأسرار المطلوبة ثم أعد الإرسال.";
                    return `آخر خطأ: ${e}`;
                  })()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
