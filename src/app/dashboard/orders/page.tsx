"use client";

import { useCallback, useEffect, useState } from "react";
import { formatOMR, PAYMENT_AR, Spinner, STATUS_AR, STATUS_STYLE } from "../ui";

type Order = {
  id: string;
  status: string;
  total: number;
  payment_method: string;
  delivery_method: string;
  ship_name: string;
  ship_city: string;
  placed_at: string;
};

const STATUSES = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
    const d = await res.json().catch(() => ({ orders: [] }));
    setOrders(d.orders ?? []);
    setLoading(false);
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-lg border border-mist bg-white px-3 text-sm text-ink outline-none focus:border-accent"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "كل الحالات" : STATUS_AR[s]}
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث برقم الطلب أو العميل…"
          className="h-10 min-w-52 flex-1 rounded-lg border border-mist bg-white px-3.5 text-sm outline-none focus:border-accent"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-mist bg-paper p-8 text-center text-sm text-graphite">
          لا توجد طلبات مطابقة.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-mist bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-paper text-xs text-steel">
              <tr>
                <th className="px-4 py-3 text-start font-medium">رقم الطلب</th>
                <th className="px-4 py-3 text-start font-medium">العميل</th>
                <th className="px-4 py-3 text-start font-medium">الإجمالي</th>
                <th className="px-4 py-3 text-start font-medium">الدفع</th>
                <th className="px-4 py-3 text-start font-medium">التوصيل</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
                <th className="px-4 py-3 text-start font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-mist align-middle">
                  <td className="px-4 py-3">
                    <a href={`/dashboard/orders/${o.id}`} dir="ltr" className="font-medium text-ink hover:text-accent">
                      {o.id}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-graphite">{o.ship_name}</span>
                    <span className="block text-xs text-steel">{o.ship_city}</span>
                  </td>
                  <td className="px-4 py-3">{formatOMR(Number(o.total))}</td>
                  <td className="px-4 py-3 text-xs text-graphite">{PAYMENT_AR[o.payment_method] ?? o.payment_method}</td>
                  <td className="px-4 py-3 text-xs text-graphite">{o.delivery_method === "fast" ? "سريع" : "عادي"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      disabled={busy === o.id}
                      onChange={(e) => setStatus(o.id, e.target.value)}
                      className={`h-8 rounded-md border-0 px-2 text-[11px] outline-none ${STATUS_STYLE[o.status] ?? ""}`}
                    >
                      {STATUSES.slice(1).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_AR[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-steel">
                    {new Date(o.placed_at).toLocaleDateString("ar-OM")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
