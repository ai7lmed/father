"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "../ui";

type Coupon = {
  id: string;
  code: string;
  discount_amount: number;
  minimum_product_price: number;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", discount: "2", minimum: "12", expires: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/admin/coupons", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setCoupons(d.coupons ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setSaving(true);
    await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        discount_amount: Number(form.discount),
        minimum_product_price: Number(form.minimum),
        expires_at: form.expires || null,
      }),
    });
    setSaving(false);
    setForm({ code: "", discount: "2", minimum: "12", expires: "" });
    await load();
  };

  const inputCls = "h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm outline-none focus:border-accent";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl border border-mist bg-white p-5">
        <h3 className="text-sm font-semibold text-ink">إنشاء كوبون</h3>
        <div className="mt-4 grid gap-3.5 sm:grid-cols-4">
          <input className={inputCls} placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} dir="ltr" />
          <input className={inputCls} placeholder="الخصم ر.ع" type="number" step="0.1" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} dir="ltr" />
          <input className={inputCls} placeholder="حد أدنى ر.ع" type="number" step="0.1" value={form.minimum} onChange={(e) => setForm({ ...form, minimum: e.target.value })} dir="ltr" />
          <input className={inputCls} type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} dir="ltr" />
        </div>
        <button
          type="button"
          onClick={create}
          disabled={saving || !form.code.trim()}
          className="mt-4 h-10 rounded-lg bg-ink px-6 text-sm font-medium text-white hover:bg-accent disabled:opacity-40"
        >
          {saving ? "…" : "إنشاء"}
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-mist bg-white">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-paper text-xs text-steel">
              <tr>
                <th className="px-4 py-3 text-start font-medium">الكود</th>
                <th className="px-4 py-3 text-start font-medium">الخصم</th>
                <th className="px-4 py-3 text-start font-medium">الحد الأدنى</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
                <th className="px-4 py-3 text-start font-medium">ينتهي</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-graphite">لا توجد كوبونات بعد.</td></tr>
              ) : (
                coupons.map((c) => {
                  const used = Boolean(c.used_at);
                  const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
                  return (
                    <tr key={c.id} className="border-t border-mist">
                      <td className="px-4 py-3 font-bold tracking-wider text-ink" dir="ltr">{c.code}</td>
                      <td className="px-4 py-3">{Number(c.discount_amount).toFixed(3)} ر.ع</td>
                      <td className="px-4 py-3 text-graphite">{Number(c.minimum_product_price).toFixed(3)} ر.ع</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] ${
                          used ? "bg-mist text-steel" : expired ? "bg-paper text-graphite ring-1 ring-mist" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {used ? "مستخدم" : expired ? "منتهي" : "فعّال"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-steel" dir="ltr">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString("ar-OM") : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
