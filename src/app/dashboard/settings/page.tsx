"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "../ui";

type Setting = { key: string; value: unknown };
type Delivery = { code: string; label: string; desc: string; fee: number; eta: string; active: boolean };
type Payment = { code: string; label: string; desc: string; requires_receipt: boolean; active: boolean };

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [delivery, setDelivery] = useState<Delivery[]>([]);
  const [payment, setPayment] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/admin/settings", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setSettings(d.settings ?? []);
    setDelivery(d.delivery ?? []);
    setPayment(d.payment ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveKV = async (key: string, value: unknown) => {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSaving(false);
    await load();
  };

  const inputCls = "h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm outline-none focus:border-accent";

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-xl border border-mist bg-white p-5">
        <h3 className="text-sm font-semibold text-ink">الإعدادات العامة</h3>
        <div className="mt-4 space-y-3">
          {settings.map((s) => (
            <div key={s.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-mist px-4 py-2.5">
              <span dir="ltr" className="text-xs font-medium text-ink">{s.key}</span>
              <code className="max-w-[60%] truncate rounded bg-paper px-2 py-1 text-[11px] text-graphite" dir="ltr">
                {JSON.stringify(s.value)}
              </code>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <input className={`${inputCls} min-w-40 flex-1`} placeholder="key" value={newKey} onChange={(e) => setNewKey(e.target.value)} dir="ltr" />
          <input className={`${inputCls} min-w-40 flex-1`} placeholder='value (JSON مثل "25")' value={newVal} onChange={(e) => setNewVal(e.target.value)} dir="ltr" />
          <button
            type="button"
            onClick={async () => {
              if (!newKey.trim()) return;
              let v: unknown = newVal;
              try { v = JSON.parse(newVal); } catch { /* نص عادي */ }
              await saveKV(newKey.trim(), v);
              setNewKey("");
              setNewVal("");
            }}
            disabled={saving || !newKey.trim()}
            className="h-10 rounded-lg bg-ink px-5 text-sm font-medium text-white hover:bg-accent disabled:opacity-40"
          >
            حفظ
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-mist bg-white p-5">
        <h3 className="text-sm font-semibold text-ink">طرق التوصيل</h3>
        <div className="mt-3 space-y-2">
          {delivery.map((d) => (
            <div key={d.code} className="flex items-center justify-between rounded-lg border border-mist px-4 py-2.5 text-sm">
              <span className="font-medium text-ink">{d.label}</span>
              <span className="text-xs text-graphite">{d.fee === 0 ? "مجاني" : `${Number(d.fee).toFixed(3)} ر.ع`} · {d.eta}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-mist bg-white p-5">
        <h3 className="text-sm font-semibold text-ink">طرق الدفع</h3>
        <div className="mt-3 space-y-2">
          {payment.map((p) => (
            <div key={p.code} className="flex items-center justify-between rounded-lg border border-mist px-4 py-2.5 text-sm">
              <span className="font-medium text-ink">{p.label}</span>
              <span className="text-xs text-graphite">{p.requires_receipt ? "يتطلب إيصال" : "مباشر"}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs leading-6 text-steel">
        إعدادات البريد (Resend) وWhatsApp تُدار عبر متغيرات البيئة على الخادم — لا تُخزن في قاعدة البيانات ولا تظهر هنا حفاظاً على الأمان.
      </p>
    </div>
  );
}
